
```bash
# Real-time stats
docker stats foodfast-app foodfast-mysql

# Export metrics
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Health Checks

```bash
# Application health
curl http://localhost:8080/home/actuator/health

# MySQL health
docker exec foodfast-mysql mysqladmin ping -h localhost
```

---

## 🎓 Demo với Docker

### Quick Start cho Demo

```bash
# 1. Clone project
git clone <repository-url>
cd <project-folder>

# 2. Start everything
docker-compose up -d

# 3. Đợi ~60s cho app start
docker-compose logs -f app | grep "Started FoodfastApplication"

# 4. Test API
curl http://localhost:8080/home/api/v1/health

# 5. Access phpMyAdmin
# Browser: http://localhost:8081
```

### Demo Checklist

- [ ] Docker Desktop đang chạy
- [ ] Port 8080, 3306, 8081 không bị chiếm
- [ ] Internet connection (để pull images)
- [ ] Đợi MySQL healthy trước khi test API
- [ ] Chuẩn bị Postman collection

---

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra logs: `docker-compose logs -f`
2. Kiểm tra health: `docker-compose ps`
3. Restart: `docker-compose restart`
4. Clean rebuild: `docker-compose down -v && docker-compose up -d --build`

---

**Version**: 1.0  
**Last Updated**: 31/10/2025
# 🐳 Docker Deployment Guide

## 📋 Mục Lục
1. [Giới thiệu](#giới-thiệu)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Hướng dẫn chạy](#hướng-dẫn-chạy)
4. [Cấu hình](#cấu-hình)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Giới Thiệu

Dự án sử dụng Docker để containerize ứng dụng, bao gồm:
- **Spring Boot Application**: Port 8080
- **MySQL Database**: Port 3306
- **phpMyAdmin**: Port 8081 (quản lý database)

---

## 💻 Yêu Cầu Hệ Thống

- Docker Desktop 20.10+
- Docker Compose 2.0+
- RAM: Tối thiểu 4GB
- Dung lượng: 2GB trống

### Cài đặt Docker

**Windows:**
```bash
# Download Docker Desktop từ:
https://www.docker.com/products/docker-desktop/

# Sau khi cài đặt, kiểm tra version:
docker --version
docker-compose --version
```

---

## 🚀 Hướng Dẫn Chạy

### 1. Build và Run toàn bộ hệ thống

```bash
# Chuyển đến thư mục project
cd C:\Users\admin\Desktop\CNPM\3122411088_3122411024_CNPM2025_SGU_DCT122C3

# Build và start tất cả services
docker-compose up -d --build

# Xem logs
docker-compose logs -f
```

### 2. Kiểm tra trạng thái

```bash
# Xem các container đang chạy
docker-compose ps

# Output mong đợi:
# NAME                    STATUS              PORTS
# foodfast-app            Up                  0.0.0.0:8080->8080/tcp
# foodfast-mysql          Up (healthy)        0.0.0.0:3306->3306/tcp
# foodfast-phpmyadmin     Up                  0.0.0.0:8081->80/tcp
```

### 3. Truy cập ứng dụng

- **API Application**: http://localhost:8080/home
- **phpMyAdmin**: http://localhost:8081
  - Server: `mysql`
  - Username: `root`
  - Password: `khang141204`

### 4. Dừng và xóa containers

```bash
# Dừng tất cả services
docker-compose down

# Dừng và xóa cả volumes (data sẽ mất)
docker-compose down -v

# Restart services
docker-compose restart
```

---

## ⚙️ Cấu Hình

### Environment Variables

Bạn có thể thay đổi cấu hình trong `docker-compose.yml`:

```yaml
environment:
  # Database
  SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/drone_delivery
  SPRING_DATASOURCE_USERNAME: root
  SPRING_DATASOURCE_PASSWORD: your_password_here
  
  # VNPay (production)
  VNPAY_TMN_CODE: YOUR_TMN_CODE
  VNPAY_HASH_SECRET: YOUR_HASH_SECRET
```

### Persistent Data

Data MySQL được lưu trong Docker volume `mysql_data`:

```bash
# Backup database
docker exec foodfast-mysql mysqldump -uroot -pkhang141204 drone_delivery > backup.sql

# Restore database
docker exec -i foodfast-mysql mysql -uroot -pkhang141204 drone_delivery < backup.sql
```

---

## 🔍 Các Lệnh Hữu Ích

### Logs

```bash
# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của Spring Boot app
docker-compose logs -f app

# Xem logs của MySQL
docker-compose logs -f mysql
```

### Execute Commands

```bash
# Truy cập MySQL CLI
docker exec -it foodfast-mysql mysql -uroot -pkhang141204 drone_delivery

# Truy cập Spring Boot container shell
docker exec -it foodfast-app sh

# Chạy SQL script
docker exec -i foodfast-mysql mysql -uroot -pkhang141204 drone_delivery < script.sql
```

### Resource Management

```bash
# Xem resource usage
docker stats

# Cleanup unused resources
docker system prune -a --volumes
```

---

## 🐛 Troubleshooting

### 1. Container không start

```bash
# Kiểm tra logs
docker-compose logs app

# Kiểm tra network
docker network ls
docker network inspect foodfast_foodfast-network
```

### 2. Database connection failed

```bash
# Kiểm tra MySQL health
docker-compose ps

# Nếu MySQL chưa ready, đợi thêm
docker-compose logs mysql | grep "ready for connections"

# Restart app sau khi MySQL ready
docker-compose restart app
```

### 3. Port đã được sử dụng

```bash
# Thay đổi port trong docker-compose.yml
# Ví dụ: "8080:8080" -> "8090:8080"

# Hoặc stop service đang dùng port
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### 4. Build lỗi

```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### 5. Out of memory

```bash
# Tăng memory limit trong docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## 📦 Production Deployment

### 1. Sử dụng environment file

Tạo file `.env`:

```env
# Database
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=drone_delivery

# Application
JWT_SIGNER_KEY=your_production_jwt_key
VNPAY_TMN_CODE=your_production_tmn_code
VNPAY_HASH_SECRET=your_production_secret
```

Cập nhật `docker-compose.yml`:

```yaml
services:
  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
```

### 2. Sử dụng external database

```yaml
services:
  app:
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://your-external-db:3306/drone_delivery
      # Remove mysql service dependency
```

### 3. HTTPS với Nginx

Thêm Nginx reverse proxy trong `docker-compose.yml`:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
```

---

## 🔐 Security Best Practices

1. **Không commit secrets vào Git**
   ```bash
   # Thêm vào .gitignore
   .env
   *.key
   *.pem
   ```

2. **Sử dụng Docker secrets** (Docker Swarm)
   ```yaml
   secrets:
     mysql_root_password:
       external: true
   ```

3. **Scan vulnerabilities**
   ```bash
   docker scan foodfast-app
   ```

4. **Update base images thường xuyên**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## 📊 Monitoring

### Docker Stats

