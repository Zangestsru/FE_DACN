# Config Documentation

Thư mục này chứa các file cấu hình cho ứng dụng.

## 📁 Files

### api.config.ts

File cấu hình chính cho tất cả API calls.

#### Nội dung:

- **API Base URL**: Lấy từ biến môi trường `VITE_API_BASE_URL`
- **Timeout Settings**: Cấu hình thời gian chờ cho requests
- **Default Headers**: Headers mặc định cho mọi request
- **Axios Instance**: Instance đã được cấu hình sẵn
- **Interceptors**: Request và Response interceptors

#### Sử dụng:

```typescript
import apiClient, {
  API_BASE_URL,
  setAuthToken,
  removeAuthToken,
} from "@/config/api.config";

// Sử dụng apiClient
const response = await apiClient.get("/exams");

// Set token sau khi login
setAuthToken("your-token-here");

// Remove token khi logout
removeAuthToken();
```

## 🔧 API Configuration

### Base URL

```typescript
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const API_VERSION = import.meta.env.VITE_API_VERSION || "v1";
export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;
```

### Timeout Settings

```typescript
export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const UPLOAD_TIMEOUT = 120000; // 2 minutes
export const DOWNLOAD_TIMEOUT = 180000; // 3 minutes
```

### Default Headers

```typescript
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
};
```

## 🔌 Axios Instance

### apiClient

Instance Axios đã được cấu hình với:

- Base URL
- Timeout
- Default headers
- Credentials (cookies)
- Request/Response interceptors

```typescript
import apiClient from "@/config/api.config";

// GET request
const data = await apiClient.get("/endpoint");

// POST request
const result = await apiClient.post("/endpoint", { data });

// PUT request
await apiClient.put("/endpoint/:id", { data });

// DELETE request
await apiClient.delete("/endpoint/:id");
```

## 🔄 Interceptors

### Request Interceptor

Tự động:

- Thêm Authorization header nếu có token
- Thêm timestamp để tránh cache
- Log request trong development mode

### Response Interceptor

Tự động:

- Log response trong development mode
- Xử lý lỗi 401 (Unauthorized)
- Xử lý lỗi 403 (Forbidden)
- Xử lý các lỗi HTTP khác

## 🛠️ Utility Functions

### setAuthToken(token: string)

Set token vào localStorage và axios headers.

```typescript
import { setAuthToken } from "@/config/api.config";

setAuthToken("your-jwt-token");
```

### removeAuthToken()

Xóa token khỏi localStorage và axios headers.

```typescript
import { removeAuthToken } from "@/config/api.config";

removeAuthToken();
```

### getAuthToken()

Lấy token từ localStorage.

```typescript
import { getAuthToken } from "@/config/api.config";

const token = getAuthToken();
```

### isAuthenticated()

Kiểm tra user đã đăng nhập chưa.

```typescript
import { isAuthenticated } from "@/config/api.config";

if (isAuthenticated()) {
  // User đã đăng nhập
}
```

## 📤 Request Helpers

### createRequestConfig()

Tạo config với custom timeout và headers.

```typescript
import { createRequestConfig } from "@/config/api.config";

const config = createRequestConfig(60000, {
  "Custom-Header": "value",
});

await apiClient.get("/endpoint", config);
```

### createUploadConfig()

Tạo config cho upload files với progress tracking.

```typescript
import { createUploadConfig } from "@/config/api.config";

const config = createUploadConfig((progressEvent) => {
  const progress = (progressEvent.loaded / progressEvent.total) * 100;
  console.log(`Upload progress: ${progress}%`);
});

await apiClient.post("/upload", formData, config);
```

### createDownloadConfig()

Tạo config cho download files với progress tracking.

```typescript
import { createDownloadConfig } from "@/config/api.config";

const config = createDownloadConfig((progressEvent) => {
  const progress = (progressEvent.loaded / progressEvent.total) * 100;
  console.log(`Download progress: ${progress}%`);
});

const response = await apiClient.get("/download/:id", config);
```

## 🚨 Error Handling

### Automatic Error Handling

Interceptor tự động xử lý:

- **401 Unauthorized**: Xóa token và redirect về login
- **403 Forbidden**: Log error
- **404 Not Found**: Log error
- **500 Internal Server Error**: Log error
- **503 Service Unavailable**: Log error

### Custom Error Handling

```typescript
try {
  const response = await apiClient.get("/endpoint");
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error("Error:", error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error("No response received");
  } else {
    // Error setting up request
    console.error("Request error:", error.message);
  }
}
```

## 🔐 Security

### Token Storage

Tokens được lưu trong localStorage:

- `access_token`: JWT access token
- `refresh_token`: JWT refresh token (nếu có)

### HTTPS Only

Trong production, đảm bảo:

```env
VITE_HTTPS_ONLY=true
```

### CORS

Cấu hình allowed origins:

```env
VITE_ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## 📝 Best Practices

1. **Luôn sử dụng apiClient** thay vì axios trực tiếp
2. **Xử lý errors** trong components
3. **Sử dụng TypeScript types** từ `@/types`
4. **Log errors** trong development
5. **Không log sensitive data** trong production

## 🔄 Refresh Token

Implement refresh token logic:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const response = await axios.post("/auth/refresh", {
            refreshToken,
          });

          setAuthToken(response.data.accessToken);

          // Retry original request
          return apiClient(error.config);
        } catch (refreshError) {
          removeAuthToken();
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
```

## 📚 Tài liệu tham khảo

- [Axios Documentation](https://axios-http.com/docs/intro)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

**Lưu ý**: Đảm bảo cấu hình đúng biến môi trường trong file `.env` trước khi sử dụng.
