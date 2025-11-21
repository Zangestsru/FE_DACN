# Services Documentation

Thư mục này chứa tất cả các service layer để tương tác với API backend.

## 📁 Cấu trúc

```
src/services/
├── api.service.ts        # Base API service với axios instance
├── auth.service.ts       # Authentication & Authorization
├── exam.service.ts       # Exam & Certification management
├── user.service.ts       # User profile & management
├── course.service.ts     # Course & Study materials
├── payment.service.ts    # Payment processing
├── index.ts              # Export tất cả services
└── README.md             # Documentation
```

## 🚀 Cách sử dụng

### Import Services

```typescript
// Import từng service
import { authService, examService, userService } from "@/services";

// Hoặc import tất cả
import services from "@/services";
```

### Sử dụng trong Component

```typescript
import { authService } from '@/services';

const LoginComponent = () => {
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      console.log('User:', response.user);
      console.log('Token:', response.token);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // JSX code
  );
};
```

## 📚 Services

### 1. API Service (`api.service.ts`)

Base service cung cấp các methods HTTP cơ bản.

#### Methods:

- `get<T>(url, config?)` - GET request
- `post<T>(url, data?, config?)` - POST request
- `put<T>(url, data?, config?)` - PUT request
- `patch<T>(url, data?, config?)` - PATCH request
- `delete<T>(url, config?)` - DELETE request
- `upload<T>(url, file, onProgress?)` - Upload file
- `download(url, filename, onProgress?)` - Download file

#### Token Management:

- `setToken(token)` - Set authentication token
- `removeToken()` - Remove authentication token
- `getToken()` - Get current token
- `checkAuth()` - Check if authenticated

#### Ví dụ:

```typescript
import { apiService } from "@/services";

// GET request
const data = await apiService.get("/endpoint");

// POST request
const result = await apiService.post("/endpoint", { data });

// Upload file với progress
await apiService.upload("/upload", file, (progress) => {
  console.log(`Upload: ${progress}%`);
});
```

---

### 2. Auth Service (`auth.service.ts`)

Xử lý authentication và authorization.

#### Methods:

**Đăng nhập & Đăng ký:**

- `login(email, password)` - Đăng nhập
- `register(userData)` - Đăng ký tài khoản
- `logout()` - Đăng xuất
- `loginWithGoogle(token)` - Đăng nhập với Google
- `loginWithFacebook(token)` - Đăng nhập với Facebook

**Token Management:**

- `refreshToken()` - Refresh access token

**Password Management:**

- `forgotPassword(email)` - Quên mật khẩu
- `resetPassword(data)` - Reset mật khẩu
- `changePassword(oldPass, newPass)` - Đổi mật khẩu

**OTP Verification:**

- `verifyOTP(type, contact, code)` - Xác thực OTP
- `resendOTP(type, contact)` - Gửi lại OTP
- `verifyEmail(token)` - Xác thực email

**Utility:**

- `getCurrentUser()` - Lấy thông tin user hiện tại
- `isAuthenticated()` - Kiểm tra đã đăng nhập

#### Ví dụ:

```typescript
import { authService } from "@/services";

// Đăng nhập
const response = await authService.login("user@example.com", "password");
console.log("User:", response.user);

// Đăng ký
const registerData = {
  username: "newuser",
  email: "new@example.com",
  password: "password123",
  fullName: "Nguyễn Văn A",
};
await authService.register(registerData);

// Đăng xuất
await authService.logout();

// Kiểm tra đã đăng nhập
if (authService.isAuthenticated()) {
  const user = authService.getCurrentUser();
}
```

---

### 3. Exam Service (`exam.service.ts`)

Quản lý bài thi và chứng chỉ.

#### Methods:

**Exam Management:**

- `getAllExams(params?)` - Lấy danh sách bài thi
- `getExamById(id)` - Lấy chi tiết bài thi
- `searchExams(query)` - Tìm kiếm bài thi
- `getExamsByCategory(category)` - Lọc theo category
- `getExamsByLevel(level)` - Lọc theo level
- `getRelatedExams(examId)` - Lấy bài thi liên quan

**Exam Taking:**

- `registerExam(examId, userId?)` - Đăng ký thi
- `startExam(examId)` - Bắt đầu làm bài
- `getExamQuestions(examId)` - Lấy câu hỏi
- `submitExam(examId, data)` - Nộp bài thi
- `getExamResult(examId, userId?)` - Lấy kết quả
- `getMyResults()` - Lấy danh sách kết quả của user

**Statistics & Reports:**

- `getExamStatistics(examId)` - Lấy thống kê bài thi
- `reportIssue(examId, description, attachments?)` - Báo cáo sự cố

**Certification:**

- `getAllCertifications()` - Lấy danh sách chứng chỉ
- `getMyCertificates()` - Lấy chứng chỉ của user
- `downloadCertificate(certificateId)` - Download chứng chỉ
- `verifyCertificate(certificateNumber)` - Xác thực chứng chỉ

#### Ví dụ:

```typescript
import { examService } from "@/services";

// Lấy danh sách bài thi với pagination
const response = await examService.getAllExams({
  page: 1,
  limit: 12,
  category: "Cloud Computing",
});

// Đăng ký thi
await examService.registerExam(examId);

// Bắt đầu làm bài
const session = await examService.startExam(examId);

// Nộp bài
const result = await examService.submitExam(examId, {
  answers: { 1: 0, 2: 2, 3: 1 },
  timeSpent: 3600,
});

// Download chứng chỉ
await examService.downloadCertificate(certificateId);
```

---

### 4. User Service (`user.service.ts`)

Quản lý user profile và thông tin tài khoản.

#### Methods:

**Profile Management:**

- `getUserProfile()` - Lấy thông tin profile
- `getUserById(id)` - Lấy thông tin user theo ID
- `updateProfile(data)` - Cập nhật profile
- `updateAvatar(file)` - Cập nhật avatar
- `changePassword(oldPass, newPass)` - Đổi mật khẩu

**Activity & Statistics:**

- `getActivityHistory()` - Lấy lịch sử hoạt động
- `getUserStatistics()` - Lấy thống kê user

**Admin Functions:**

- `getAllUsers(params?)` - Lấy danh sách users (Admin)
- `deleteUser(id)` - Xóa user (Admin)

**Payment Info:**

- `updateCustomerInfo(data)` - Cập nhật thông tin khách hàng

**Utility:**

- `getCurrentUser()` - Lấy user hiện tại
- `hasRole(role)` - Kiểm tra role
- `isAdmin()` - Kiểm tra là admin
- `isInstructor()` - Kiểm tra là instructor
- `isStudent()` - Kiểm tra là student

#### Ví dụ:

```typescript
import { userService } from "@/services";

// Lấy profile
const user = await userService.getUserProfile();

// Cập nhật profile
await userService.updateProfile({
  fullName: "Nguyễn Văn B",
  phone: "0987654321",
});

// Upload avatar
const file = document.querySelector('input[type="file"]').files[0];
const { avatarUrl } = await userService.updateAvatar(file);

// Lấy thống kê
const stats = await userService.getUserStatistics();
console.log("Completed exams:", stats.completedExams);

// Kiểm tra role
if (userService.isAdmin()) {
  // Show admin features
}
```

---

### 5. Course Service (`course.service.ts`)

Quản lý khóa học và tài liệu học tập.

#### Methods:

**Course Management:**

- `getAllCourses(params?)` - Lấy danh sách khóa học
- `getCourseById(id)` - Lấy chi tiết khóa học
- `searchCourses(query)` - Tìm kiếm khóa học
- `getCoursesByCategory(category)` - Lọc theo category
- `getRelatedCourses(courseId)` - Lấy khóa học liên quan

**Enrollment:**

- `enrollCourse(courseId)` - Đăng ký khóa học
- `unenrollCourse(courseId)` - Hủy đăng ký
- `getMyCourses()` - Lấy khóa học đã đăng ký

**Progress Tracking:**

- `getCourseProgress(courseId)` - Lấy tiến độ học tập
- `updateCourseProgress(courseId, lessonId)` - Cập nhật tiến độ

**Lesson Management:**

- `getCourseLessons(courseId)` - Lấy danh sách bài học
- `getLessonDetail(courseId, lessonId)` - Lấy chi tiết bài học
- `completeLesson(courseId, lessonId)` - Đánh dấu hoàn thành
- `getLessonMaterials(lessonId)` - Lấy tài liệu bài học
- `downloadLessonMaterial(lessonId, materialId)` - Download tài liệu

**Notes:**

- `getLessonNotes(lessonId)` - Lấy ghi chú
- `addLessonNote(lessonId, content, timestamp?)` - Thêm ghi chú
- `updateLessonNote(lessonId, noteId, content)` - Cập nhật ghi chú
- `deleteLessonNote(lessonId, noteId)` - Xóa ghi chú

**Reviews:**

- `getCourseReviews(courseId)` - Lấy đánh giá
- `addCourseReview(courseId, rating, comment)` - Thêm đánh giá

#### Ví dụ:

```typescript
import { courseService } from "@/services";

// Lấy danh sách khóa học
const response = await courseService.getAllCourses({
  page: 1,
  limit: 9,
  category: "programming",
});

// Đăng ký khóa học
await courseService.enrollCourse(courseId);

// Lấy tiến độ
const progress = await courseService.getCourseProgress(courseId);
console.log(`Progress: ${progress.progressPercentage}%`);

// Lấy danh sách bài học
const lessons = await courseService.getCourseLessons(courseId);

// Đánh dấu hoàn thành bài học
await courseService.completeLesson(courseId, lessonId);

// Thêm ghi chú
await courseService.addLessonNote(lessonId, "Ghi chú quan trọng", 120);

// Đánh giá khóa học
await courseService.addCourseReview(courseId, 5, "Khóa học rất hay!");
```

---

### 6. Payment Service (`payment.service.ts`)

Xử lý thanh toán.

#### Methods:

**Payment Management:**

- `createPayment(data)` - Tạo payment mới
- `verifyPayment(paymentId)` - Xác thực payment
- `getPaymentHistory()` - Lấy lịch sử thanh toán
- `getPaymentById(id)` - Lấy chi tiết payment
- `cancelPayment(id)` - Hủy payment
- `refundPayment(id, reason?)` - Hoàn tiền

**Payment Callbacks:**

- `handleMoMoCallback(params)` - Xử lý callback MoMo
- `handleVNPayCallback(params)` - Xử lý callback VNPay
- `handlePayPalCallback(params)` - Xử lý callback PayPal

**Shortcuts:**

- `createExamPayment(examId, amount, method, customerInfo)` - Payment cho exam
- `createCoursePayment(courseId, amount, method, customerInfo)` - Payment cho course

#### Ví dụ:

```typescript
import { paymentService } from "@/services";

// Tạo payment cho exam
const payment = await paymentService.createExamPayment(
  examId,
  1200000,
  "momo",
  {
    fullName: "Nguyễn Văn A",
    email: "user@example.com",
    phone: "0123456789",
  }
);

// Redirect đến payment URL
window.location.href = payment.paymentUrl;

// Xác thực payment sau khi callback
const result = await paymentService.verifyPayment(paymentId);
if (result.status === "success") {
  console.log("Payment successful!");
}

// Lấy lịch sử thanh toán
const history = await paymentService.getPaymentHistory();
```

---

## 🔧 API Configuration

### Base URL

API base URL được cấu hình trong file `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=v1
```

### Interceptors

API service tự động xử lý:

- **Request Interceptor:**

  - Thêm Authorization header
  - Thêm timestamp để tránh cache
  - Log request (development mode)

- **Response Interceptor:**
  - Log response (development mode)
  - Xử lý lỗi 401 (Unauthorized)
  - Xử lý lỗi 403 (Forbidden)
  - Xử lý các lỗi HTTP khác

### Error Handling

Tất cả services đều throw error khi có lỗi. Bạn cần handle errors trong component:

```typescript
try {
  const result = await examService.submitExam(examId, data);
  // Handle success
} catch (error) {
  // Handle error
  console.error("Error:", error.message);
  showToast(error.message);
}
```

## 📝 Mock Data

Hiện tại tất cả services đang sử dụng **mock data** để test.

### Khi nào cần chuyển sang API thật?

1. Uncomment các dòng API call trong mỗi method
2. Comment hoặc xóa phần mock response
3. Đảm bảo backend API đã sẵn sàng

### Ví dụ chuyển đổi:

```typescript
// BEFORE (Mock)
async login(email: string, password: string): Promise<ILoginResponse> {
  // TODO: Uncomment khi có API thật
  // const response = await apiService.post<ILoginResponse>(
  //   AUTH_ENDPOINTS.LOGIN,
  //   { email, password }
  // );

  // Mock response
  return Promise.resolve(mockResponse);
}

// AFTER (Real API)
async login(email: string, password: string): Promise<ILoginResponse> {
  const response = await apiService.post<ILoginResponse>(
    AUTH_ENDPOINTS.LOGIN,
    { email, password }
  );

  // Save token
  setToken(response.token.accessToken);
  localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));

  return response;
}
```

## 🎯 Best Practices

### 1. Luôn sử dụng try-catch

```typescript
try {
  const data = await examService.getAllExams();
  setExams(data);
} catch (error) {
  showError(error.message);
}
```

### 2. Sử dụng TypeScript types

```typescript
import type { IExam, IUser } from "@/types";

const exams: IExam[] = await examService.getAllExams();
const user: IUser = await userService.getUserProfile();
```

### 3. Loading states

```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await examService.getAllExams();
    setExams(data);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### 4. Cleanup

```typescript
useEffect(() => {
  let cancelled = false;

  const fetchData = async () => {
    const data = await examService.getAllExams();
    if (!cancelled) {
      setExams(data);
    }
  };

  fetchData();

  return () => {
    cancelled = true;
  };
}, []);
```

## 🔍 Debugging

### Enable Debug Mode

Trong development mode, tất cả API calls sẽ được log ra console:

```
🚀 API Request: { method: 'GET', url: '/exams', ... }
✅ API Response: { status: 200, data: [...] }
❌ Response Error: { status: 401, message: 'Unauthorized' }
```

### Check Network Tab

Mở DevTools > Network tab để xem chi tiết requests/responses.

## 📚 Tài liệu tham khảo

- [Axios Documentation](https://axios-http.com/docs/intro)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Query](https://tanstack.com/query/latest) (recommended for data fetching)

---

**Lưu ý**: Đây là mock services. Khi backend API sẵn sàng, uncomment các API calls và xóa mock responses.
