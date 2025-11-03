# Quick Fix Script - Run as Administrator

## For XAMPP Users
If you're using XAMPP, open Command Prompt as Administrator and run:

```cmd
cd C:\xampp\mysql\bin
mysql -u root -e "USE drone_delivery; ALTER TABLE drone MODIFY COLUMN model VARCHAR(200);"
```

## For Standalone MySQL Users
If you have MySQL installed separately, open Command Prompt as Administrator and run:

```cmd
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
mysql -u root -proot -e "USE drone_delivery; ALTER TABLE drone MODIFY COLUMN model VARCHAR(200);"
```

## If MySQL path is in System PATH
Simply run:

```cmd
mysql -u root -proot -e "USE drone_delivery; ALTER TABLE drone MODIFY COLUMN model VARCHAR(200);"
```

## Alternative: Drop and Recreate (ONLY if you don't have important data)

```cmd
mysql -u root -proot -e "DROP DATABASE IF EXISTS drone_delivery; CREATE DATABASE drone_delivery;"
```

Then restart your application - it will create tables with the correct schema.

## After running the fix
1. Restart your Spring Boot application
2. The error should be resolved

