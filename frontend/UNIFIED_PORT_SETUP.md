# 🚀 Hướng Dẫn Sử Dụng Unified Gateway Port

## Tổng Quan

Hệ thống đã được cấu hình để **chạy tất cả các ứng dụng frontend trên cùng 1 port: `4000`** thông qua reverse proxy gateway.

### 🎯 Lợi Ích

✅ **Share localStorage giữa các apps** - User chỉ cần đăng nhập 1 lần  
✅ **Đơn giản hóa deployment** - Chỉ cần nhớ 1 URL duy nhất  
✅ **Role-based access control** - Tự động check quyền truy cập dựa trên roleId  

---

## 📍 URL Mapping

| Ứng dụng | URL | Port Backend | Quyền Truy Cập |
|----------|-----|--------------|----------------|
| **Online Exam** (Main) | `http://localhost:4000/` | 5505 | Tất cả users |
| **Teacher Dashboard** | `http://localhost:4000/teacher/` | 3003 | Chỉ roleId = 2 (Teacher) |
| **Admin Dashboard** | `http://localhost:4000/admin/` | 3002 | Chỉ roleId = 1 (Admin) |

---

## 🔐 Cách Hoạt Động

### 1. **User đăng nhập ở Online Exam app** (`http://localhost:4000/`)
- Token được lưu vào **localStorage**
- Token chứa thông tin: `userId`, `email`, `roleId`, `role`

### 2. **Header hiển thị link "Quản lý"**
- Chỉ hiển thị nếu `roleId = 2` (Teacher)
- Link dẫn đến `/teacher/` (cùng port 4000)

### 3. **Click vào "Quản lý"**
- Browser navigate đến `http://localhost:4000/teacher/`
- **Gateway** proxy request đến Teacher app (port 3003)
- **Teacher app** đọc token từ localStorage và check roleId
- ✅ Nếu roleId = 2 → cho phép truy cập
- ❌ Nếu không phải → hiển thị thông báo lỗi và redirect về trang chủ sau 2 giây

### 4. **LocalStorage được share**
- Vì cùng origin (`localhost:4000`), tất cả apps có thể đọc localStorage
- User không cần đăng nhập lại!

---

## 🚦 Hướng Dẫn Khởi Động

### Cách 1: Chạy Tất Cả Apps Cùng Lúc (Khuyến Nghị)

```bash
cd frontend
npm run dev:all
```

Script này sẽ tự động:
1. Khởi động **Online Exam** app (port 5505)
2. Khởi động **Teacher** app (port 3003)
3. Khởi động **Admin** app (port 3002)
4. Khởi động **Gateway** (port 4000)
5. Mở browser tại `http://localhost:4000/`

### Cách 2: Chạy Từng App Riêng Lẻ

**Terminal 1 - Gateway:**
```bash
cd frontend/dev-gateway
npm start
```

**Terminal 2 - Online Exam:**
```bash
cd "frontend/Online Exam Website Interface"
npm run dev
```

**Terminal 3 - Teacher:**
```bash
cd frontend/Teacher
npm run dev
```

**Terminal 4 - Admin (optional):**
```bash
cd frontend/TailAdmin-1.0.0
npm run dev
```

---

## ✅ Kiểm Tra Hệ Thống

### Test Case 1: Đăng nhập với tài khoản Teacher

1. Truy cập `http://localhost:4000/`
2. Click **"ĐĂNG NHẬP"**
3. Đăng nhập với account có `roleId = 2` (Teacher)
   - Email: (your teacher account)
   - Password: (your password)
4. Sau khi login thành công, click vào avatar/username ở góc phải
5. ✅ Bạn sẽ thấy menu item **"Quản lý"**
6. Click **"Quản lý"** → Browser navigate đến `http://localhost:4000/teacher/`
7. ✅ Trang Teacher Dashboard hiển thị ngay lập tức (không cần đăng nhập lại)

### Test Case 2: User không phải Teacher cố truy cập Teacher app

1. Đăng nhập với account có `roleId = 1` (Admin) hoặc `roleId = 3` (Student)
2. ❌ Menu **"Quản lý"** sẽ **không hiển thị**
3. Nếu user cố gắng truy cập trực tiếp `http://localhost:4000/teacher/`:
   - Teacher app sẽ hiển thị thông báo: **"🚫 Không có quyền truy cập"**
   - Sau 2 giây, tự động redirect về `http://localhost:4000/`

### Test Case 3: Kiểm tra localStorage sharing

1. Đăng nhập ở Online Exam app
2. Mở Developer Tools (F12) → Console tab
3. Chạy command:
   ```javascript
   console.log(localStorage.getItem('access_token'))
   ```
4. Copy token
5. Click "Quản lý" để chuyển sang Teacher app
6. Mở Developer Tools lại → Console tab
7. Chạy command tương tự:
   ```javascript
   console.log(localStorage.getItem('access_token'))
   ```
8. ✅ Token phải giống hệt nhau → localStorage được share!

---

## 🛠️ Troubleshooting

### Vấn đề 1: "Cannot GET /teacher/"

**Nguyên nhân:** Gateway chưa chạy hoặc Teacher app chưa khởi động

**Giải pháp:**
```bash
# Check xem các port có đang chạy không
netstat -ano | findstr "4000 3003 5505"

# Restart gateway
cd frontend/dev-gateway
npm start
```

### Vấn đề 2: Teacher app không check role

**Nguyên nhân:** Token không có trong localStorage hoặc token không chứa roleId

**Giải pháp:**
1. Kiểm tra token trong localStorage:
   ```javascript
   const token = localStorage.getItem('access_token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('RoleId:', payload.roleId || payload.role_id);
   ```
2. Nếu không có roleId, kiểm tra backend AuthService có trả về roleId trong JWT không

### Vấn đề 3: "Cross-Origin" errors

**Nguyên nhân:** Đang truy cập apps qua port riêng lẻ thay vì qua gateway

**Giải pháp:**
- ❌ **KHÔNG dùng:** `http://localhost:3003/teacher/`
- ✅ **Phải dùng:** `http://localhost:4000/teacher/`

### Vấn đề 4: HMR (Hot Module Reload) không hoạt động

**Nguyên nhân:** WebSocket connection đang kết nối sai port

**Giải pháp:** Gateway đã được config để proxy WebSocket connections. Nếu vẫn gặp lỗi:
1. Check terminal của Vite dev server có errors không
2. Restart cả Gateway và Vite dev server

---

## 📝 Technical Details

### Gateway Configuration (`frontend/dev-gateway/server.js`)

```javascript
// Proxy mapping
app.use('/admin', proxy({ target: 'http://localhost:3002' }));
app.use('/teacher', proxy({ target: 'http://localhost:3003' }));
app.use('/', proxy({ target: 'http://localhost:5505' }));
```

### Protected Route Logic (`frontend/Teacher/src/components/common/ProtectedRoute.tsx`)

```typescript
// 1. Lấy token từ localStorage
const token = localStorage.getItem('access_token');

// 2. Decode JWT payload
const payload = JSON.parse(atob(token.split('.')[1]));

// 3. Extract roleId
let roleId = payload.roleId || payload.role_id || payload.RoleId;

// 4. Check role
if (roleId === 2) {
  // ✅ Allow access
} else {
  // ❌ Deny access → redirect to home
}
```

---

## 🎓 Best Practices

1. **Luôn sử dụng gateway URL** (`http://localhost:4000`) trong development
2. **Đừng hardcode port riêng lẻ** trong code (3003, 5505, etc.)
3. **Check roleId từ token** thay vì tin tưởng client-side state
4. **Sử dụng relative URLs** khi navigate giữa các apps (`/teacher/` thay vì `http://localhost:3003/teacher/`)

---

## 🚀 Production Deployment

Khi deploy production, bạn có thể:

1. **Deploy static apps lên CDN** (Vercel, Netlify, etc.)
2. **Configure nginx/CloudFlare** để routing tương tự:
   ```nginx
   location /teacher/ {
     proxy_pass http://teacher-app-server;
   }
   location /admin/ {
     proxy_pass http://admin-app-server;
   }
   location / {
     proxy_pass http://main-app-server;
   }
   ```

---

## 📞 Support

Nếu gặp vấn đề, hãy check:
1. Gateway logs trong terminal của `dev-gateway`
2. Browser Console (F12) để xem network requests và errors
3. LocalStorage trong DevTools → Application tab

---

**Happy Coding! 🎉**
