# Fix for Drone Model Column Error

## Problem
Error: "Data too long for column 'model' at row 1"

The database column 'model' in the 'drone' table is too small to accommodate the model names being sent.

## Solution Applied

### Code Changes (Already Done)
1. ✅ Updated `Drone.java` entity - increased model column length to 200
2. ✅ Added validation to `DroneRegisterRequest.java` - max 200 characters
3. ✅ Added @Valid annotation to controller for request validation
4. ✅ Rebuilt the application

### Database Fix (YOU NEED TO DO THIS)

#### Option 1: Manual SQL (Recommended)
Open MySQL Workbench or command line and run:

```sql
USE drone_delivery;
ALTER TABLE drone MODIFY COLUMN model VARCHAR(200);
```

#### Option 2: Drop and Recreate (If you don't have important data)
1. Stop your application
2. Open MySQL and run:
```sql
DROP DATABASE drone_delivery;
CREATE DATABASE drone_delivery;
```
3. Restart your application - Hibernate will create the tables with correct schema

#### Option 3: Using MySQL Command Line
1. Open Command Prompt (cmd)
2. Navigate to your MySQL installation bin folder, usually:
   ```
   cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
   ```
   or
   ```
   cd "C:\xampp\mysql\bin"
   ```
3. Run:
   ```
   mysql -u root -proot -e "USE drone_delivery; ALTER TABLE drone MODIFY COLUMN model VARCHAR(200);"
   ```

## After Fixing Database

Restart your application using:
```
start-server.bat
```

## Test the Fix

Try registering a drone again with the model name. The error should be resolved.

## Notes
- The model field can now accept up to 200 characters
- Validation is added to prevent model names longer than 200 characters
- If you continue to see errors, make sure you've restarted the application after fixing the database

