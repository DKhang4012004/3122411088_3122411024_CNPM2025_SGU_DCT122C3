package com.cnpm.foodfast.Payment.controller;

import com.cnpm.foodfast.dto.response.API.APIResponse;
import com.cnpm.foodfast.entity.PayoutBatch;
import com.cnpm.foodfast.entity.Store;
import com.cnpm.foodfast.Payment.service.LedgerService;
import com.cnpm.foodfast.Store.repository.StoreRepository;
import com.cnpm.foodfast.User.repository.UserRepository;
import com.cnpm.foodfast.exception.BadRequestException;
import com.cnpm.foodfast.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ledger")
@RequiredArgsConstructor
@Slf4j
public class LedgerController {

    private final LedgerService ledgerService;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    /**
     * ✅ Validate store ownership - chỉ chủ cửa hàng hoặc admin mới được truy cập
     */
    private void validateStoreAccess(Long storeId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            log.info("Admin {} accessing store ledger: {}", username, storeId);
            return; // Admin có quyền xem tất cả
        }
        
        // Lấy userId từ username
        Long userId = userRepository.findIdByUsername(username);
        if (userId == null) {
            throw new ResourceNotFoundException("User not found: " + username);
        }
        
        // Kiểm tra xem user có phải chủ cửa hàng không
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found: " + storeId));
        
        if (!store.getOwnerUserId().equals(userId)) {
            log.warn("User {} (ID: {}) attempted to access store ledger {} (Owner: {}) without permission", 
                     username, userId, storeId, store.getOwnerUserId());
            throw new BadRequestException("Bạn không có quyền xem sổ cái của cửa hàng này");
        }
        
        log.info("Store owner {} (ID: {}) accessing own ledger: {}", username, userId, storeId);
    }

    /**
     * Get unpaid amount for a store (Store owner can view their own, Admin can view all)
     */
    @GetMapping("/store/{storeId}/unpaid-amount")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    public ResponseEntity<APIResponse<BigDecimal>> getUnpaidAmount(@PathVariable Long storeId) {
        log.info("Getting unpaid amount for store: {}", storeId);
        
        validateStoreAccess(storeId);

        BigDecimal unpaidAmount = ledgerService.getUnpaidAmountForStore(storeId);

        return ResponseEntity.ok(APIResponse.<BigDecimal>builder()
                .code(200)
                .message("Unpaid amount retrieved successfully")
                .result(unpaidAmount)
                .build());
    }

    /**
     * Create payout batch for a store (Admin only - Tạo lô thanh toán)
     */
    @PostMapping("/store/{storeId}/payout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<PayoutBatch>> createPayoutBatch(@PathVariable Long storeId) {
        log.info("Creating payout batch for store: {}", storeId);

        PayoutBatch payoutBatch = ledgerService.createPayoutBatchForStore(storeId);

        return ResponseEntity.ok(APIResponse.<PayoutBatch>builder()
                .code(200)
                .message("Payout batch created successfully")
                .result(payoutBatch)
                .build());
    }

    /**
     * Mark payout batch as paid (Admin only - Đánh dấu đã thanh toán)
     */
    @PostMapping("/payout/{payoutBatchId}/mark-paid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> markPayoutAsPaid(
            @PathVariable Long payoutBatchId,
            @RequestParam String transactionCode) {
        log.info("Marking payout batch as paid: {}", payoutBatchId);

        ledgerService.markPayoutBatchAsPaid(payoutBatchId, transactionCode);

        return ResponseEntity.ok(APIResponse.<Void>builder()
                .code(200)
                .message("Payout batch marked as paid successfully")
                .build());
    }

    /**
     * Get all payout batches for a store (Store owner can view their own, Admin can view all)
     */
    @GetMapping("/store/{storeId}/payouts")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    public ResponseEntity<APIResponse<List<PayoutBatch>>> getPayoutBatches(@PathVariable Long storeId) {
        log.info("Getting payout batches for store: {}", storeId);
        
        validateStoreAccess(storeId);

        List<PayoutBatch> payoutBatches = ledgerService.getPayoutBatchesByStore(storeId);

        return ResponseEntity.ok(APIResponse.<List<PayoutBatch>>builder()
                .code(200)
                .message("Payout batches retrieved successfully")
                .result(payoutBatches)
                .build());
    }

    /**
     * Get all ledger entries for a store (Store owner can view their own, Admin can view all)
     */
    @GetMapping("/store/{storeId}/entries")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    public ResponseEntity<APIResponse<List<com.cnpm.foodfast.entity.StoreLedger>>> getLedgerEntries(@PathVariable Long storeId) {
        log.info("Getting ledger entries for store: {}", storeId);
        
        validateStoreAccess(storeId);

        List<com.cnpm.foodfast.entity.StoreLedger> ledgerEntries = ledgerService.getLedgerEntriesByStore(storeId);

        return ResponseEntity.ok(APIResponse.<List<com.cnpm.foodfast.entity.StoreLedger>>builder()
                .code(200)
                .message("Ledger entries retrieved successfully")
                .result(ledgerEntries)
                .build());
    }
}
