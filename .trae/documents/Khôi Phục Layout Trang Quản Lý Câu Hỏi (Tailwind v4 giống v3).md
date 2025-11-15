## Mục Tiêu
- Khôi phục giao diện trang "Quản Lý Câu Hỏi" trong `src/teacher` để giống hệt mẫu v3 (ảnh bạn gửi), nhưng chạy chuẩn Tailwind v4.
- Không thay đổi header.

## Các Cập Nhật UI Cụ Thể
1. Thẻ thống kê đầu trang
- Bọc toàn bộ cụm thống kê bằng `card p-4 mb-6` (hiện đã áp dụng trong `src/teacher/pages/Questions.tsx:260`)
- Mỗi ô số liệu dùng `rounded-lg border bg-white p-4` để có khung trắng, viền tinh, bóng nhẹ (giống v3). Giữ lưới `grid grid-cols-1 md:grid-cols-4 gap-4`.

2. Thanh lọc
- Bọc bằng `card p-4 mb-4` (đã có ở `src/teacher/pages/Questions.tsx:288`) và giữ lưới 4 cột nhỏ
- Chuẩn hóa các input/select: `rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-brand-500`.

3. Bảng danh sách câu hỏi
- Wrapper dùng `card p-0 overflow-x-auto` (đã có ở `src/teacher/pages/Questions.tsx:325`) để tạo thẻ trắng bo tròn + viền + bóng
- Header bảng: đổi `TableRow` header từ `bg-gray-50` sang `bg-white border-x-0 border-t` để giống ảnh v3 (nền trắng, phân ranh bằng viền), cell giữ `px-6 py-4`
- Hàng dữ liệu: viền mảnh `border-t border-gray-100`, text màu `text-gray-600`, giữ truncation cho nội dung dài
- Cột trạng thái/nhãn (loại, độ khó): chuẩn hóa badge kiểu v3
  - Loại: `ring-1 ring-inset ring-blue-200 text-blue-600` (giữ như hiện tại)
  - Độ khó: giữ chuyển đổi màu theo `easy/medium/hard`:
    - `easy`: `ring-green-200 text-green-600`
    - `medium`: `ring-yellow-200 text-yellow-600`
    - `hard`: `ring-red-200 text-red-600`

4. Nút hành động (Xem/Sửa/Xóa)
- Chuẩn hóa cú pháp important sang Tailwind v4 hậu tố `!` trong `src/teacher/pages/Questions.tsx` (đã chuyển)
- Style giống ảnh v3:
  - Xem: `variant="outline"` + `border-gray-300! text-gray-700! hover:bg-gray-50! hover:border-gray-400!`
  - Sửa: `variant="outline"` + `border-gray-300! text-gray-700! hover:bg-gray-50! hover:border-gray-400!`
  - Xóa: `bg-red-500! hover:bg-red-600! text-white!`

5. Chuẩn hóa v3 → v4 (quan trọng)
- Đổi toàn bộ tiền tố `!` (v3) sang hậu tố `!` (v4) ở các trang:
  - `src/teacher/pages/Teachers.tsx` (nút Chi tiết/Đình chỉ/Tin/Xóa)
  - `src/teacher/pages/Students.tsx` (nút Chi tiết)
  - `src/teacher/pages/Exams.tsx` (nút Sửa/Xóa/Xóa xác nhận)
  - `src/teacher/pages/Questions.tsx` (nút Xem/Sửa/Xóa và badge)
  - `src/teacher/pages/Feedback.tsx`, `src/teacher/pages/MockExams.tsx` (nút trạng thái)
- Tiếp tục dùng `card` (đã khai báo ở `src/styles/globals.css:147`) để tái tạo container giống v3.

## Thay Đổi File Cụ Thể
- `src/teacher/pages/Questions.tsx`
  - Giữ `card` cho: thống kê (260), thanh lọc (288), bảng (325)
  - Sửa header bảng sang nền trắng và viền mảnh (chỉnh `TableRow` header)
  - Chuẩn hóa các nút hành động theo hậu tố `!` (đã chuyển)
- Không sửa header/layout tổng (`AppLayout`).

## Kiểm Thử
- Chạy dev server và kiểm tra `teacher/questions`:
  - Thấy 4 ô thống kê nhỏ, thanh lọc trong thẻ trắng bo tròn, bảng trắng viền mảnh, nút hành động giống v3
- Nếu port 3000 bận, chạy trên 3006 để preview.

## Mở Rộng (Tuỳ Chọn)
- Áp dụng cùng phong cách `card` + chuẩn hóa `!` cho `Students`, `Teachers`, `Exams` để toàn bộ khu vực teacher đồng bộ với v3.

Xác nhận để tôi tiến hành chỉnh header row của bảng sang nền trắng + viền mảnh và rà soát nốt các vị trí quan trọng dấu `!` còn sót ở `Teachers.tsx` để khớp tuyệt đối với ảnh mẫu.