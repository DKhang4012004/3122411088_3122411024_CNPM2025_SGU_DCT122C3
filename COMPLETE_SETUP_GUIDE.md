# 🎯 Complete Setup & Usage Guide

## ⚠️ CRITICAL: Fix Database First!

Before using the application, you **MUST** fix the database schema.

### Quick Fix (Choose One Method)

#### Method 1: MySQL Command Line
```bash
mysql -u root -proot -e "USE drone_delivery; ALTER TABLE drone MODIFY COLUMN model VARCHAR(200);"
```

#### Method 2: MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Run this SQL:
```sql
USE drone_delivery;
ALTER TABLE drone MODIFY COLUMN model VARCHAR(200);
```

#### Method 3: Drop & Recreate (Only if you have NO important data)
```bash
mysql -u root -proot -e "DROP DATABASE IF EXISTS drone_delivery; CREATE DATABASE drone_delivery;"
```
Then restart your application - Hibernate will create tables with correct schema.

---

## 🚀 Starting the Application

### 1. Start Server
```bash
start-server.bat
```

### 2. Wait for Server Ready
Look for this message:
```
Started FoodfastApplication in X.XXX seconds
```

### 3. Access Application
Open browser: **http://localhost:8080/home/home.html**

---

## 📱 Web Pages Available

### Main Pages
1. **Home Dashboard** - `home.html`
   - Navigation hub
   - Server status check
   - Feature overview

2. **Authentication** - `auth-pages.html`
   - Login
   - Register new account
   - View profile
   - Logout

3. **Drone Simulator** - `drone-simulator.html`
   - For phone testing
   - GPS-based tracking
   - Real-time updates

### Test Pages (For Development)
- `test-delivery.html` - Test delivery flow
- `test-store-and-products.html` - Test store APIs
- `test-connection.html` - Test server connection
- `debug-register.html` - Debug registration

---

## 🔐 Creating Your First Account

### Via Web Interface (Recommended)

1. **Open auth page:** http://localhost:8080/home/auth-pages.html

2. **Click "Register" tab**

3. **Fill in the form:**
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Phone: 0123456789
   - Password: password123
   - Role: Customer
   - Address: (Optional but recommended)
   - GPS: (Auto-detected if you allow browser location)

4. **Click "Create Account"**

5. **Login with your credentials**

### Via Postman

Import `FoodFast_Postman_Collection.json` and use the "Register User" request.

---

## 🛒 Using the Application

### Step 1: Register & Login
1. Create account via `auth-pages.html`
2. Login with phone + password
3. Token is stored automatically

### Step 2: Browse Stores (Coming Soon - Frontend)
For now, use Postman or API directly:
```javascript
fetch('http://localhost:8080/home/api/stores', {
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
    }
})
```

### Step 3: Add Products to Cart (Coming Soon - Frontend)
Use API:
```javascript
fetch('http://localhost:8080/home/api/cart/items', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        productId: 1,
        quantity: 2
    })
})
```

### Step 4: Test Drone Delivery
1. Open `drone-simulator.html` on your phone
2. Register the drone
3. Update location as you move

---

## 📡 API Usage Examples

### Authentication

#### Register
```bash
curl -X POST http://localhost:8080/home/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "0123456789",
    "password": "password123",
    "role": "USER",
    "address": {
      "street": "123 Main St",
      "city": "Ho Chi Minh",
      "district": "District 1",
      "latitude": 10.762622,
      "longitude": 106.660172,
      "isDefault": true
    }
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/home/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0123456789",
    "password": "password123"
  }'
```

Response:
```json
{
  "code": 1000,
  "message": "Login successful",
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": 1
  }
}
```

### Store Management

#### Get All Stores
```bash
curl -X GET http://localhost:8080/home/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Store (Store Owner Only)
```bash
curl -X POST http://localhost:8080/home/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Heaven",
    "description": "Best pizza in town",
    "phone": "0987654321",
    "email": "pizza@heaven.com",
    "address": {
      "street": "456 Pizza St",
      "city": "Ho Chi Minh",
      "district": "District 3",
      "latitude": 10.777619,
      "longitude": 106.695801
    }
  }'
```

### Product Management

#### Add Product to Store
```bash
curl -X POST http://localhost:8080/home/api/stores/1/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Margherita Pizza",
    "description": "Classic Italian pizza",
    "price": 99000,
    "categoryId": 1
  }'
```

#### Get Products by Category
```bash
curl -X GET http://localhost:8080/home/api/products/category/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Shopping Cart

#### Add Item to Cart
```bash
curl -X POST http://localhost:8080/home/api/cart/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 2
  }'
```

#### Get Cart
```bash
curl -X GET http://localhost:8080/home/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Drone Management

#### Register Drone (No Auth Required)
```bash
curl -X POST http://localhost:8080/home/drones/register \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DRONE001",
    "model": "iPhone 13 Pro Max",
    "maxPayloadGram": 2000,
    "latitude": 10.762622,
    "longitude": 106.660172
  }'
```

#### Update Drone Location
```bash
curl -X PUT http://localhost:8080/home/drones/DRONE001/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 10.765,
    "longitude": 106.665,
    "batteryPercent": 95
  }'
```

---

## 🎯 Testing Workflow

### Complete Test Scenario

1. **Create Admin User**
   - Register via web or API
   - Use this for managing categories

2. **Create Categories**
   - POST /api/categories with: Pizza, Burger, Drinks, etc.

3. **Create Store Owner Account**
   - Register with role: STORE_OWNER

4. **Create Store**
   - Login as store owner
   - POST /api/stores with store details

5. **Add Products**
   - POST /api/stores/{storeId}/products
   - Add multiple products in different categories

6. **Create Customer Account**
   - Register with role: USER

7. **Shop as Customer**
   - Browse products
   - Add to cart
   - Checkout (when implemented)

8. **Test Drone Delivery**
   - Register drone via phone simulator
   - Update location
   - Track delivery (when implemented)

---

## 🐛 Common Issues & Solutions

### Issue 1: Server won't start
**Symptoms:** Error messages, port already in use

**Solutions:**
1. Check if MySQL is running
2. Verify port 8080 is free
3. Check database credentials in `application.yaml`

### Issue 2: Database errors
**Symptoms:** "Table doesn't exist" or column errors

**Solutions:**
1. Run the database fix SQL
2. Or drop and recreate database
3. Restart server to let Hibernate create tables

### Issue 3: Authentication fails
**Symptoms:** 401 Unauthorized, Invalid token

**Solutions:**
1. Check you're using correct endpoint: `/auth/login` not `/api/auth/login`
2. Verify phone format (digits only, no spaces)
3. Password must be at least 6 characters
4. Token might be expired - login again

### Issue 4: Can't access from phone
**Symptoms:** Connection refused, timeout

**Solutions:**
1. Check same WiFi network
2. Use computer's IP, not localhost
3. Disable firewall or allow port 8080
4. Try: `http://YOUR_IP:8080/home/drone-simulator.html`

### Issue 5: CORS errors
**Symptoms:** Blocked by CORS policy

**Solutions:**
- Application has CORS configured
- Restart server if you just made changes
- Check you're using correct URL format

---

## 📊 Database Schema Overview

### Core Tables

1. **user** - User accounts
   - id, firstName, lastName, email, phone, password, role

2. **address** - User addresses
   - id, userId, street, city, district, latitude, longitude, isDefault

3. **store** - Restaurants/stores
   - id, ownerId, name, description, phone, email, status, rating

4. **category** - Product categories
   - id, name, description

5. **product** - Food items
   - id, storeId, categoryId, name, description, price, imageUrl, availability

6. **cart** - Shopping carts
   - id, userId, totalPrice, itemCount

7. **cart_item** - Items in cart
   - id, cartId, productId, quantity, priceAtTime

8. **drone** - Drone fleet
   - id, code, model, maxPayloadGram, status, currentBatteryPercent, lastLatitude, lastLongitude

### Relationships
- User → Addresses (One-to-Many)
- User → Store (One-to-Many via ownership)
- Store → Products (One-to-Many)
- Category → Products (One-to-Many)
- User → Cart (One-to-One)
- Cart → CartItems (One-to-Many)
- CartItem → Product (Many-to-One)

---

## 💡 Tips & Best Practices

### For Testing
1. Use Postman collections provided
2. Test public endpoints first (no auth)
3. Then test protected endpoints with token
4. Save successful responses for reference

### For Development
1. Check logs for detailed error messages
2. Use `show-sql: true` to see database queries
3. Test one feature at a time
4. Use browser DevTools Network tab

### For Deployment
1. Change JWT secret key
2. Use environment variables for credentials
3. Enable HTTPS
4. Set up proper database backups
5. Configure production logging

---

## 📚 Additional Resources

- **Full Feature List:** `FEATURES_AND_STATUS.md`
- **Recent Changes:** `CHANGES_SUMMARY.md`
- **Database Fix:** `FIX_DRONE_MODEL_ERROR.md`
- **Quick Reference:** `QUICK_DATABASE_FIX.md`
- **API Collection:** `FoodFast_Postman_Collection.json`
- **Drone APIs:** `Drone_Complete_APIs.postman_collection.json`

---

## ✅ Checklist Before Testing

- [ ] MySQL is running
- [ ] Database schema is fixed (ran the SQL)
- [ ] Server is started and shows "Started FoodfastApplication"
- [ ] Can access home page at http://localhost:8080/home/home.html
- [ ] Created at least one test user account
- [ ] Tested login and got token
- [ ] Postman collection imported (optional)

---

**Need Help?** Check the documentation files or review the code comments!

**Last Updated:** November 2, 2025

