# Constants Documentation

Thư mục này chứa tất cả các constants được sử dụng trong ứng dụng.

## 📁 Files

### endpoints.ts

Định nghĩa tất cả API endpoints.

### index.ts

Export tất cả constants và app settings.

## 🌐 API Endpoints

### Cấu trúc

Endpoints được group theo module:

```typescript
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  // ...
};

export const EXAM_ENDPOINTS = {
  LIST: "/exams",
  GET_BY_ID: (id) => `/exams/${id}`,
  // ...
};
```

### Sử dụng

```typescript
import { AUTH_ENDPOINTS, EXAM_ENDPOINTS } from "@/constants/endpoints";
import apiClient from "@/config/api.config";

// Login
await apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials);

// Get exam by ID
await apiClient.get(EXAM_ENDPOINTS.GET_BY_ID(123));
```

### Danh sách Endpoint Groups

- `AUTH_ENDPOINTS` - Authentication & Authorization
- `USER_ENDPOINTS` - User Management
- `EXAM_ENDPOINTS` - Exam Management
- `CERTIFICATION_ENDPOINTS` - Certification Management
- `COURSE_ENDPOINTS` - Course Management
- `LESSON_ENDPOINTS` - Lesson Management
- `PAYMENT_ENDPOINTS` - Payment Processing
- `NOTIFICATION_ENDPOINTS` - Notifications
- `UPLOAD_ENDPOINTS` - File Uploads
- `STATISTICS_ENDPOINTS` - Statistics & Analytics
- `ADMIN_ENDPOINTS` - Admin Management

## ⚙️ App Settings

### PAGINATION

Cấu hình phân trang:

```typescript
import { PAGINATION } from "@/constants";

const pageSize = PAGINATION.DEFAULT_PAGE_SIZE; // 10
const examPageSize = PAGINATION.EXAM_PAGE_SIZE; // 12
```

### TIMEOUT

Cấu hình timeout:

```typescript
import { TIMEOUT } from "@/constants";

const requestTimeout = TIMEOUT.DEFAULT; // 30000ms
const searchDebounce = TIMEOUT.SEARCH_DEBOUNCE; // 500ms
```

### STORAGE_KEYS

Keys cho localStorage:

```typescript
import { STORAGE_KEYS } from "@/constants";

localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
const theme = localStorage.getItem(STORAGE_KEYS.THEME);
```

### SESSION_KEYS

Keys cho sessionStorage:

```typescript
import { SESSION_KEYS } from "@/constants";

sessionStorage.setItem(SESSION_KEYS.EXAM_SESSION, data);
```

### FILE_UPLOAD

Cấu hình upload files:

```typescript
import { FILE_UPLOAD } from "@/constants";

const maxSize = FILE_UPLOAD.MAX_SIZE.AVATAR; // 5MB
const allowedTypes = FILE_UPLOAD.ALLOWED_TYPES.IMAGE;
```

### VALIDATION

Rules cho validation:

```typescript
import { VALIDATION } from "@/constants";

const minLength = VALIDATION.PASSWORD_MIN_LENGTH; // 6
const emailPattern = VALIDATION.EMAIL_PATTERN;
```

### DATE_FORMAT

Formats cho date/time:

```typescript
import { DATE_FORMAT } from "@/constants";

const displayFormat = DATE_FORMAT.DISPLAY_DATE; // DD/MM/YYYY
const apiFormat = DATE_FORMAT.API_DATE; // YYYY-MM-DD
```

### STATUS

Status constants:

```typescript
import { STATUS } from "@/constants";

if (exam.status === STATUS.EXAM_IN_PROGRESS) {
  // Handle in-progress exam
}
```

### USER_ROLES

User role constants:

```typescript
import { USER_ROLES } from "@/constants";

if (user.role === USER_ROLES.ADMIN) {
  // Show admin features
}
```

### DIFFICULTY_LEVELS

Exam difficulty levels:

```typescript
import { DIFFICULTY_LEVELS } from "@/constants";

const level = DIFFICULTY_LEVELS.INTERMEDIATE;
```

### COURSE_LEVELS

Course levels:

```typescript
import { COURSE_LEVELS } from "@/constants";

const level = COURSE_LEVELS.BEGINNER;
```

### PAYMENT_METHODS

Payment method constants:

```typescript
import { PAYMENT_METHODS } from "@/constants";

const method = PAYMENT_METHODS.MOMO;
```

### NOTIFICATION_TYPES

Notification type constants:

```typescript
import { NOTIFICATION_TYPES } from "@/constants";

showNotification({
  type: NOTIFICATION_TYPES.SUCCESS,
  message: "Success!",
});
```

### ERROR_MESSAGES

Predefined error messages:

```typescript
import { ERROR_MESSAGES } from "@/constants";

console.error(ERROR_MESSAGES.NETWORK_ERROR);
```

### SUCCESS_MESSAGES

Predefined success messages:

```typescript
import { SUCCESS_MESSAGES } from "@/constants";

showToast(SUCCESS_MESSAGES.LOGIN_SUCCESS);
```

### REGEX_PATTERNS

Common regex patterns:

```typescript
import { REGEX_PATTERNS } from "@/constants";

const isValidEmail = REGEX_PATTERNS.EMAIL.test(email);
```

## 📝 Quy tắc đặt tên

### Constants

- Sử dụng **UPPERCASE** với underscore
- VD: `DEFAULT_PAGE_SIZE`, `MAX_FILE_SIZE`

### Endpoint Groups

- Kết thúc bằng `_ENDPOINTS`
- VD: `AUTH_ENDPOINTS`, `EXAM_ENDPOINTS`

### Object Constants

- Sử dụng **UPPERCASE** cho object name
- Properties có thể PascalCase hoặc UPPERCASE
- VD: `PAGINATION.DEFAULT_PAGE_SIZE`

## 💡 Best Practices

### 1. Sử dụng constants thay vì magic numbers/strings

❌ Bad:

```typescript
if (status === "active") {
}
const pageSize = 10;
```

✅ Good:

```typescript
import { STATUS, PAGINATION } from "@/constants";

if (status === STATUS.ACTIVE) {
}
const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
```

### 2. Group related constants

```typescript
export const EXAM_CONFIG = {
  MIN_QUESTIONS: 10,
  MAX_QUESTIONS: 100,
  DEFAULT_DURATION: 60,
} as const;
```

### 3. Sử dụng `as const` cho type safety

```typescript
export const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

// Type: 'active' | 'inactive'
type Status = (typeof STATUS)[keyof typeof STATUS];
```

### 4. Export từ index.ts

```typescript
// endpoints.ts
export const AUTH_ENDPOINTS = { ... };

// index.ts
export * from './endpoints';
export { AUTH_ENDPOINTS } from './endpoints';
```

## 🔄 Cập nhật Constants

### Khi thêm constant mới:

1. Thêm vào file tương ứng
2. Export từ file đó
3. Re-export từ `index.ts` nếu cần
4. Thêm comment giải thích
5. Update README này

### Khi sửa constant:

1. Tìm tất cả nơi sử dụng
2. Cập nhật giá trị
3. Test lại các chức năng liên quan
4. Update documentation

## 📊 Categories

### Exam Categories

```typescript
import { CATEGORIES } from "@/constants";

const category = CATEGORIES.EXAM.CLOUD_COMPUTING;
```

### Course Categories

```typescript
import { CATEGORIES } from "@/constants";

const category = CATEGORIES.COURSE.PROGRAMMING;
```

## 🎨 Theme & UI

### Theme Modes

```typescript
import { THEME_MODES } from "@/constants";

const theme = THEME_MODES.DARK;
```

### Toast Positions

```typescript
import { TOAST_POSITIONS } from "@/constants";

showToast({
  position: TOAST_POSITIONS.TOP_RIGHT,
});
```

## 🌍 Internationalization

### Languages

```typescript
import { LANGUAGES } from "@/constants";

const currentLang = LANGUAGES.VIETNAMESE;
```

## 📱 Social Media

### Social Links

```typescript
import { SOCIAL_LINKS } from "@/constants";

const facebookUrl = SOCIAL_LINKS.FACEBOOK;
```

### Contact Info

```typescript
import { CONTACT_INFO } from "@/constants";

const supportEmail = CONTACT_INFO.EMAIL;
```

## 📦 App Metadata

```typescript
import { APP_METADATA } from "@/constants";

console.log(APP_METADATA.NAME); // "Online Exam Website"
console.log(APP_METADATA.VERSION); // "1.0.0"
```

## 🔍 Tìm kiếm Constants

### Theo chức năng:

- **Authentication**: `AUTH_ENDPOINTS`, `STORAGE_KEYS.ACCESS_TOKEN`
- **Pagination**: `PAGINATION.*`
- **Validation**: `VALIDATION.*`, `REGEX_PATTERNS.*`
- **Messages**: `ERROR_MESSAGES.*`, `SUCCESS_MESSAGES.*`
- **Status**: `STATUS.*`
- **Roles**: `USER_ROLES.*`

### Theo loại:

- **Endpoints**: `*_ENDPOINTS`
- **Settings**: `PAGINATION`, `TIMEOUT`, `FILE_UPLOAD`
- **Keys**: `STORAGE_KEYS`, `SESSION_KEYS`
- **Messages**: `ERROR_MESSAGES`, `SUCCESS_MESSAGES`
- **Patterns**: `REGEX_PATTERNS`, `DATE_FORMAT`

## 🚀 Ví dụ sử dụng

### Complete Example

```typescript
import {
  AUTH_ENDPOINTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION,
} from "@/constants";
import apiClient from "@/config/api.config";

const login = async (email: string, password: string) => {
  // Validate
  if (!VALIDATION.EMAIL_PATTERN.test(email)) {
    throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
  }

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    throw new Error(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
  }

  try {
    // Call API
    const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, {
      email,
      password,
    });

    // Save token
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.token);

    // Show success
    showToast(SUCCESS_MESSAGES.LOGIN_SUCCESS);
  } catch (error) {
    showToast(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }
};
```

## 📚 Tài liệu tham khảo

- [TypeScript const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [JavaScript naming conventions](https://www.robinwieruch.de/javascript-naming-conventions/)

---

**Lưu ý**: Luôn sử dụng constants thay vì hardcode values để code dễ maintain và scale.
