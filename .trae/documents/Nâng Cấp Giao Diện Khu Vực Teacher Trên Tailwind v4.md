## Mục Tiêu
- Nâng cấp toàn bộ giao diện khu vực `teacher` theo chuẩn Tailwind v4 để đẹp, hiện đại và thống nhất.
- Giữ nguyên header; tập trung vào card, bảng, filter, spacing, typography và nút hành động.

## Nguyên Tắc Giao Diện
- Dùng thẻ trắng bo tròn, viền tinh, bóng nhẹ cho mọi khối nội dung (`card`).
- Spacing thống nhất: `p-4 / p-6`, `gap-4 / gap-6` theo ngữ cảnh.
- Typography: tiêu đề `text-2xl font-semibold`, nội dung `text-sm`/`text-base` với màu `text-gray-900`/`text-gray-600`.
- Dark mode: duy trì `dark:` đồng bộ.
- Cú pháp important: đổi tiền tố `!` (v3) sang hậu tố `!` (v4) cho tất cả nơi cần override.

## Cập Nhật Global (nhẹ, trong `src/styles/globals.css`)
- Giữ `@utility card` đã có; tái sử dụng cho mọi container.
- Bổ sung nhẹ các utility mềm để tinh chỉnh UI:
  - `@utility badge-soft-{blue|green|yellow|red}`: nhãn ring-1 insets + màu dịu cho badge.
  - `@utility btn-outline-soft`: nút viền xám nhạt với hover nền xám mờ (áp dụng cho Xem/Sửa).
  - `@utility table-row-hover`: nền xám rất nhạt khi hover.

## Cập Nhật Theo Trang
1. `src/teacher/pages/Questions.tsx`
- Đã bọc thống kê, filter, bảng bằng `card`; tiếp tục tinh chỉnh:
  - Header bảng nền trắng + viền mảnh (đã đổi).
  - Thêm hover cho hàng (`table-row-hover`).
  - Nút Xem/Sửa dùng `btn-outline-soft`; Xóa dùng `bg-red-500! hover:bg-red-600! text-white!`.

2. `src/teacher/pages/Teachers.tsx`
- Bọc filter và bảng bằng `card` để thống nhất.
- Chuẩn hóa toàn bộ class important sang hậu tố `!` (v4) cho nút Chi tiết/Đình chỉ/Tin/Xóa.
- Dùng `badge-soft-green/yellow/red` cho trạng thái.
- Thêm hover hàng, tăng `gap-2` ở cụm hành động.

3. `src/teacher/pages/Students.tsx`
- Giữ `card` cho filter và bảng; đổi nút Chi tiết sang `btn-outline-soft`.
- Thêm hover hàng, chuẩn màu chữ và padding.

4. `src/teacher/pages/Exams.tsx`
- Đã bọc bảng bằng `card`; tinh chỉnh nút Sửa/Xóa theo `btn-outline-soft` và `bg-red-500!`.
- Badge trạng thái dùng `badge-soft-green` cho Phát hành và `badge-soft-gray` cho Nháp.

5. `src/teacher/components/education/*`
- Giữ tất cả panel (Metrics, Charts, Activities, Results, CourseStatistics) dùng `card p-6`.
- Tăng khoảng cách `space-y-6`, dùng icon nền màu dịu (blue/green/purple/orange) với độ đậm vừa phải.

## File Sẽ Sửa
- `src/styles/globals.css` (thêm vài utility nhẹ: `badge-soft-*`, `btn-outline-soft`, `table-row-hover`).
- `src/teacher/pages/Teachers.tsx`, `Students.tsx`, `Questions.tsx`, `Exams.tsx` (áp dụng card, chuẩn hóa important v4, hover hàng, nút outline soft, badge soft).
- Giữ nguyên mọi logic, chỉ thay class.

## Kiểm Thử
- Chạy dev và kiểm tra các URL: `/teacher/questions`, `/teacher/teachers`, `/teacher/students`, `/teacher/exams`.
- Xác nhận: thẻ trắng bo tròn, viền tinh, bóng nhẹ; spacing cân đối; bảng nền trắng header viền mảnh; hover hàng tinh tế; nút outline mềm và nút Xóa màu đỏ chuẩn.

## Kết Quả
- Giao diện teacher đồng bộ, hiện đại, đẹp hơn, chạy đúng Tailwind v4.

Xác nhận để tôi bắt đầu thêm các utility nhẹ trong `globals.css` và áp dụng chúng cho các trang trên, đồng thời chuẩn hóa toàn bộ class quan trọng sang cú pháp v4.