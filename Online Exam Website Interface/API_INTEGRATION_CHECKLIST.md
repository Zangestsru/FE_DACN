# ✅ API Integration Checklist

Checklist chi tiết để integrate API thật vào project.

---

## 📋 Pre-Integration

### Backend Preparation

- [ ] Backend API đã deploy và accessible
- [ ] API documentation đã có (Swagger/Postman)
- [ ] Test tất cả endpoints với Postman/Insomnia
- [ ] Có API credentials (API keys, tokens)
- [ ] Biết authentication method (JWT, OAuth, etc.)
- [ ] Biết response format của API
- [ ] Biết error codes và messages

### Frontend Preparation

- [ ] Đọc `src/docs/API_INTEGRATION_GUIDE.md`
- [ ] Hiểu cấu trúc services layer
- [ ] Hiểu cách hooks hoạt động
- [ ] Backup code hiện tại (git commit)

---

## ⚙️ Configuration

### Environment Variables

- [ ] Tạo file `.env` ở root project

  ```env
  VITE_API_BASE_URL=https://api.yourdomain.com
  VITE_API_VERSION=v1
  VITE_API_TIMEOUT=30000
  ```

- [ ] Tạo file `.env.development`

  ```env
  VITE_API_BASE_URL=http://localhost:3000
  ```

- [ ] Tạo file `.env.production`

  ```env
  VITE_API_BASE_URL=https://api.yourdomain.com
  ```

- [ ] Add `.env*` vào `.gitignore`

### API Configuration

- [ ] Verify `src/config/api.config.ts`
- [ ] Check `API_BASE_URL` đang load từ env
- [ ] Check `REQUEST_TIMEOUT` hợp lý
- [ ] Verify axios instance setup

### Endpoints

- [ ] Review `src/constants/endpoints.ts`
- [ ] Update endpoints nếu khác với backend
- [ ] Verify endpoint paths
- [ ] Check HTTP methods (GET, POST, PUT, DELETE)

---

## 🔄 Update Services

### Auth Service (`src/services/auth.service.ts`)

- [ ] **login()**

  - [ ] Remove mock data
  - [ ] Add `apiClient.post(endpoints.AUTH.LOGIN, credentials)`
  - [ ] Save tokens to localStorage
  - [ ] Set token in axios instance
  - [ ] Test login flow

- [ ] **register()**

  - [ ] Remove mock data
  - [ ] Add `apiClient.post(endpoints.AUTH.REGISTER, data)`
  - [ ] Handle response
  - [ ] Test register flow

- [ ] **logout()**

  - [ ] Add `apiClient.post(endpoints.AUTH.LOGOUT)`
  - [ ] Clear localStorage
  - [ ] Remove token from axios
  - [ ] Test logout flow

- [ ] **refreshToken()**

  - [ ] Add `apiClient.post(endpoints.AUTH.REFRESH, { refreshToken })`
  - [ ] Update tokens
  - [ ] Test token refresh

- [ ] **forgotPassword()**

  - [ ] Add API call
  - [ ] Test flow

- [ ] **verifyOTP()**
  - [ ] Add API call
  - [ ] Test flow

### Exam Service (`src/services/exam.service.ts`)

- [ ] **getAllExams()**

  - [ ] Remove mock data
  - [ ] Add `apiClient.get(endpoints.EXAM.GET_ALL, { params })`
  - [ ] Test pagination
  - [ ] Test filters (category, level)
  - [ ] Test search

- [ ] **getExamById()**

  - [ ] Remove mock data
  - [ ] Add `apiClient.get(endpoints.EXAM.GET_BY_ID(id))`
  - [ ] Test với valid ID
  - [ ] Test với invalid ID (404)

- [ ] **registerExam()**

  - [ ] Add `apiClient.post(endpoints.EXAM.REGISTER(id))`
  - [ ] Test registration
  - [ ] Handle payment flow

- [ ] **startExam()**

  - [ ] Add API call
  - [ ] Test exam start

- [ ] **getExamQuestions()**

  - [ ] Add API call
  - [ ] Test questions loading

- [ ] **submitExam()**

  - [ ] Add `apiClient.post(endpoints.EXAM.SUBMIT(id), { answers })`
  - [ ] Test submission
  - [ ] Handle result

- [ ] **getExamResult()**
  - [ ] Add API call
  - [ ] Test result retrieval

### User Service (`src/services/user.service.ts`)

- [ ] **getUserProfile()**

  - [ ] Remove mock data
  - [ ] Add `apiClient.get(endpoints.USER.PROFILE)`
  - [ ] Test profile loading

- [ ] **updateProfile()**

  - [ ] Add `apiClient.put(endpoints.USER.UPDATE_PROFILE, data)`
  - [ ] Test profile update

- [ ] **changePassword()**

  - [ ] Add API call
  - [ ] Test password change

- [ ] **updateAvatar()**
  - [ ] Add API call (multipart/form-data)
  - [ ] Test file upload

### Course Service (`src/services/course.service.ts`)

- [ ] **getAllCourses()**

  - [ ] Remove mock data
  - [ ] Add `apiClient.get(endpoints.COURSE.GET_ALL, { params })`
  - [ ] Test pagination
  - [ ] Test filters
  - [ ] Test search

- [ ] **getCourseById()**

  - [ ] Remove mock data
  - [ ] Add `apiClient.get(endpoints.COURSE.GET_BY_ID(id))`
  - [ ] Test course detail

- [ ] **enrollCourse()**

  - [ ] Add `apiClient.post(endpoints.COURSE.ENROLL(id))`
  - [ ] Test enrollment

- [ ] **getMyCourses()**

  - [ ] Add API call
  - [ ] Test my courses list

- [ ] **getCourseProgress()**
  - [ ] Add API call
  - [ ] Test progress tracking

### Payment Service (`src/services/payment.service.ts`)

- [ ] **createPayment()**

  - [ ] Add API call
  - [ ] Test payment creation

- [ ] **verifyPayment()**

  - [ ] Add API call
  - [ ] Test payment verification

- [ ] **getPaymentHistory()**
  - [ ] Add API call
  - [ ] Test payment history

---

## 🧪 Testing

### Unit Testing (Services)

- [ ] Test `authService.login()` với valid credentials
- [ ] Test `authService.login()` với invalid credentials
- [ ] Test `examService.getAllExams()` với pagination
- [ ] Test `examService.getExamById()` với valid ID
- [ ] Test `examService.getExamById()` với invalid ID
- [ ] Test error handling trong tất cả services

### Integration Testing (UI)

#### Login Flow

- [ ] Mở login page
- [ ] Nhập email/password đúng
- [ ] Click login button
- [ ] Verify loading state hiển thị
- [ ] Verify redirect sau khi login
- [ ] Verify token được save vào localStorage
- [ ] Test login với credentials sai
- [ ] Verify error message hiển thị

#### Exam List

- [ ] Mở exam list page
- [ ] Verify loading state
- [ ] Verify exams hiển thị
- [ ] Test pagination
- [ ] Test filters (category, level)
- [ ] Test search
- [ ] Test empty state (nếu không có exams)

#### Exam Detail

- [ ] Click vào một exam
- [ ] Verify loading state
- [ ] Verify exam detail hiển thị
- [ ] Test register button
- [ ] Test back button

#### Course List

- [ ] Mở course list page
- [ ] Verify courses hiển thị
- [ ] Test filters
- [ ] Test search
- [ ] Click vào course detail

#### Register Flow

- [ ] Mở register page
- [ ] Fill form
- [ ] Test validation (password match, length)
- [ ] Submit form
- [ ] Verify loading state
- [ ] Verify success/error message

### Error Cases

- [ ] Test 401 Unauthorized (expired token)
  - [ ] Verify auto logout hoặc token refresh
- [ ] Test 403 Forbidden (no permission)
  - [ ] Verify error message
- [ ] Test 404 Not Found
  - [ ] Verify error message
- [ ] Test 500 Server Error
  - [ ] Verify error message
- [ ] Test Network Error (offline)
  - [ ] Verify error message

### Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

### Network Tab Verification

- [ ] Request URL đúng
- [ ] Request method đúng (GET, POST, etc.)
- [ ] Request headers có Authorization token
- [ ] Request body đúng format
- [ ] Response status code đúng
- [ ] Response data đúng format

### Console Verification

- [ ] Không có errors
- [ ] Không có warnings
- [ ] Log messages hợp lý

---

## 🚨 Error Handling

### Axios Interceptors

- [ ] Request interceptor thêm token vào header
- [ ] Response interceptor handle errors
- [ ] Handle 401 - Auto refresh token hoặc logout
- [ ] Handle 403 - Show permission error
- [ ] Handle 404 - Show not found error
- [ ] Handle 500 - Show server error
- [ ] Handle network errors

### Component Level

- [ ] Tất cả components có error state
- [ ] Error messages user-friendly
- [ ] Có retry button khi cần
- [ ] Loading states rõ ràng

---

## 🔒 Security

- [ ] Tokens được save securely (httpOnly cookies hoặc localStorage)
- [ ] Sensitive data không log ra console
- [ ] API keys không commit vào git
- [ ] HTTPS cho production
- [ ] CORS configured đúng
- [ ] Input validation
- [ ] XSS protection
- [ ] CSRF protection

---

## 📊 Performance

- [ ] API response time < 2s
- [ ] Loading states không flicker
- [ ] Pagination hoạt động tốt
- [ ] Search/filter không lag
- [ ] Images optimized
- [ ] Bundle size reasonable

---

## 🚀 Deployment

### Staging

- [ ] Deploy to staging environment
- [ ] Update `.env.staging` với staging API URL
- [ ] Test toàn bộ flow trên staging
- [ ] Fix bugs nếu có
- [ ] Get approval từ team

### Production

- [ ] Update `.env.production` với production API URL
- [ ] Build production: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Deploy to production
- [ ] Smoke test trên production
- [ ] Monitor errors (Sentry, LogRocket)
- [ ] Monitor performance

---

## 📝 Documentation

- [ ] Update API_INTEGRATION_GUIDE.md nếu cần
- [ ] Document API endpoints đã sử dụng
- [ ] Document authentication flow
- [ ] Document error codes
- [ ] Update README.md
- [ ] Add inline comments cho complex logic

---

## ✅ Final Checklist

### Code Quality

- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code formatted (Prettier)
- [ ] No console.log in production
- [ ] No commented code
- [ ] All TODOs resolved

### Functionality

- [ ] All features working
- [ ] All pages accessible
- [ ] All forms submitting
- [ ] All validations working
- [ ] All error cases handled

### User Experience

- [ ] Loading states smooth
- [ ] Error messages clear
- [ ] Success feedback visible
- [ ] Navigation intuitive
- [ ] Mobile responsive

### Performance

- [ ] Page load < 3s
- [ ] API calls < 2s
- [ ] No memory leaks
- [ ] No infinite loops
- [ ] Images optimized

### Security

- [ ] Authentication working
- [ ] Authorization working
- [ ] Tokens secure
- [ ] No sensitive data exposed
- [ ] HTTPS enabled

---

## 🎉 Completion

Khi tất cả items đã checked:

- [ ] Merge code vào main branch
- [ ] Tag version (v1.0.0)
- [ ] Deploy to production
- [ ] Announce to team
- [ ] Celebrate! 🎊

---

**Created**: October 10, 2025  
**Last Updated**: October 10, 2025
