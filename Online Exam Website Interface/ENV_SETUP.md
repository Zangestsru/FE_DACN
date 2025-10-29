# Environment Variables Setup Guide

Hướng dẫn cấu hình biến môi trường cho dự án Online Exam Website.

## 📋 Tạo file .env

Tạo file `.env` trong thư mục root của project với nội dung sau:

```env
# ==================== API CONFIGURATION ====================

# API Base URL - URL của backend server
# Development: http://localhost:3000
# Production: https://api.yourdomain.com
VITE_API_BASE_URL=http://localhost:3000

# API Version
VITE_API_VERSION=v1

# ==================== ENVIRONMENT ====================

# Environment mode: development | staging | production
VITE_ENV=development

# Enable debug mode (true/false)
VITE_DEBUG=true

# ==================== AUTHENTICATION ====================

# JWT Secret Key (for local development only)
# NEVER commit real secret keys to git!
VITE_JWT_SECRET=your-secret-key-here

# Token expiration time (in seconds)
VITE_ACCESS_TOKEN_EXPIRY=3600
VITE_REFRESH_TOKEN_EXPIRY=604800

# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id

# ==================== PAYMENT GATEWAYS ====================

# MoMo Payment
VITE_MOMO_PARTNER_CODE=your-momo-partner-code
VITE_MOMO_ACCESS_KEY=your-momo-access-key
VITE_MOMO_SECRET_KEY=your-momo-secret-key
VITE_MOMO_REDIRECT_URL=http://localhost:5173/payment/callback

# VNPay Payment
VITE_VNPAY_TMN_CODE=your-vnpay-tmn-code
VITE_VNPAY_HASH_SECRET=your-vnpay-hash-secret
VITE_VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VITE_VNPAY_RETURN_URL=http://localhost:5173/payment/callback

# PayPal Payment
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
VITE_PAYPAL_SECRET=your-paypal-secret
VITE_PAYPAL_MODE=sandbox

# ==================== THIRD-PARTY SERVICES ====================

# Google Analytics
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Cloudinary (for image/video upload)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
VITE_CLOUDINARY_API_SECRET=your-api-secret
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# ==================== CDN & STORAGE ====================

# CDN URL for static assets
VITE_CDN_URL=https://cdn.yourdomain.com

# AWS S3 Configuration
VITE_AWS_ACCESS_KEY_ID=your-aws-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-aws-secret-key
VITE_AWS_REGION=ap-southeast-1
VITE_AWS_S3_BUCKET=your-bucket-name

# ==================== FEATURE FLAGS ====================

# Enable/disable features
VITE_ENABLE_CHAT=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SOCIAL_LOGIN=true
VITE_ENABLE_PAYMENT=true

# ==================== APP CONFIGURATION ====================

# App Name
VITE_APP_NAME="Online Exam Website"

# App URL
VITE_APP_URL=http://localhost:5173

# Support Email
VITE_SUPPORT_EMAIL=support@yourdomain.com

# Support Phone
VITE_SUPPORT_PHONE=1900-xxxx
```

## 🔐 Security Best Practices

### ⚠️ QUAN TRỌNG:

1. **KHÔNG BAO GIỜ** commit file `.env` vào git
2. Thêm `.env` vào `.gitignore`
3. Sử dụng giá trị khác nhau cho development, staging, và production
4. Rotate secrets định kỳ
5. Sử dụng secrets management service cho production

### Kiểm tra .gitignore

Đảm bảo file `.gitignore` có dòng sau:

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 📝 Các biến môi trường bắt buộc

### Development (Tối thiểu)

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=v1
VITE_ENV=development
VITE_DEBUG=true
```

### Production (Tối thiểu)

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_VERSION=v1
VITE_ENV=production
VITE_DEBUG=false
VITE_HTTPS_ONLY=true
```

## 🚀 Cách sử dụng

### 1. Trong code

```typescript
// Import từ config
import { API_BASE_URL, API_VERSION } from "@/config/api.config";

// Hoặc truy cập trực tiếp
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const isDebug = import.meta.env.VITE_DEBUG === "true";
```

### 2. Trong vite.config.ts

```typescript
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // config
    define: {
      "process.env": env,
    },
  };
});
```

## 🌍 Environment-specific files

Tạo các file cho từng môi trường:

- `.env` - Mặc định cho tất cả môi trường
- `.env.local` - Local overrides (không commit)
- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## 📦 Setup cho các dịch vụ

### Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới
3. Enable Google+ API
4. Tạo OAuth 2.0 credentials
5. Copy Client ID vào `VITE_GOOGLE_CLIENT_ID`

### Facebook OAuth

1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo app mới
3. Thêm Facebook Login product
4. Copy App ID vào `VITE_FACEBOOK_APP_ID`

### MoMo Payment

1. Đăng ký tài khoản merchant tại [MoMo Business](https://business.momo.vn/)
2. Lấy Partner Code, Access Key, Secret Key
3. Cấu hình webhook URL

### VNPay Payment

1. Đăng ký tài khoản merchant tại [VNPay](https://vnpay.vn/)
2. Lấy TMN Code và Hash Secret
3. Cấu hình Return URL

### Firebase

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới
3. Thêm web app
4. Copy config vào các biến `VITE_FIREBASE_*`

### Cloudinary

1. Đăng ký tại [Cloudinary](https://cloudinary.com/)
2. Lấy Cloud Name, API Key, API Secret
3. Tạo Upload Preset

## 🔄 Restart Development Server

Sau khi thay đổi file `.env`, restart development server:

```bash
# Stop server (Ctrl + C)
# Start lại
npm run dev
```

## 🐛 Troubleshooting

### Biến môi trường không load

1. Kiểm tra tên biến có prefix `VITE_`
2. Restart development server
3. Clear cache: `rm -rf node_modules/.vite`

### CORS errors

Kiểm tra `VITE_ALLOWED_ORIGINS` có chứa origin của frontend

### API connection errors

1. Kiểm tra `VITE_API_BASE_URL` đúng
2. Kiểm tra backend server đang chạy
3. Kiểm tra network/firewall

## 📚 Tài liệu tham khảo

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

**Lưu ý**: File này chỉ là hướng dẫn. Giá trị thực tế phải được cấu hình trong file `.env` của bạn.
