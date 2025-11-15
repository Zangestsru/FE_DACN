## Hiện trạng
- `src/App.tsx` đã định tuyến `"/admin/*"` và `"/teacher/*"` qua `ProtectedRoute` (src/App.tsx:116–131).
- `ProtectedRoute` kiểm tra đăng nhập và đối chiếu `allowedRoles` để chặn truy cập trái phép, chuyển hướng `403` (src/routes/ProtectedRoute.tsx:1–32).
- Hai sub‑app tách biệt: `AdminApp` (src/admin/AdminApp.tsx) và `TeacherApp` (src/teacher/TeacherApp.tsx) tự import CSS riêng (`admin-styles.css`, `teacher-styles.css`).

## Mục tiêu
- Chỉ tải và hiển thị sub‑app tương ứng khi URL trỏ đến nhánh đó và người dùng có đúng vai trò.
- Tối ưu tải bằng lazy‑load, đảm bảo điều hướng sau đăng nhập tới đúng không gian làm việc.
- Ẩn/hiện UI quản trị theo vai trò.

## Kỹ thuật triển khai
### Định tuyến & Bảo vệ theo vai trò
- Giữ nguyên hai nhánh: `"/admin/*"` dùng `allowedRoles=["admin"]` và `"/teacher/*"` dùng `allowedRoles=["teacher"]` trong `src/App.tsx`.
- Không thay đổi `ProtectedRoute`; logic đã phù hợp (so sánh role không phân biệt hoa thường và trả về `403`).

### Lazy‑load sub‑app
- Sửa `src/App.tsx`:
  - Thêm `lazy` và `Suspense` để tách bundle:
    - `const AdminApp = lazy(() => import('@/admin/AdminApp'))`
    - `const TeacherApp = lazy(() => import('@/teacher/TeacherApp'))`
  - Bọc `element` của `ProtectedRoute` bằng `<Suspense fallback={null}>` để chỉ tải khi truy cập đúng nhánh.

### Điều hướng sau đăng nhập
- Cập nhật `src/components/Login.tsx` (sau xác thực thành công):
  - Đọc `user.role` từ `useAuthContext()` và `navigate` tới:
    - `"/admin"` nếu role là `admin`.
    - `"/teacher"` nếu role là `teacher`.
  - Giữ nguyên luồng hiện tại cho các role khác (ví dụ người dùng thông thường) — quay về `"/"`.

### Phân quyền UI
- `src/components/Header.tsx`:
  - Ẩn/hiện hoặc vô hiệu hóa các nút/link dẫn tới `"/admin"` hoặc `"/teacher"` dựa trên `user.role` từ `useAuthContext`.
  - Không đổi hành vi cho người dùng không có quyền.

### Trang mặc định
- Đảm bảo mỗi sub‑app có route index rõ ràng:
  - `AdminApp`: route `path=""` vẫn dùng `Blank` (src/admin/AdminApp.tsx:17–26).
  - `TeacherApp`: route `index` hiển thị `Home` (src/teacher/TeacherApp.tsx:29).

### Kiểm thử
- Kiểm thử 3 kịch bản:
  - Chưa đăng nhập: truy cập `"/admin"` hoặc `"/teacher"` → chuyển hướng đăng nhập hoặc `403` (tuỳ cấu hình hiện tại).
  - Đăng nhập vai trò `admin`: truy cập `"/admin"` thành công; truy cập `"/teacher"` bị chặn `403`.
  - Đăng nhập vai trò `teacher`: truy cập `"/teacher"` thành công; truy cập `"/admin"` bị chặn `403`.

## Ghi chú
- Không xoá file; chỉ thêm import và chỉnh sửa nhỏ như yêu cầu.
- Cấu hình alias `@/*` đã tồn tại trong `tsconfig.app.json` để các import `@/...` hoạt động.

Bạn xác nhận để mình áp dụng các thay đổi (lazy‑load, điều hướng sau đăng nhập, ẩn/hiện UI theo role)?