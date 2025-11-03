package com.cnpm.foodfast.Payment.service;

import com.cnpm.foodfast.dto.request.payment.PaymentInitRequest;
import com.cnpm.foodfast.dto.request.payment.VnPayWebhookPayload;
import com.cnpm.foodfast.dto.response.payment.PaymentResponse;

public interface PaymentService {

    /**
     * Initialize payment transaction
     */
    PaymentResponse initPayment(PaymentInitRequest request);

    /**
     * Process VNPay webhook callback
     */
    void processVnPayWebhook(VnPayWebhookPayload payload);

    /**
     * Process VNPay IPN (Instant Payment Notification)
     * @param payload VNPay IPN payload
     * @return Response code: "00" = Success, "01" = Order not found, "02" = Already confirmed, "04" = Invalid amount, "99" = Error
     */
    String processVnPayIPN(VnPayWebhookPayload payload);

    /**
     * Get payment by order ID
     */
    PaymentResponse getPaymentByOrderId(Long orderId);

    /**
     * Verify VNPay signature
     */
    boolean verifyVnPaySignature(VnPayWebhookPayload payload);
}
