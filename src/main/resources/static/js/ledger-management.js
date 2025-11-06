// Ledger Management JavaScript
console.log('Ledger Management script loaded');

let currentStoreId = null;
let currentBatchId = null;
let isAdmin = false;
let allStores = [];
let unpaidEntriesCount = 0;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndInit();
});

// Check authentication and initialize
async function checkAuthAndInit() {
    if (!AuthHelper.isLoggedIn()) {
        Toast.warning('Vui lòng đăng nhập để xem sổ cái');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    const user = AuthHelper.getUser();
    
    // Check if user is Admin
    isAdmin = user.roles && user.roles.includes('ADMIN');
    
    if (isAdmin) {
        // Admin can view all stores
        document.getElementById('adminActions').style.display = 'block';
        document.getElementById('storeFilterSection').style.display = 'block';
        await loadAllStores();
        // Set to first store if available
        if (allStores.length > 0) {
            currentStoreId = allStores[0].id;
        }
    } else if (user.roles && user.roles.includes('STORE_OWNER')) {
        // Store owner - get their store ID
        await loadStoreOwnerStore();
    } else {
        Toast.error('Bạn không có quyền truy cập trang này');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    if (currentStoreId) {
        loadLedgerData();
    }

    // Update auth UI
    updateAuthUI(user);
}

// Load all stores (for admin)
async function loadAllStores() {
    try {
        const response = await APIHelper.get('/api/stores');
        allStores = response.result || [];
        
        const storeFilter = document.getElementById('storeFilter');
        storeFilter.innerHTML = allStores.map(store => 
            `<option value="${store.id}">${store.name || 'Cửa hàng #' + store.id}</option>`
        ).join('');
        
        if (allStores.length > 0) {
            storeFilter.value = allStores[0].id;
        }
    } catch (error) {
        console.error('Error loading stores:', error);
        Toast.error('Không thể tải danh sách cửa hàng');
    }
}

// Load store for store owner
async function loadStoreOwnerStore() {
    try {
        const user = AuthHelper.getUser();
        const response = await APIHelper.get(`/api/stores/owner/${user.id}`);
        const stores = response.result || [];
        
        if (stores.length > 0) {
            currentStoreId = stores[0].id;
        } else {
            Toast.error('Không tìm thấy cửa hàng của bạn');
        }
    } catch (error) {
        console.error('Error loading store:', error);
        Toast.error('Không thể tải thông tin cửa hàng');
    }
}

// Filter by store (admin only)
function filterByStore() {
    const storeFilter = document.getElementById('storeFilter');
    const selectedStoreId = parseInt(storeFilter.value);
    
    if (!selectedStoreId) {
        Toast.warning('Vui lòng chọn cửa hàng');
        return;
    }
    
    currentStoreId = selectedStoreId;
    loadLedgerData();
}

// Update auth UI
function updateAuthUI(user) {
    const guestMenu = document.getElementById('guestMenu');
    const userDropdown = document.getElementById('userDropdown');
    const userName = document.getElementById('userName');

    if (guestMenu) guestMenu.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'block';
    if (userName) userName.textContent = user.username || user.fullName || 'User';
}

// Load all ledger data
async function loadLedgerData() {
    Loading.show();
    
    try {
        await Promise.all([
            loadUnpaidAmount(),
            loadPayoutBatches(),
            loadLedgerEntries()
        ]);
    } catch (error) {
        console.error('Error loading ledger data:', error);
        Toast.error('Không thể tải dữ liệu sổ cái');
    } finally {
        Loading.hide();
    }
}

// Load unpaid amount
async function loadUnpaidAmount() {
    try {
        const response = await APIHelper.get(`/api/v1/ledger/store/${currentStoreId}/unpaid-amount`);
        const unpaidAmount = response.result || 0;
        
        // Update store name in header if admin
        if (isAdmin && allStores.length > 0) {
            const currentStore = allStores.find(s => s.id === currentStoreId);
            if (currentStore) {
                const headerElement = document.querySelector('.ledger-header h1');
                if (headerElement) {
                    headerElement.innerHTML = `<i class="fas fa-book"></i> Quản lý Sổ Cái - ${currentStore.name || 'Cửa hàng #' + currentStore.id}`;
                }
            }
        }
        
        document.getElementById('unpaidAmount').textContent = FormatHelper.currency(unpaidAmount);
    } catch (error) {
        console.error('Error loading unpaid amount:', error);
        document.getElementById('unpaidAmount').textContent = '0đ';
    }
}

// Load payout batches
async function loadPayoutBatches() {
    try {
        const response = await APIHelper.get(`/api/v1/ledger/store/${currentStoreId}/payouts`);
        const batches = response.result || [];
        
        displayPayoutBatches(batches);
        updateStats(batches);
    } catch (error) {
        console.error('Error loading payout batches:', error);
        showEmptyPayoutBatches();
    }
}

// Load ledger entries
async function loadLedgerEntries() {
    try {
        const response = await APIHelper.get(`/api/v1/ledger/store/${currentStoreId}/entries`);
        const entries = response.result || [];
        
        // Count unpaid entries
        unpaidEntriesCount = entries.filter(e => e.status === 'UNPAID').length;
        
        displayLedgerEntries(entries);
    } catch (error) {
        console.error('Error loading ledger entries:', error);
        showEmptyLedgerEntries();
    }
}

// Display payout batches
function displayPayoutBatches(batches) {
    const container = document.getElementById('payoutBatchesList');
    
    if (batches.length === 0) {
        showEmptyPayoutBatches();
        return;
    }

    container.innerHTML = batches.map(batch => `
        <div class="payout-batch-item">
            <div class="payout-header">
                <div class="payout-id">
                    <i class="fas fa-file-invoice-dollar"></i>
                    Batch #${batch.id}
                </div>
                <span class="payout-status ${getPayoutStatusClass(batch.status)}">
                    ${getPayoutStatusText(batch.status)}
                </span>
            </div>
            
            <div class="payout-details">
                <div class="payout-detail-item">
                    <span class="payout-detail-label">Số tiền</span>
                    <span class="payout-detail-value" style="color: var(--primary-color); font-size: 1.2rem;">
                        ${FormatHelper.currency(batch.totalPayoutAmount)}
                    </span>
                </div>
                <div class="payout-detail-item">
                    <span class="payout-detail-label">Ngày tạo</span>
                    <span class="payout-detail-value">${FormatHelper.date(batch.createdAt)}</span>
                </div>
                ${batch.processedAt ? `
                <div class="payout-detail-item">
                    <span class="payout-detail-label">Ngày thanh toán</span>
                    <span class="payout-detail-value">${FormatHelper.date(batch.processedAt)}</span>
                </div>
                ` : ''}
                ${batch.transactionCode ? `
                <div class="payout-detail-item">
                    <span class="payout-detail-label">Mã giao dịch</span>
                    <span class="payout-detail-value">${batch.transactionCode}</span>
                </div>
                ` : ''}
            </div>
            
            ${isAdmin && (batch.status === 'PROCESSING' || batch.status === 'PENDING') ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--light);">
                    <button class="btn btn-success btn-sm" onclick="showMarkPaidModal(${batch.id}, ${batch.totalPayoutAmount})">
                        <i class="fas fa-check"></i> Đánh dấu đã thanh toán
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Get payout status class
function getPayoutStatusClass(status) {
    const statusMap = {
        'PENDING': 'pending',
        'PROCESSING': 'processing',
        'PAID': 'paid',
        'FAILED': 'failed'
    };
    return statusMap[status] || 'pending';
}

// Get payout status text
function getPayoutStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ xử lý',
        'PROCESSING': 'Đang xử lý',
        'PAID': 'Đã thanh toán',
        'FAILED': 'Thất bại'
    };
    return statusMap[status] || status;
}

// Show empty state
function showEmptyPayoutBatches() {
    const container = document.getElementById('payoutBatchesList');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>Chưa có lô thanh toán</h3>
            <p>Chưa có lô thanh toán nào được tạo</p>
        </div>
    `;
}

// Display ledger entries
function displayLedgerEntries(entries) {
    const container = document.getElementById('ledgerEntriesList');
    
    if (entries.length === 0) {
        showEmptyLedgerEntries();
        return;
    }

    // Group entries by status
    const unpaid = entries.filter(e => e.status === 'UNPAID');
    const processing = entries.filter(e => e.status === 'PROCESSING');
    const paid = entries.filter(e => e.status === 'PAID');

    // Calculate totals
    const unpaidTotal = unpaid.reduce((sum, e) => sum + parseFloat(e.netAmountOwed || 0), 0);
    const processingTotal = processing.reduce((sum, e) => sum + parseFloat(e.netAmountOwed || 0), 0);
    const paidTotal = paid.reduce((sum, e) => sum + parseFloat(e.netAmountOwed || 0), 0);

    container.innerHTML = `
        ${unpaid.length > 0 ? `
        <div class="ledger-entries-section">
            <h3 class="section-title">
                <i class="fas fa-hourglass-half"></i>
                Chưa thanh toán (${unpaid.length} đơn - <span style="color: #dc3545; font-weight: bold;">${FormatHelper.currency(unpaidTotal)}</span>)
            </h3>
            <div class="ledger-entries-table">
                ${renderLedgerEntriesTable(unpaid)}
            </div>
        </div>
        ` : ''}
        
        ${processing.length > 0 ? `
        <div class="ledger-entries-section">
            <h3 class="section-title">
                <i class="fas fa-clock"></i>
                Đang xử lý (${processing.length} đơn - <span style="color: #0d6efd; font-weight: bold;">${FormatHelper.currency(processingTotal)}</span>)
            </h3>
            <div class="ledger-entries-table">
                ${renderLedgerEntriesTable(processing)}
            </div>
        </div>
        ` : ''}
        
        ${paid.length > 0 ? `
        <div class="ledger-entries-section">
            <h3 class="section-title">
                <i class="fas fa-check-circle"></i>
                Đã thanh toán (${paid.length} đơn - <span style="color: #28a745; font-weight: bold;">${FormatHelper.currency(paidTotal)}</span>)
            </h3>
            <div class="ledger-entries-table">
                ${renderLedgerEntriesTable(paid)}
            </div>
        </div>
        ` : ''}
    `;
}

// Render ledger entries table
function renderLedgerEntriesTable(entries) {
    return `
        <table class="ledger-table">
            <thead>
                <tr>
                    <th>Mã đơn hàng</th>
                    <th>Ngày tạo</th>
                    <th>Số tiền gốc</th>
                    <th>Hoa hồng</th>
                    <th>Phí GD</th>
                    <th>Số tiền thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Batch</th>
                </tr>
            </thead>
            <tbody>
                ${entries.map(entry => `
                    <tr>
                        <td>
                            <strong>#${entry.orderId}</strong>
                        </td>
                        <td>${FormatHelper.date(entry.createdAt)}</td>
                        <td>${FormatHelper.currency(entry.totalOrderAmount)}</td>
                        <td style="color: #dc3545;">-${FormatHelper.currency(entry.appCommissionAmount)}</td>
                        <td style="color: #dc3545;">-${FormatHelper.currency(entry.paymentGatewayFee)}</td>
                        <td class="amount-cell">${FormatHelper.currency(entry.netAmountOwed)}</td>
                        <td>
                            <span class="ledger-status ${entry.status.toLowerCase()}">
                                ${getStatusText(entry.status)}
                            </span>
                        </td>
                        <td>
                            ${entry.payoutBatchId ? `<span class="batch-link">Batch #${entry.payoutBatchId}</span>` : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Get status text for ledger entries
function getStatusText(status) {
    const statusMap = {
        'UNPAID': 'Chưa thanh toán',
        'PROCESSING': 'Đang xử lý',
        'PAID': 'Đã thanh toán'
    };
    return statusMap[status] || status;
}

// Show empty ledger entries
function showEmptyLedgerEntries() {
    const container = document.getElementById('ledgerEntriesList');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-receipt"></i>
            <h3>Chưa có giao dịch</h3>
            <p>Chưa có giao dịch nào trong sổ cái</p>
        </div>
    `;
}

// Update stats
function updateStats(batches) {
    const pendingBatches = batches.filter(b => b.status === 'PROCESSING' || b.status === 'PENDING').length;
    const totalPaid = batches
        .filter(b => b.status === 'PAID')
        .reduce((sum, b) => sum + parseFloat(b.totalPayoutAmount || 0), 0);
    
    document.getElementById('pendingBatches').textContent = pendingBatches;
    document.getElementById('totalPaid').textContent = FormatHelper.currency(totalPaid);
}

// Show create payout modal
function showCreatePayoutModal() {
    // Check if store is selected
    if (!currentStoreId) {
        Toast.warning('Vui lòng chọn cửa hàng trước');
        return;
    }
    
    // Get store name
    let storeName = 'Cửa hàng';
    if (isAdmin && allStores.length > 0) {
        const currentStore = allStores.find(s => s.id === currentStoreId);
        if (currentStore) {
            storeName = currentStore.name || 'Cửa hàng #' + currentStore.id;
        }
    }
    
    // Get unpaid amount
    const unpaidAmountText = document.getElementById('unpaidAmount').textContent;
    
    // Check if there's any unpaid amount or entries
    if ((unpaidAmountText === '0đ' || unpaidAmountText === '0') && unpaidEntriesCount === 0) {
        Toast.warning(`Không có đơn hàng chưa thanh toán nào cho ${storeName}`);
        return;
    }
    
    // Show modal with store info
    document.getElementById('createPayoutStoreName').textContent = storeName;
    document.getElementById('createPayoutCount').textContent = unpaidEntriesCount;
    document.getElementById('createPayoutAmount').textContent = unpaidAmountText;
    document.getElementById('createPayoutModal').style.display = 'flex';
}

// Close create payout modal
function closeCreatePayoutModal() {
    document.getElementById('createPayoutModal').style.display = 'none';
}

// Confirm create payout
function confirmCreatePayout() {
    closeCreatePayoutModal();
    createPayoutBatch();
}

// Create payout batch
async function createPayoutBatch() {
    Loading.show();
    
    try {
        const response = await APIHelper.post(`/api/v1/ledger/store/${currentStoreId}/payout`);
        const payoutBatch = response.result;
        
        // Get store name
        let storeName = 'cửa hàng';
        if (isAdmin && allStores.length > 0) {
            const currentStore = allStores.find(s => s.id === currentStoreId);
            if (currentStore) {
                storeName = currentStore.name || 'Cửa hàng #' + currentStore.id;
            }
        }
        
        Toast.success(`Tạo lô thanh toán thành công cho ${storeName}!\nBatch #${payoutBatch.id} - Số tiền: ${FormatHelper.currency(payoutBatch.totalPayoutAmount)}\nTrạng thái: Đang xử lý - Vui lòng nhập mã giao dịch để hoàn tất`);
        loadLedgerData(); // Reload data
    } catch (error) {
        console.error('Error creating payout batch:', error);
        const message = error.message || 'Không thể tạo lô thanh toán';
        Toast.error(message);
    } finally {
        Loading.hide();
    }
}

// Show mark paid modal
function showMarkPaidModal(batchId, amount) {
    console.log('showMarkPaidModal called with:', { batchId, amount });
    
    if (!batchId) {
        Toast.error('Không tìm thấy ID lô thanh toán');
        return;
    }
    
    currentBatchId = batchId;
    document.getElementById('modalAmount').textContent = FormatHelper.currency(amount);
    document.getElementById('modalBatchId').textContent = batchId;
    document.getElementById('transactionCode').value = '';
    document.getElementById('markPaidModal').style.display = 'flex';
}

// Close mark paid modal
function closeMarkPaidModal() {
    document.getElementById('markPaidModal').style.display = 'none';
    currentBatchId = null;
}

// Confirm mark paid
async function confirmMarkPaid() {
    const transactionCode = document.getElementById('transactionCode').value.trim();
    
    console.log('confirmMarkPaid called with:', { currentBatchId, transactionCode });
    
    if (!transactionCode) {
        Toast.error('Vui lòng nhập mã giao dịch');
        return;
    }
    
    if (!currentBatchId || currentBatchId === 'null' || currentBatchId === null) {
        Toast.error('Không tìm thấy thông tin lô thanh toán');
        closeMarkPaidModal();
        return;
    }
    
    const batchId = currentBatchId; // Lưu lại trước khi đóng modal
    console.log('Calling API with batchId:', batchId);
    
    Loading.show();
    closeMarkPaidModal();
    
    try {
        const url = `/api/v1/ledger/payout/${batchId}/mark-paid?transactionCode=${encodeURIComponent(transactionCode)}`;
        console.log('API URL:', url);
        
        await APIHelper.post(url);
        
        Toast.success('Đã xác nhận thanh toán thành công!');
        loadLedgerData(); // Reload data
    } catch (error) {
        console.error('Error marking payout as paid:', error);
        Toast.error('Không thể xác nhận thanh toán: ' + (error.message || 'Lỗi không xác định'));
    } finally {
        Loading.hide();
    }
}

// Logout
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        AuthHelper.logout();
    }
}

// Close modal on outside click
document.getElementById('markPaidModal').addEventListener('click', (e) => {
    if (e.target.id === 'markPaidModal') {
        closeMarkPaidModal();
    }
});

console.log('Ledger Management script initialized');
