# Custom Hooks Documentation

Thư mục này chứa tất cả custom React hooks cho data fetching và state management.

## 📁 Cấu trúc

```
src/hooks/
├── useApi.ts          # Generic API hook với cache và retry
├── useAuth.ts         # Authentication hooks
├── useExams.ts        # Exam management hooks
├── useCourses.ts      # Course management hooks
├── index.ts           # Export tất cả hooks
└── README.md          # Documentation
```

## 🚀 Cách sử dụng

### Import Hooks

```typescript
// Import từng hook
import { useAuth, useExams, useCourses } from "@/hooks";

// Hoặc import specific hooks
import { useLogin, useExamDetail } from "@/hooks";
```

## 📚 Hooks

### 1. Generic API Hooks (`useApi.ts`)

#### `useApi<T>(serviceFunction, options)`

Generic hook để xử lý API calls với loading, error, và data states.

**Features:**

- ✅ Auto loading state
- ✅ Error handling
- ✅ Retry logic
- ✅ Cache support
- ✅ Refetch function
- ✅ TypeScript support

**Example:**

```typescript
import { useApi } from "@/hooks";
import { examService } from "@/services";

const ExamList = () => {
  const { data, loading, error, refetch } = useApi(examService.getAllExams, {
    immediate: true,
    cacheKey: "exams",
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retryCount: 3,
    onSuccess: (data) => console.log("Success:", data),
    onError: (error) => console.error("Error:", error),
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map((exam) => (
        <div key={exam.id}>{exam.title}</div>
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
};
```

#### `useMutation<T>(mutationFunction, options)`

Hook cho POST, PUT, DELETE operations.

**Example:**

```typescript
import { useMutation } from "@/hooks";
import { examService } from "@/services";

const ExamRegister = ({ examId }) => {
  const { mutate, loading, error } = useMutation(examService.registerExam, {
    onSuccess: () => alert("Registered!"),
    onError: (error) => alert(error.message),
  });

  return (
    <button onClick={() => mutate(examId)} disabled={loading}>
      {loading ? "Registering..." : "Register"}
    </button>
  );
};
```

---

### 2. Authentication Hooks (`useAuth.ts`)

#### `useAuth()`

Main authentication hook với full auth state và functions.

**Returns:**

- `user` - User hiện tại
- `isAuthenticated` - Đã đăng nhập chưa
- `loading` - Loading state
- `login(email, password)` - Login function
- `register(data)` - Register function
- `logout()` - Logout function
- `refreshUser()` - Refresh user info
- `loginLoading` - Login loading state
- `loginError` - Login error
- `registerLoading` - Register loading state
- `registerError` - Register error

**Example:**

```typescript
import { useAuth } from "@/hooks";

const App = () => {
  const { user, isAuthenticated, login, logout, loginLoading } = useAuth();

  const handleLogin = async () => {
    await login("user@example.com", "password");
  };

  if (!isAuthenticated) {
    return (
      <button onClick={handleLogin} disabled={loginLoading}>
        {loginLoading ? "Logging in..." : "Login"}
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user?.fullName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

#### `useLogin(options)`

Simplified login hook.

```typescript
const {
  mutate: login,
  loading,
  error,
} = useLogin({
  onSuccess: (data) => navigate("/dashboard"),
  onError: (error) => showToast(error.message),
});

await login("user@example.com", "password");
```

#### `useRegister(options)`

Simplified register hook.

```typescript
const { mutate: register, loading } = useRegister({
  onSuccess: () => navigate("/login"),
});

await register({
  username: "newuser",
  email: "new@example.com",
  password: "password123",
  fullName: "Nguyễn Văn A",
});
```

#### `useLogout(options)`

Logout hook.

```typescript
const { logout, loading } = useLogout({
  onSuccess: () => navigate("/login"),
});

await logout();
```

---

### 3. Exam Hooks (`useExams.ts`)

#### `useExams(params?, immediate?)`

Fetch danh sách exams với pagination và filter.

```typescript
const { data, loading, error, refetch } = useExams({
  page: 1,
  limit: 12,
  category: "Cloud Computing",
});
```

#### `useExamDetail(examId, immediate?)`

Fetch chi tiết một exam.

```typescript
const { data: exam, loading } = useExamDetail(examId);
```

#### `useExamRegister(options)`

Đăng ký thi.

```typescript
const { mutate: registerExam, loading } = useExamRegister({
  onSuccess: () => navigate("/exam-taking"),
});

await registerExam(examId);
```

#### `useExamStart(options)`

Bắt đầu làm bài thi.

```typescript
const { mutate: startExam, data: session } = useExamStart({
  onSuccess: (session) => console.log("Session:", session.sessionId),
});

await startExam(examId);
```

#### `useExamSubmit(options)`

Nộp bài thi.

```typescript
const {
  mutate: submitExam,
  loading,
  data: result,
} = useExamSubmit({
  onSuccess: (result) => {
    if (result.result.passed) {
      showToast("Chúc mừng! Bạn đã đạt!");
    }
    navigate("/exam-result");
  },
});

await submitExam(examId, {
  answers: { 1: 0, 2: 2, 3: 1 },
  timeSpent: 3600,
});
```

#### Other Exam Hooks:

- `useExamQuestions(examId)` - Lấy câu hỏi
- `useExamResult(examId, userId?)` - Lấy kết quả
- `useMyExamResults()` - Lấy danh sách kết quả của user
- `useExamSearch(query?)` - Tìm kiếm exams
- `useExamsByCategory(category)` - Lọc theo category
- `useRelatedExams(examId)` - Lấy exams liên quan

---

### 4. Course Hooks (`useCourses.ts`)

#### `useCourses(params?, immediate?)`

Fetch danh sách courses.

```typescript
const { data, loading, refetch } = useCourses({
  page: 1,
  limit: 9,
  category: "programming",
});
```

#### `useCourseDetail(courseId, immediate?)`

Fetch chi tiết course.

```typescript
const { data: course, loading } = useCourseDetail(courseId);
```

#### `useCourseEnroll(options)`

Đăng ký course.

```typescript
const { mutate: enrollCourse, loading } = useCourseEnroll({
  onSuccess: () => navigate("/my-courses"),
});

await enrollCourse(courseId);
```

#### `useCourseProgress(courseId)`

Lấy tiến độ học tập.

```typescript
const { data: progress, loading, refetch } = useCourseProgress(courseId);

console.log(`Progress: ${progress?.progressPercentage}%`);
```

#### `useCompleteLesson(options)`

Đánh dấu bài học hoàn thành.

```typescript
const { mutate: completeLesson, loading } = useCompleteLesson({
  onSuccess: () => {
    showToast("Đã hoàn thành bài học!");
    refetchProgress();
  },
});

await completeLesson(courseId, lessonId);
```

#### Other Course Hooks:

- `useCourseUnenroll(options)` - Hủy đăng ký
- `useMyCourses()` - Courses đã đăng ký
- `useUpdateCourseProgress(options)` - Cập nhật tiến độ
- `useCourseLessons(courseId)` - Danh sách bài học
- `useLessonDetail(courseId, lessonId)` - Chi tiết bài học
- `useCourseReviews(courseId)` - Đánh giá course
- `useAddCourseReview(options)` - Thêm đánh giá
- `useCourseSearch(query?)` - Tìm kiếm courses
- `useCoursesByCategory(category)` - Lọc theo category
- `useRelatedCourses(courseId)` - Courses liên quan
- `useLessonNotes(lessonId)` - Ghi chú bài học
- `useAddLessonNote(options)` - Thêm ghi chú

---

## 🎯 Best Practices

### 1. Luôn handle loading và error states

```typescript
const { data, loading, error } = useExams();

if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <ExamList exams={data.data} />;
```

### 2. Sử dụng immediate flag

```typescript
// Auto fetch khi mount
const { data } = useExamDetail(examId, true);

// Không auto fetch, gọi manual
const { data, refetch } = useExamDetail(examId, false);

// Fetch khi cần
useEffect(() => {
  if (shouldFetch) {
    refetch(examId);
  }
}, [shouldFetch]);
```

### 3. Sử dụng cache để tối ưu performance

```typescript
// Hook tự động cache với key
const { data } = useExams({ page: 1 }); // Cache key: "exams-{...}"

// Data được cache trong 5 phút
// Lần fetch tiếp theo sẽ dùng cached data
```

### 4. Cleanup với dependencies

```typescript
useEffect(() => {
  let cancelled = false;

  const fetchData = async () => {
    const result = await refetch();
    if (!cancelled) {
      // Use result
    }
  };

  fetchData();

  return () => {
    cancelled = true;
  };
}, [refetch]);
```

### 5. Combine multiple hooks

```typescript
const ExamPage = ({ examId }) => {
  const { data: exam, loading: examLoading } = useExamDetail(examId);
  const { data: questions, loading: questionsLoading } =
    useExamQuestions(examId);
  const { mutate: submitExam, loading: submitting } = useExamSubmit();

  const loading = examLoading || questionsLoading;

  if (loading) return <Spinner />;

  return (
    <div>
      <h1>{exam?.title}</h1>
      <QuestionList questions={questions} />
      <button onClick={() => submitExam(examId, answers)} disabled={submitting}>
        Submit
      </button>
    </div>
  );
};
```

---

## ⚡ Performance Tips

### 1. Cache Strategy

Hooks tự động cache data với key dựa trên params:

```typescript
// Cache 5 phút
useExams({ page: 1 }); // Key: "exams-{page:1}"

// Cache 10 phút
useExamDetail(1); // Key: "exam-1"
```

### 2. Conditional Fetching

Chỉ fetch khi cần:

```typescript
const { data } = useExamDetail(
  examId,
  !!examId // Chỉ fetch khi có examId
);
```

### 3. Manual Refetch

```typescript
const { data, refetch } = useExams({}, false);

// Refetch khi user click
<button onClick={() => refetch()}>Refresh</button>;
```

### 4. Retry Logic

```typescript
const { data } = useApi(examService.getAllExams, {
  retryCount: 3,
  retryDelay: 1000,
});
```

---

## 🔍 Debugging

### Enable Debug Logs

Trong development mode, hooks tự động log:

```
🚀 Fetching: exams
✅ Success: exams
❌ Error: exams - Network error
🔄 Retrying... (1/3)
```

### Check Cache

```typescript
// Cache được lưu trong memory
// Xem trong useApi.ts -> cache Map
```

### Monitor Loading States

```typescript
const { loading } = useExams();

useEffect(() => {
  console.log("Loading:", loading);
}, [loading]);
```

---

## 📝 TypeScript Support

Tất cả hooks đều có full TypeScript support:

```typescript
import type { IExam, IGetExamsResponse } from "@/types";

// Type inference tự động
const { data } = useExams(); // data: IGetExamsResponse | null

// Explicit types
const { data: exam } = useExamDetail<IExam>(examId);
```

---

## 🚀 Examples

### Complete Exam Flow

```typescript
const ExamFlow = () => {
  const [examId, setExamId] = useState<number | null>(null);

  // 1. Fetch exams list
  const { data: exams, loading: examsLoading } = useExams();

  // 2. Fetch exam detail
  const { data: exam, loading: examLoading } = useExamDetail(examId);

  // 3. Register exam
  const { mutate: registerExam } = useExamRegister({
    onSuccess: () => startExam(examId!),
  });

  // 4. Start exam
  const { mutate: startExam } = useExamStart({
    onSuccess: (session) => console.log("Session:", session),
  });

  // 5. Submit exam
  const { mutate: submitExam } = useExamSubmit({
    onSuccess: (result) => navigate("/result"),
  });

  return (
    <div>
      {/* Exam list */}
      {examsLoading && <Spinner />}
      {exams?.data.map((e) => (
        <div key={e.id} onClick={() => setExamId(e.id)}>
          {e.title}
        </div>
      ))}

      {/* Exam detail */}
      {examLoading && <Spinner />}
      {exam && (
        <div>
          <h1>{exam.title}</h1>
          <button onClick={() => registerExam(examId!)}>Register</button>
        </div>
      )}
    </div>
  );
};
```

### Complete Course Flow

```typescript
const CourseFlow = ({ courseId }) => {
  // 1. Fetch course detail
  const { data: course } = useCourseDetail(courseId);

  // 2. Enroll course
  const { mutate: enrollCourse } = useCourseEnroll({
    onSuccess: () => refetchProgress(),
  });

  // 3. Get progress
  const { data: progress, refetch: refetchProgress } =
    useCourseProgress(courseId);

  // 4. Get lessons
  const { data: lessons } = useCourseLessons(courseId);

  // 5. Complete lesson
  const { mutate: completeLesson } = useCompleteLesson({
    onSuccess: () => refetchProgress(),
  });

  return (
    <div>
      <h1>{course?.title}</h1>
      <p>Progress: {progress?.progressPercentage}%</p>

      <button onClick={() => enrollCourse(courseId)}>Enroll</button>

      {lessons?.map((lesson) => (
        <div key={lesson.id}>
          <h3>{lesson.title}</h3>
          <button onClick={() => completeLesson(courseId, lesson.id)}>
            Complete
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## 📚 Tài liệu tham khảo

- [React Hooks](https://react.dev/reference/react)
- [React Query](https://tanstack.com/query/latest) (inspiration)
- [SWR](https://swr.vercel.app/) (inspiration)

---

**Lưu ý**: Tất cả hooks hiện đang sử dụng mock data từ services. Khi backend API sẵn sàng, chỉ cần update services và hooks sẽ tự động hoạt động với real API.
