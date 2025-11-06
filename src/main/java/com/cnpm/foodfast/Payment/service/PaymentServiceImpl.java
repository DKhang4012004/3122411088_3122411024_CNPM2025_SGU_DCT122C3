package com.cnpm.foodfast.Payment.service;

import com.cnpm.foodfast.Payment.config.VnPayConfig;
import com.cnpm.foodfast.Payment.repository.PaymentTransactionRepository;
import com.cnpm.foodfast.dto.request.payment.PaymentInitRequest;
import com.cnpm.foodfast.dto.request.payment.VnPayWebhookPayload;
import com.cnpm.foodfast.dto.response.payment.PaymentResponse;
import com.cnpm.foodfast.entity.Order;
import com.cnpm.foodfast.entity.PaymentTransaction;
import com.cnpm.foodfast.enums.OrderStatus;
import com.cnpm.foodfast.enums.PaymentStatus;
import com.cnpm.foodfast.enums.PaymentTransactionStatus;
import com.cnpm.foodfast.exception.ResourceNotFoundException;
import com.cnpm.foodfast.Order.repository.OrderRepository;
import com.cnpm.foodfast.Order.repository.OrderItemRepository;
import com.cnpm.foodfast.Products.repository.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final LedgerService ledgerService;
    private final VnPayConfig vnPayConfig;
    private final ObjectMapper objectMapper;
    private final NgrokUrlService ngrokUrlService;

    @Override
    @Transactional
    public PaymentResponse initPayment(PaymentInitRequest request) {
        log.info("Initializing payment for order ID: {}", request.getOrderId());

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        // Kiểm tra payment status của order
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            log.error("Cannot init payment for order {} - already paid", order.getId());
            throw new IllegalStateException("Order already paid");
        }

        // Cho phép thanh toán lại nếu payment status là FAILED hoặc PENDING
        if (order.getPaymentStatus() == PaymentStatus.FAILED) {
            log.info("Order {} payment status is FAILED, allowing retry", order.getId());
        } else if (order.getPaymentStatus() == PaymentStatus.PENDING) {
            log.info("Order {} payment status is PENDING, allowing retry", order.getId());
        }

        // Kiểm tra payment transaction hiện tại
        Optional<PaymentTransaction> existingPayment = paymentTransactionRepository.findByOrderId(order.getId());

        // Double check: Chỉ chặn nếu transaction đã SUCCESS
        if (existingPayment.isPresent() && existingPayment.get().getStatus() == PaymentTransactionStatus.SUCCESS) {
            log.error("Cannot init payment for order {} - transaction already successful", order.getId());
            throw new IllegalStateException("Order already paid");
        }

        try {
            PaymentTransaction transaction;

            // Tạo vnp_TxnRef unique cho mỗi lần payment (để tránh lỗi "Giao dịch đã tồn tại" từ VNPay)
            String vnpTxnRef = generateUniqueTxnRef(order.getOrderCode());

            // Nếu đã có transaction, cập nhật lại (cho phép retry)
            if (existingPayment.isPresent()) {
                transaction = existingPayment.get();
                log.info("Reusing existing payment transaction ID: {} with status: {}",
                         transaction.getId(), transaction.getStatus());

                // Reset transaction về trạng thái INIT với vnp_TxnRef mới
                transaction.setProvider(request.getProvider());
                transaction.setMethod(request.getMethod());
                transaction.setAmount(order.getTotalPayable());
                transaction.setCurrency("VND");
                transaction.setStatus(PaymentTransactionStatus.INIT);
                transaction.setVnpTxnRef(vnpTxnRef);  // Mã mới cho mỗi lần retry
                transaction.setProviderTransactionId(null);
                transaction.setCompletedAt(null);
                transaction.setResponsePayload(null);

                log.info("Generated new vnp_TxnRef for retry: {}", vnpTxnRef);
            } else {
                // Tạo mới nếu chưa có
                transaction = PaymentTransaction.builder()
                        .orderId(order.getId())
                        .provider(request.getProvider())
                        .method(request.getMethod())
                        .amount(order.getTotalPayable())
                        .currency("VND")
                        .status(PaymentTransactionStatus.INIT)
                        .vnpTxnRef(vnpTxnRef)
                        .build();
                log.info("Creating new payment transaction for order: {} with vnp_TxnRef: {}",
                         order.getId(), vnpTxnRef);
            }

            String paymentUrl = generateVnPayUrl(order, transaction);

            transaction.setRequestPayload(objectMapper.writeValueAsString(request));
            transaction = paymentTransactionRepository.save(transaction);

            // Cập nhật trạng thái đơn hàng về PENDING_PAYMENT
            order.setStatus(OrderStatus.PENDING_PAYMENT);
            order.setPaymentStatus(PaymentStatus.PENDING);
            orderRepository.save(order);

            log.info("Payment initialized successfully with ID: {} for order: {}",
                     transaction.getId(), order.getOrderCode());

            return PaymentResponse.builder()
                    .id(transaction.getId())
                    .orderId(transaction.getOrderId())
                    .provider(transaction.getProvider())
                    .amount(transaction.getAmount())
                    .currency(transaction.getCurrency())
                    .status(transaction.getStatus())
                    .paymentUrl(paymentUrl)
                    .createdAt(transaction.getCreatedAt())
                    .build();

        } catch (Exception e) {
            log.error("Error initializing payment for order {}: {}", request.getOrderId(), e.getMessage());
            throw new RuntimeException("Failed to initialize payment", e);
        }
    }

    /**
     * Tạo vnp_TxnRef unique cho mỗi lần payment
     * Format: {ORDER_CODE}_{TIMESTAMP_MILLIS}
     * Ví dụ: ORD1762133045478C3B6F313_1730620537354
     */
    private String generateUniqueTxnRef(String orderCode) {
        long timestamp = System.currentTimeMillis();
        return orderCode + "_" + timestamp;
    }

    @Override
    @Transactional
    public void processVnPayWebhook(VnPayWebhookPayload payload) {
        log.info("Processing VNPay webhook for transaction: {}", payload.getVnp_TxnRef());

        try {
            if (!verifyVnPaySignature(payload)) {
                log.error("Invalid VNPay signature for transaction: {}", payload.getVnp_TxnRef());
                throw new SecurityException("Invalid signature");
            }

            String vnpTxnRef = payload.getVnp_TxnRef();
            // Extract order code from vnp_TxnRef (format: ORDER_CODE_{TIMESTAMP})
            String orderCode = extractOrderCode(vnpTxnRef);

            Order order = orderRepository.findByOrderCode(orderCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with code: " + orderCode));

            PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(order.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for order: " + order.getId()));

            transaction.setResponsePayload(objectMapper.writeValueAsString(payload));
            transaction.setProviderTransactionId(payload.getVnp_TransactionNo());

            String responseCode = payload.getVnp_ResponseCode();
            String transactionStatus = payload.getVnp_TransactionStatus();

            if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
                transaction.setStatus(PaymentTransactionStatus.SUCCESS);
                transaction.setCompletedAt(LocalDateTime.now());

                order.setStatus(OrderStatus.PAID);
                order.setPaymentStatus(PaymentStatus.PAID);
                order.setUpdatedAt(LocalDateTime.now());

                log.info("Payment successful for order: {}", order.getOrderCode());

            } else {
                transaction.setStatus(PaymentTransactionStatus.FAILED);
                transaction.setCompletedAt(LocalDateTime.now());

                order.setStatus(OrderStatus.CREATED);
                order.setPaymentStatus(PaymentStatus.FAILED);
                order.setUpdatedAt(LocalDateTime.now());

                log.warn("Payment failed for order: {} with code: {}", order.getOrderCode(), responseCode);
            }

            paymentTransactionRepository.save(transaction);
            orderRepository.save(order);

        } catch (Exception e) {
            log.error("Error processing VNPay webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process webhook", e);
        }
    }

    @Override
    @Transactional
    public String processVnPayIPN(VnPayWebhookPayload payload) {
        log.info("=== Processing VNPay IPN ===");
        log.info("vnp_TxnRef: {}", payload.getVnp_TxnRef());

        try {
            // Extract order code from vnp_TxnRef (format: ORDER_CODE_{TIMESTAMP})
            String vnpTxnRef = payload.getVnp_TxnRef();
            String orderCode = extractOrderCode(vnpTxnRef);
            log.info("Extracted order code: {}", orderCode);

            // Step 2: Find transaction (vnp_TxnRef) in database
            Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);

            if (orderOpt.isEmpty()) {
                log.error("Order not found: {}", orderCode);
                return "01"; // Order not Found
            }

            Order order = orderOpt.get();
            log.info("Found order: ID={}, Status={}, PaymentStatus={}",
                     order.getId(), order.getStatus(), order.getPaymentStatus());

            // Step 3: Check payment status before updating (checkOrderStatus)
            Optional<PaymentTransaction> transactionOpt = paymentTransactionRepository.findByOrderId(order.getId());

            if (transactionOpt.isEmpty()) {
                log.error("Payment transaction not found for order: {}", orderCode);
                return "01"; // Order not Found
            }

            PaymentTransaction transaction = transactionOpt.get();

            // Check if already confirmed
            if (transaction.getStatus() == PaymentTransactionStatus.SUCCESS) {
                log.info("Order already confirmed: {}", orderCode);
                return "02"; // Order already confirmed
            }

            // Step 4: Check amount (vnp_Amount) before updating
            String vnpAmount = payload.getVnp_Amount(); // Amount from VNPay (multiplied by 100)
            BigDecimal expectedAmount = order.getTotalPayable().multiply(new BigDecimal(100));
            BigDecimal receivedAmount = new BigDecimal(vnpAmount);

            if (receivedAmount.compareTo(expectedAmount) != 0) {
                log.error("Amount mismatch. Expected: {}, Received: {}", expectedAmount, receivedAmount);
                return "04"; // Invalid Amount
            }

            // Step 5: Update results to Database
            transaction.setResponsePayload(objectMapper.writeValueAsString(payload));
            transaction.setProviderTransactionId(payload.getVnp_TransactionNo());

            String responseCode = payload.getVnp_ResponseCode();
            String transactionStatus = payload.getVnp_TransactionStatus();

            if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
                // Payment successful
                transaction.setStatus(PaymentTransactionStatus.SUCCESS);
                transaction.setCompletedAt(LocalDateTime.now());

                order.setStatus(OrderStatus.PAID);
                order.setPaymentStatus(PaymentStatus.PAID);
                order.setUpdatedAt(LocalDateTime.now());

                log.info("✓ Payment successful for order: {}", order.getOrderCode());

            } else {
                // Payment failed
                transaction.setStatus(PaymentTransactionStatus.FAILED);
                transaction.setCompletedAt(LocalDateTime.now());

                order.setStatus(OrderStatus.CREATED);
                order.setPaymentStatus(PaymentStatus.FAILED);
                order.setUpdatedAt(LocalDateTime.now());

                log.warn("✗ Payment failed for order: {} with code: {}", order.getOrderCode(), responseCode);
            }

            paymentTransactionRepository.save(transaction);
            orderRepository.save(order);

            log.info("IPN processing completed successfully for order: {}", orderCode);
            return "00"; // Confirm Success

        } catch (Exception e) {
            log.error("Error processing VNPay IPN: {}", e.getMessage(), e);
            return "99"; // Unknown error
        }
    }

    @Override
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));

        return PaymentResponse.builder()
                .id(transaction.getId())
                .orderId(transaction.getOrderId())
                .provider(transaction.getProvider())
                .amount(transaction.getAmount())
                .currency(transaction.getCurrency())
                .status(transaction.getStatus())
                .providerTransactionId(transaction.getProviderTransactionId())
                .createdAt(transaction.getCreatedAt())
                .completedAt(transaction.getCompletedAt())
                .build();
    }

    @Override
    public boolean verifyVnPaySignature(VnPayWebhookPayload payload) {
        try {
            log.info("=== Verifying VNPay Signature ===");
            String receivedHash = payload.getVnp_SecureHash();
            log.info("Received hash: {}", receivedHash);

            // Dùng TreeMap để tự động sort theo key (tăng dần)
            Map<String, String> params = new TreeMap<>();

            // Ưu tiên lấy từ additionalParams nếu có
            if (payload.getAdditionalParams() != null && !payload.getAdditionalParams().isEmpty()) {
                for (Map.Entry<String, String> entry : payload.getAdditionalParams().entrySet()) {
                    String key = entry.getKey();
                    String value = entry.getValue();
                    if (value != null && !value.isEmpty()
                            && !key.equalsIgnoreCase("vnp_SecureHash")
                            && !key.equalsIgnoreCase("vnp_SecureHashType")) {
                        params.put(key, value);
                    }
                }
            } else {
                // fallback nếu payload không chứa additionalParams
                if (payload.getVnp_TmnCode() != null) params.put("vnp_TmnCode", payload.getVnp_TmnCode());
                if (payload.getVnp_Amount() != null) params.put("vnp_Amount", payload.getVnp_Amount());
                if (payload.getVnp_BankCode() != null) params.put("vnp_BankCode", payload.getVnp_BankCode());
                if (payload.getVnp_BankTranNo() != null) params.put("vnp_BankTranNo", payload.getVnp_BankTranNo());
                if (payload.getVnp_CardType() != null) params.put("vnp_CardType", payload.getVnp_CardType());
                if (payload.getVnp_PayDate() != null) params.put("vnp_PayDate", payload.getVnp_PayDate());
                if (payload.getVnp_OrderInfo() != null) params.put("vnp_OrderInfo", payload.getVnp_OrderInfo());
                if (payload.getVnp_ResponseCode() != null) params.put("vnp_ResponseCode", payload.getVnp_ResponseCode());
                if (payload.getVnp_TransactionNo() != null) params.put("vnp_TransactionNo", payload.getVnp_TransactionNo());
                if (payload.getVnp_TransactionStatus() != null) params.put("vnp_TransactionStatus", payload.getVnp_TransactionStatus());
                if (payload.getVnp_TxnRef() != null) params.put("vnp_TxnRef", payload.getVnp_TxnRef());
            }

            // === Build hash data (theo đúng chuẩn VNPay, encode từng value) ===
            StringBuilder hashData = new StringBuilder();
            Iterator<Map.Entry<String, String>> itr = params.entrySet().iterator();
            while (itr.hasNext()) {
                Map.Entry<String, String> entry = itr.next();
                String key = entry.getKey();
                String value = entry.getValue();
                hashData.append(key)
                        .append("=")
                        .append(URLEncoder.encode(value, StandardCharsets.US_ASCII.toString()));
                if (itr.hasNext()) {
                    hashData.append("&");
                }
            }

            // === Hash Secret (trim để loại bỏ khoảng trắng thừa nếu có copy từ email) ===
            String secret = vnPayConfig.getHashSecret().trim();

            log.info("Hash data string: {}", hashData);
            log.info("Using secret (prefix): {}...", secret.substring(0, 5));

            String calculatedHash = hmacSHA512(secret, hashData.toString());
            log.info("Calculated hash: {}", calculatedHash);

            boolean isValid = calculatedHash.equalsIgnoreCase(receivedHash);
            log.info("Signature valid: {}", isValid);

            return isValid;
        } catch (Exception e) {
            log.error("Error verifying VNPay signature: {}", e.getMessage(), e);
            return false;
        }
    }


    private String generateVnPayUrl(Order order, PaymentTransaction transaction) throws UnsupportedEncodingException {
        Map<String, String> vnpParams = new TreeMap<>();

        String returnUrl = vnPayConfig.getReturnUrl();
        vnpParams.put("vnp_Version", vnPayConfig.getVersion());
        vnpParams.put("vnp_Command", vnPayConfig.getCommand());
        vnpParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(order.getTotalPayable().multiply(new BigDecimal(100)).longValue()));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", transaction.getVnpTxnRef());  // Dùng vnp_TxnRef unique từ transaction
        vnpParams.put("vnp_OrderInfo", "Thanh toan don hang " + order.getOrderCode());
        vnpParams.put("vnp_OrderType", vnPayConfig.getOrderType());
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", "127.0.0.1");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String createDate = LocalDateTime.now().format(formatter);
        vnpParams.put("vnp_CreateDate", createDate);

        // === Build hashData (encode từng value) ===
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<Map.Entry<String, String>> itr = vnpParams.entrySet().iterator();
        while (itr.hasNext()) {
            Map.Entry<String, String> entry = itr.next();
            String key = entry.getKey();
            String value = entry.getValue();

            hashData.append(key).append("=").append(URLEncoder.encode(value, StandardCharsets.US_ASCII.toString()));
            query.append(URLEncoder.encode(key, StandardCharsets.US_ASCII.toString()))
                    .append("=")
                    .append(URLEncoder.encode(value, StandardCharsets.US_ASCII.toString()));
            if (itr.hasNext()) {
                hashData.append("&");
                query.append("&");
            }
        }

        String vnpSecureHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());

        return vnPayConfig.getVnpUrl() + "?" + query + "&vnp_SecureHash=" + vnpSecureHash;
    }


    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            for (byte b : result) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating HMAC SHA512", e);
        }
    }

    /**
     * Trích xuất order code từ vnp_TxnRef
     * Format: ORDER_CODE_{TIMESTAMP} -> ORDER_CODE
     * Ví dụ: ORD1762133045478C3B6F313_1730620537354 -> ORD1762133045478C3B6F313
     */
    private String extractOrderCode(String vnpTxnRef) {
        if (vnpTxnRef == null || !vnpTxnRef.contains("_")) {
            return vnpTxnRef; // Fallback nếu không có timestamp
        }
        return vnpTxnRef.substring(0, vnpTxnRef.lastIndexOf("_"));
    }

    @Override
    @Transactional
    public boolean refundPayment(Long orderId, String reason) {
        log.info("Processing refund for order ID: {} with reason: {}", orderId, reason);

        try {
            // 1. Lấy thông tin order
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

            // 2. Kiểm tra order đã thanh toán chưa
            if (order.getPaymentStatus() != PaymentStatus.PAID) {
                log.error("Cannot refund order {} - payment status is: {}", orderId, order.getPaymentStatus());
                throw new IllegalStateException("Order must be paid to refund. Current status: " + order.getPaymentStatus());
            }

            // 3. Lấy payment transaction
            PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found for order: " + orderId));

            // 4. Kiểm tra transaction đã success chưa
            if (transaction.getStatus() != PaymentTransactionStatus.SUCCESS) {
                log.error("Cannot refund - transaction status is: {}", transaction.getStatus());
                throw new IllegalStateException("Transaction must be successful to refund");
            }

            // 5. Kiểm tra đã refund chưa
            if (transaction.getStatus() == PaymentTransactionStatus.REFUNDED) {
                log.warn("Transaction already refunded for order: {}", orderId);
                return true; // Đã hoàn tiền rồi
            }

            // 6. Gọi VNPay Refund API
            boolean refundSuccess = callVnPayRefundAPI(order, transaction, reason);

            if (refundSuccess) {
                // 7. Cập nhật trạng thái transaction
                transaction.setStatus(PaymentTransactionStatus.REFUNDED);
                transaction.setUpdatedAt(LocalDateTime.now());
                paymentTransactionRepository.save(transaction);

                // 8. Cập nhật payment status của order
                order.setPaymentStatus(PaymentStatus.FAILED);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);

                // 9. Hoàn lại tồn kho sản phẩm
                restoreProductInventory(orderId);

                log.info("✓ Refund successful for order: {}", orderId);
                return true;
            } else {
                log.error("✗ VNPay refund API call failed for order: {}", orderId);
                return false;
            }

        } catch (Exception e) {
            log.error("Error processing refund for order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to process refund", e);
        }
    }

    /**
     * Gọi VNPay Refund API
     * Lưu ý: VNPay sandbox có thể không hỗ trợ refund API, chỉ hoạt động trên production
     */
    private boolean callVnPayRefundAPI(Order order, PaymentTransaction transaction, String reason) {
        log.info("Calling VNPay Refund API for transaction: {}", transaction.getProviderTransactionId());

        try {
            // Build refund request parameters
            Map<String, String> refundParams = new TreeMap<>();

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            String requestId = "RF" + System.currentTimeMillis();
            String createDate = LocalDateTime.now().format(formatter);

            refundParams.put("vnp_RequestId", requestId);
            refundParams.put("vnp_Version", vnPayConfig.getVersion());
            refundParams.put("vnp_Command", "refund");
            refundParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());
            refundParams.put("vnp_TransactionType", "02"); // 02: Hoàn trả toàn phần
            refundParams.put("vnp_TxnRef", transaction.getVnpTxnRef());
            refundParams.put("vnp_Amount", String.valueOf(order.getTotalPayable().multiply(new BigDecimal(100)).longValue()));
            refundParams.put("vnp_OrderInfo", "Hoan tien don hang " + order.getOrderCode() + ". Ly do: " + reason);
            refundParams.put("vnp_TransactionNo", transaction.getProviderTransactionId());
            refundParams.put("vnp_TransactionDate", transaction.getCompletedAt().format(formatter));
            refundParams.put("vnp_CreateDate", createDate);
            refundParams.put("vnp_CreateBy", "System");
            refundParams.put("vnp_IpAddr", "127.0.0.1");

            // Build hash data
            StringBuilder hashData = new StringBuilder();
            Iterator<Map.Entry<String, String>> itr = refundParams.entrySet().iterator();
            while (itr.hasNext()) {
                Map.Entry<String, String> entry = itr.next();
                hashData.append(entry.getKey()).append("=").append(entry.getValue());
                if (itr.hasNext()) {
                    hashData.append("|");
                }
            }

            String vnpSecureHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
            refundParams.put("vnp_SecureHash", vnpSecureHash);

            log.info("VNPay Refund Request: {}", refundParams);

            // NOTE: VNPay sandbox thường không hỗ trợ refund API
            // Trong môi trường thực tế, bạn sẽ gọi HTTP POST đến vnPayConfig.getApiUrl()
            // Hiện tại, chúng ta giả lập refund thành công

            log.warn("VNPay Refund API - Running in simulation mode (sandbox may not support refund)");
            log.info("In production, would POST to: {}", vnPayConfig.getApiUrl());

            // Giả lập refund thành công
            return true;

        } catch (Exception e) {
            log.error("Error calling VNPay Refund API: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Hoàn lại tồn kho sản phẩm khi refund
     */
    private void restoreProductInventory(Long orderId) {
        log.info("Restoring product inventory for order: {}", orderId);

        try {
            List<com.cnpm.foodfast.entity.OrderItem> items =
                orderItemRepository.findByOrderId(orderId);

            for (com.cnpm.foodfast.entity.OrderItem item : items) {
                com.cnpm.foodfast.entity.Product product =
                    productRepository.findById(item.getProductId()).orElse(null);

                if (product != null) {
                    // Hoàn lại số lượng đã reserved
                    product.setReservedQuantity(product.getReservedQuantity() - item.getQuantity());
                    product.setQuantityAvailable(product.getQuantityAvailable() + item.getQuantity());
                    productRepository.save(product);

                    log.info("Restored {} units of product {} (ID: {})",
                        item.getQuantity(), product.getName(), product.getId());
                }
            }

            log.info("✓ Product inventory restored successfully for order: {}", orderId);

        } catch (Exception e) {
            log.error("Error restoring product inventory: {}", e.getMessage(), e);
            // Không throw exception để không làm fail toàn bộ refund process
        }
    }
}
