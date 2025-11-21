# Types Documentation

Thư mục này chứa tất cả các type definitions cho dự án Online Exam Website.

## 📁 Cấu trúc Files

```
src/types/
├── exam.types.ts       # Types liên quan đến bài thi và chứng chỉ
├── user.types.ts       # Types về người dùng và xác thực
├── course.types.ts     # Types về khóa học và tài liệu học tập
├── api.types.ts        # Types cho API requests/responses
├── common.types.ts     # Types dùng chung trong toàn ứng dụng
├── index.ts            # Export tất cả types từ một điểm trung tâm
└── README.md           # File này
```

## 📖 Mô tả chi tiết

### 1. exam.types.ts

Chứa tất cả types liên quan đến bài thi:

- `IExam` - Interface cho thông tin bài thi
- `ICertificationExam` - Interface cho bài thi chứng chỉ quốc tế
- `IQuestion` - Interface cho câu hỏi trong bài thi
- `IExamResult` - Interface cho kết quả bài thi
- `IExamProgress` - Interface cho trạng thái làm bài
- Props types cho các components: `IExamDetailProps`, `IExamTakingProps`, etc.

### 2. user.types.ts

Chứa tất cả types liên quan đến người dùng và xác thực:

- `IUser` - Interface cho thông tin người dùng
- `ILoginCredentials` - Interface cho đăng nhập
- `IRegisterForm` - Interface cho đăng ký
- `IOTPVerification` - Interface cho xác thực OTP
- `IAuthToken` - Interface cho token xác thực
- Props types cho các components: `ILoginProps`, `IRegisterProps`, etc.

### 3. course.types.ts

Chứa tất cả types liên quan đến khóa học:

- `ICourse` - Interface cho thông tin khóa học
- `ILesson` - Interface cho bài học
- `IInstructor` - Interface cho giảng viên
- `ICourseReview` - Interface cho đánh giá khóa học
- `ICourseProgress` - Interface cho tiến độ học tập
- Props types cho các components: `IStudyMaterialsProps`, `IStudyDetailProps`, etc.

### 4. api.types.ts

Chứa tất cả types cho API:

- `IApiResponse<T>` - Generic wrapper cho API response
- `IPaginatedResponse<T>` - Response có phân trang
- `ILoginRequest/Response` - Types cho đăng nhập
- `IGetExamsRequest/Response` - Types cho lấy danh sách bài thi
- `IPaymentRequest/Response` - Types cho thanh toán
- Và nhiều types khác cho các API endpoints

### 5. common.types.ts

Chứa các types dùng chung:

- Generic callback types: `TCallback`, `TCallbackWithParam`
- State types: `ILoadingState`, `IAsyncState`, `IFormState`
- UI component types: `IModalProps`, `ITableColumn`, `ITabItem`
- Utility types: `DeepPartial`, `DeepRequired`, `PickByType`
- Pagination, Filter, Sort types
- Toast, Alert, Validation types

## 🚀 Cách sử dụng

### Import từ index.ts (Khuyến nghị)

```typescript
import { IExam, IUser, ICourse, IApiResponse } from "@/types";
```

### Import trực tiếp từ file cụ thể

```typescript
import { IExam, IExamResult } from "@/types/exam.types";
import { IUser, IAuthToken } from "@/types/user.types";
```

## 💡 Ví dụ sử dụng

### 1. Sử dụng trong Component Props

```typescript
import { IExamDetailProps } from "@/types";

export const ExamDetail: React.FC<IExamDetailProps> = ({
  exam,
  onBackToList,
  onRegister,
}) => {
  // Component code
};
```

### 2. Sử dụng trong State Management

```typescript
import { IExam, ILoadingState } from "@/types";
import { useState } from "react";

const [exams, setExams] = useState<IExam[]>([]);
const [loading, setLoading] = useState<ILoadingState>({
  isLoading: false,
  error: null,
});
```

### 3. Sử dụng với API Calls

```typescript
import { IApiResponse, IGetExamsResponse } from "@/types";
import axios from "axios";

const fetchExams = async (): Promise<IApiResponse<IGetExamsResponse>> => {
  const response = await axios.get("/api/exams");
  return response.data;
};
```

### 4. Sử dụng Generic Types

```typescript
import { IAsyncState, IApiResponse } from "@/types";

const [examState, setExamState] = useState<IAsyncState<IExam>>({
  data: null,
  isLoading: false,
  error: null,
});
```

## 📝 Quy tắc đặt tên

### Interfaces

- Bắt đầu bằng chữ `I` (VD: `IExam`, `IUser`, `ICourse`)
- Sử dụng PascalCase
- Tên phải mô tả rõ ràng mục đích

### Types

- Bắt đầu bằng chữ `T` (VD: `TStatus`, `TCallback`)
- Sử dụng PascalCase

### Props Interfaces

- Kết thúc bằng `Props` (VD: `IExamDetailProps`, `ILoginProps`)

### Response/Request Types

- Kết thúc bằng `Response` hoặc `Request`
- VD: `ILoginResponse`, `IGetExamsRequest`

## 🔧 Bảo trì và Cập nhật

### Khi thêm type mới:

1. Thêm vào file tương ứng (exam, user, course, api, hoặc common)
2. Export từ file đó
3. Thêm re-export vào `index.ts` nếu là type thường dùng
4. Thêm comment giải thích mục đích sử dụng

### Khi sửa type:

1. Kiểm tra tất cả nơi sử dụng type đó
2. Cập nhật type definition
3. Chạy linter để kiểm tra lỗi
4. Test lại các components sử dụng type đã sửa

## ✅ Best Practices

1. **Luôn sử dụng types** thay vì `any` khi có thể
2. **Tái sử dụng types** đã có thay vì tạo mới
3. **Comment đầy đủ** cho các types phức tạp
4. **Tổ chức logic** - nhóm các types liên quan lại với nhau
5. **Sử dụng Generic types** khi cần tính linh hoạt
6. **Export đúng cách** - export từ index.ts cho dễ import

## 🎯 Lợi ích

- ✅ **Type Safety**: Phát hiện lỗi sớm trong quá trình development
- ✅ **IntelliSense**: Auto-complete và gợi ý trong IDE
- ✅ **Documentation**: Types là tài liệu tự động cho code
- ✅ **Refactoring**: Dễ dàng refactor code với sự hỗ trợ của TypeScript
- ✅ **Maintainability**: Code dễ bảo trì và mở rộng
- ✅ **Team Collaboration**: Dễ dàng hiểu code của người khác

## 📚 Tài liệu tham khảo

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

**Lưu ý**: Tất cả types trong thư mục này đã được extract từ các components hiện có và được tổ chức lại theo cấu trúc logic. KHÔNG sửa đổi các components hiện tại, chỉ tạo types files mới.
