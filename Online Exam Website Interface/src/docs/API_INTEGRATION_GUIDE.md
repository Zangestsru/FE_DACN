# 🔌 API Integration Guide

Hướng dẫn chi tiết cách kết nối API thật vào ứng dụng Online Exam Website Interface.

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Chuẩn bị](#chuẩn-bị)
3. [Cấu hình API](#cấu-hình-api)
4. [Update Services](#update-services)
5. [Testing](#testing)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## 🎯 Tổng quan

Hiện tại ứng dụng đang sử dụng **mock data** trong các services. Để kết nối với API thật, bạn chỉ cần:

1. ✅ Cập nhật file `.env` với API URL thật
2. ✅ Uncomment các axios calls trong services
3. ✅ Remove hoặc comment mock data
4. ✅ Test và handle errors

**Lưu ý quan trọng**: Components **KHÔNG CẦN SỬA** vì đã sử dụng hooks!

---

## 🛠️ Chuẩn bị

### 1. Kiểm tra Backend API

Đảm bảo backend API đã sẵn sàng với các endpoints:

```
GET    /api/exams              - Lấy danh sách exams
GET    /api/exams/:id          - Lấy chi tiết exam
POST   /api/exams/:id/register - Đăng ký thi
POST   /api/exams/:id/submit   - Nộp bài thi
GET    /api/exams/:id/result   - Lấy kết quả

POST   /api/auth/login         - Đăng nhập
POST   /api/auth/register      - Đăng ký
POST   /api/auth/logout        - Đăng xuất
POST   /api/auth/refresh       - Refresh token

GET    /api/courses            - Lấy danh sách courses
GET    /api/courses/:id        - Lấy chi tiết course
POST   /api/courses/:id/enroll - Đăng ký khóa học
```

### 2. Chuẩn bị API Documentation

Cần có:

- ✅ API endpoint list
- ✅ Request/Response format
- ✅ Authentication method (JWT, OAuth, etc.)
- ✅ Error codes và messages
- ✅ Rate limiting info

---

## ⚙️ Cấu hình API

### Bước 1: Tạo file `.env`

Tạo file `.env` ở root project:

```env
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_TOKEN_KEY=access_token
VITE_AUTH_REFRESH_KEY=refresh_token

# Environment
VITE_ENV=production
```

### Bước 2: Update `src/config/api.config.ts`

File này đã được setup sẵn, chỉ cần verify:

```typescript
// src/config/api.config.ts

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const API_VERSION = import.meta.env.VITE_API_VERSION || "v1";
export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

export const REQUEST_TIMEOUT =
  parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;
```

**✅ File này đã OK, không cần sửa!**

### Bước 3: Verify Axios Instance

File `src/services/api.service.ts` đã có axios instance với:

- ✅ Base URL configuration
- ✅ Request interceptors (auto add token)
- ✅ Response interceptors (handle errors)
- ✅ Token management functions

**✅ File này đã OK, không cần sửa!**

---

## 🔄 Update Services

Bây giờ chỉ cần update các service files để sử dụng real API thay vì mock data.

### Example 1: Exam Service

**File**: `src/services/exam.service.ts`

#### Trước (Mock):

```typescript
export const getAllExams = async (
  params?: IGetExamsRequest
): Promise<IApiResponse<IPaginatedResponse<IExam>>> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock data
  const mockExams: IExam[] = [
    {
      id: "1",
      title: "AWS Certified Cloud Practitioner",
      // ... mock data
    },
  ];

  return Promise.resolve({
    success: true,
    data: {
      data: mockExams,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: mockExams.length,
        totalPages: Math.ceil(mockExams.length / (params?.limit || 10)),
      },
    },
    message: "Lấy danh sách đề thi thành công",
  });
};
```

#### Sau (Real API):

```typescript
export const getAllExams = async (
  params?: IGetExamsRequest
): Promise<IApiResponse<IPaginatedResponse<IExam>>> => {
  try {
    const response = await apiClient.get<
      IApiResponse<IPaginatedResponse<IExam>>
    >(endpoints.EXAM.GET_ALL, {
      params: {
        page: params?.page,
        limit: params?.limit,
        category: params?.category,
        level: params?.level,
        search: params?.search,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Get all exams error:", error);
    throw new Error(
      error.response?.data?.message || "Không thể lấy danh sách đề thi"
    );
  }
};
```

**Thay đổi:**

1. ✅ Remove mock data
2. ✅ Remove setTimeout
3. ✅ Add axios call với `apiClient.get()`
4. ✅ Pass params vào request
5. ✅ Return `response.data`
6. ✅ Add try-catch error handling

---

### Example 2: Auth Service

**File**: `src/services/auth.service.ts`

#### Trước (Mock):

```typescript
export const login = async (
  credentials: ILoginRequest
): Promise<IApiResponse<ILoginResponse>> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock response
  const mockUser: IUser = {
    id: "1",
    email: credentials.email,
    fullName: "Nguyễn Văn A",
    // ... mock data
  };

  const mockResponse: ILoginResponse = {
    user: mockUser,
    accessToken: "mock_access_token_" + Date.now(),
    refreshToken: "mock_refresh_token_" + Date.now(),
    expiresIn: 3600,
  };

  return Promise.resolve({
    success: true,
    data: mockResponse,
    message: "Đăng nhập thành công",
  });
};
```

#### Sau (Real API):

```typescript
export const login = async (
  credentials: ILoginRequest
): Promise<IApiResponse<ILoginResponse>> => {
  try {
    const response = await apiClient.post<IApiResponse<ILoginResponse>>(
      endpoints.AUTH.LOGIN,
      {
        email: credentials.email,
        password: credentials.password,
      }
    );

    // Save tokens to localStorage
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken } = response.data.data;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

      // Set token in axios instance
      setAuthToken(accessToken);
    }

    return response.data;
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(error.response?.data?.message || "Đăng nhập thất bại");
  }
};
```

**Thay đổi:**

1. ✅ Remove mock data
2. ✅ Add axios POST call
3. ✅ Save tokens to localStorage
4. ✅ Set token in axios instance
5. ✅ Error handling

---

### Example 3: Course Service

**File**: `src/services/course.service.ts`

#### Trước (Mock):

```typescript
export const getAllCourses = async (
  params?: IGetCoursesRequest
): Promise<IApiResponse<IPaginatedResponse<ICourse>>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockCourses: ICourse[] = [
    {
      id: "1",
      title: "Lập Trình Full-Stack",
      // ... mock data
    },
  ];

  return Promise.resolve({
    success: true,
    data: {
      data: mockCourses,
      pagination: {
        /* ... */
      },
    },
    message: "Lấy danh sách khóa học thành công",
  });
};
```

#### Sau (Real API):

```typescript
export const getAllCourses = async (
  params?: IGetCoursesRequest
): Promise<IApiResponse<IPaginatedResponse<ICourse>>> => {
  try {
    const response = await apiClient.get<
      IApiResponse<IPaginatedResponse<ICourse>>
    >(endpoints.COURSE.GET_ALL, {
      params: {
        page: params?.page,
        limit: params?.limit,
        category: params?.category,
        search: params?.search,
        level: params?.level,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Get all courses error:", error);
    throw new Error(
      error.response?.data?.message || "Không thể lấy danh sách khóa học"
    );
  }
};
```

---

## 🧪 Testing

### 1. Test từng service riêng lẻ

Tạo file test hoặc test trong browser console:

```typescript
// Test trong browser console
import { examService } from "./services";

// Test get all exams
examService
  .getAllExams({ page: 1, limit: 10 })
  .then((response) => console.log("Exams:", response))
  .catch((error) => console.error("Error:", error));

// Test login
authService
  .login({ email: "test@example.com", password: "password123" })
  .then((response) => console.log("Login:", response))
  .catch((error) => console.error("Error:", error));
```

### 2. Test qua UI

1. **Login Page**: Test đăng nhập
2. **Exam List**: Test hiển thị danh sách
3. **Exam Detail**: Test xem chi tiết
4. **Course List**: Test danh sách khóa học
5. **Register**: Test đăng ký

### 3. Kiểm tra Network Tab

Mở DevTools → Network tab:

- ✅ Check request URL đúng
- ✅ Check request headers (có token không?)
- ✅ Check request body
- ✅ Check response status (200, 201, 400, 401, etc.)
- ✅ Check response data format

### 4. Kiểm tra Console

- ✅ Không có errors
- ✅ Không có warnings
- ✅ Log messages hợp lý

---

## 🚨 Error Handling

### 1. HTTP Status Codes

Xử lý các status codes phổ biến:

```typescript
// src/services/api.service.ts - Response Interceptor

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (!response) {
      // Network error
      console.error("Network error:", error);
      return Promise.reject(new Error("Lỗi kết nối mạng"));
    }

    switch (response.status) {
      case 400:
        // Bad Request
        console.error("Bad request:", response.data);
        break;

      case 401:
        // Unauthorized - Token expired
        console.error("Unauthorized - Token expired");
        await handleUnauthorized();
        break;

      case 403:
        // Forbidden - No permission
        console.error("Forbidden - No permission");
        handleForbidden();
        break;

      case 404:
        // Not Found
        console.error("Resource not found:", response.config.url);
        break;

      case 422:
        // Validation Error
        console.error("Validation error:", response.data);
        break;

      case 500:
        // Internal Server Error
        console.error("Server error:", response.data);
        break;

      default:
        console.error("API error:", response.status, response.data);
    }

    return Promise.reject(error);
  }
);
```

### 2. Retry Logic

Thêm retry cho failed requests:

```typescript
import axios from "axios";
import axiosRetry from "axios-retry";

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
    );
  },
});
```

### 3. Timeout Handling

```typescript
// Đã config trong api.config.ts
export const REQUEST_TIMEOUT = 30000; // 30 seconds

apiClient.defaults.timeout = REQUEST_TIMEOUT;
```

---

## 🎯 Best Practices

### 1. Environment Variables

```env
# Development
VITE_API_BASE_URL=http://localhost:3000

# Staging
VITE_API_BASE_URL=https://staging-api.yourdomain.com

# Production
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 2. Error Messages

Sử dụng error messages từ backend:

```typescript
catch (error: any) {
  const message = error.response?.data?.message || 'Đã có lỗi xảy ra';
  throw new Error(message);
}
```

### 3. Loading States

Hooks đã handle loading states:

```typescript
const { data, loading, error } = useExams();

if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
```

### 4. Token Management

```typescript
// Auto refresh token khi expired
const handleUnauthorized = async () => {
  try {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      // Redirect to login
      window.location.href = "/login";
      return;
    }

    // Call refresh token API
    const response = await apiClient.post(endpoints.AUTH.REFRESH, {
      refreshToken,
    });

    const { accessToken } = response.data.data;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    setAuthToken(accessToken);

    // Retry original request
    return apiClient.request(error.config);
  } catch (err) {
    // Refresh failed, logout
    localStorage.clear();
    window.location.href = "/login";
  }
};
```

### 5. Request Cancellation

```typescript
import { useEffect } from "react";
import axios from "axios";

const useExams = () => {
  useEffect(() => {
    const cancelToken = axios.CancelToken.source();

    examService
      .getAllExams({ cancelToken: cancelToken.token })
      .then(/* ... */)
      .catch((error) => {
        if (axios.isCancel(error)) {
          console.log("Request canceled");
        }
      });

    return () => {
      cancelToken.cancel("Component unmounted");
    };
  }, []);
};
```

---

## 📝 Checklist

### Pre-Integration

- [ ] Backend API đã sẵn sàng
- [ ] API documentation đã có
- [ ] Test API với Postman/Insomnia
- [ ] Có API credentials (API key, tokens, etc.)

### Integration

- [ ] Tạo file `.env` với API URL
- [ ] Update `api.config.ts` nếu cần
- [ ] Update từng service file:
  - [ ] `exam.service.ts`
  - [ ] `auth.service.ts`
  - [ ] `user.service.ts`
  - [ ] `course.service.ts`
  - [ ] `payment.service.ts`
- [ ] Remove hoặc comment mock data
- [ ] Add proper error handling

### Testing

- [ ] Test login/register flow
- [ ] Test exam list/detail
- [ ] Test course list/detail
- [ ] Test error cases (401, 404, 500)
- [ ] Test loading states
- [ ] Test empty states
- [ ] Check Network tab
- [ ] Check Console for errors

### Production

- [ ] Update `.env.production` với production API URL
- [ ] Enable error tracking (Sentry, LogRocket)
- [ ] Setup monitoring
- [ ] Test trên staging trước
- [ ] Deploy to production

---

## 🆘 Troubleshooting

### Lỗi CORS

```typescript
// Backend cần enable CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "https://yourdomain.com"],
    credentials: true,
  })
);
```

### Token không được gửi

```typescript
// Check axios config
apiClient.defaults.withCredentials = true;

// Hoặc trong request
axios.get(url, { withCredentials: true });
```

### Response format không khớp

```typescript
// Verify response format
interface IApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Nếu backend trả về format khác, update interface
```

---

## 📚 Resources

- [Axios Documentation](https://axios-http.com/)
- [React Query](https://tanstack.com/query/latest) - Alternative for data fetching
- [SWR](https://swr.vercel.app/) - Alternative for data fetching

---

**Lưu ý**: Document này sẽ được update khi có thay đổi về API hoặc cấu trúc project.

**Last Updated**: October 10, 2025
