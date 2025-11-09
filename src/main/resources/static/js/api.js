// API Service for making HTTP requests

// Helper function to build URLs with query parameters
function buildUrl(endpoint, params = {}) {
    // If endpoint is a function, call it first (for dynamic endpoints)
    const path = typeof endpoint === 'function' ? endpoint() : endpoint;
    
    // If no base URL, use endpoint as-is
    const baseUrl = API_CONFIG?.BASE_URL || '';
    let url = path.startsWith('http') ? path : `${baseUrl}${path}`;
    
    // Add query parameters if any
    const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    
    if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
    }
    
    return url;
}

class APIService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }

    // Get headers with auth token
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    // Generic request method
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: this.getHeaders(options.auth !== false)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const url = buildUrl(endpoint, params);
        return this.request(url, { method: 'GET' });
    }

    // POST request
    async post(endpoint, body = {}, params = {}) {
        const url = buildUrl(endpoint, params);
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    // PUT request
    async put(endpoint, body = {}, params = {}) {
        const url = buildUrl(endpoint, params);
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    // DELETE request
    async delete(endpoint, params = {}) {
        const url = buildUrl(endpoint, params);
        return this.request(url, { method: 'DELETE' });
    }

    // Authentication APIs
    async login(username, password) {
        return this.post(API_CONFIG.ENDPOINTS.LOGIN, { username, password });
    }

    async signup(userData) {
        return this.post(API_CONFIG.ENDPOINTS.REGISTER, userData);
    }

    async logout() {
        return this.post(API_CONFIG.ENDPOINTS.LOGOUT);
    }

    // Product APIs
    async getProducts() {
        return this.get(API_CONFIG.ENDPOINTS.PRODUCTS);
    }

    async getProductById(id) {
        return this.get(API_CONFIG.ENDPOINTS.PRODUCT_BY_ID, { id });
    }

    // Category APIs
    async getCategories() {
        return this.get(API_CONFIG.ENDPOINTS.CATEGORIES);
    }

    // Cart APIs
    async getCart() {
        return this.get(API_CONFIG.ENDPOINTS.CART);
    }

    async addToCart(productId, quantity, storeId) {
        return this.post(API_CONFIG.ENDPOINTS.CART_ADD, {
            productId,
            quantity,
            storeId
        });
    }

    async updateCartItem(productId, quantity) {
        return this.put(API_CONFIG.ENDPOINTS.CART_UPDATE, { quantity }, { productId });
    }

    async removeCartItem(productId) {
        return this.delete(API_CONFIG.ENDPOINTS.CART_REMOVE, { productId });
    }

    async clearCart() {
        return this.delete(API_CONFIG.ENDPOINTS.CART_CLEAR);
    }

    // Order APIs
    async createOrder(orderData) {
        return this.post(API_CONFIG.ENDPOINTS.ORDERS, orderData);
    }

    async getOrderById(orderId) {
        return this.get(API_CONFIG.ENDPOINTS.ORDER_BY_ID, { orderId });
    }

    async getUserOrders(userId) {
        return this.get(API_CONFIG.ENDPOINTS.USER_ORDERS, { userId });
    }

    // Payment APIs
    async initPayment(orderId, provider = 'VNPAY', method = 'QR') {
        return this.post(API_CONFIG.ENDPOINTS.PAYMENT_INIT, {
            orderId,
            provider,
            method
        });
    }

    // Store APIs
    async getStoreByProduct(productId) {
        return this.get(API_CONFIG.ENDPOINTS.STORE_BY_PRODUCT, { productId });
    }

    async getStoreWithProducts(storeId) {
        return this.get(API_CONFIG.ENDPOINTS.STORE_WITH_PRODUCTS, { storeId });
    }
}

// Create global API service instance
const api = new APIService();

