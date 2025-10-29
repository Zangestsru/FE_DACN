# ✅ Contexts Setup - Hoàn Thành

## 📋 Tổng quan

Đã hoàn tất việc tạo và cấu hình **React Contexts** cho global state management trong dự án Online Exam Website Interface.

## 📁 Cấu trúc đã tạo

```
src/contexts/
├── AuthContext.tsx       ✅ Authentication state management
├── ExamContext.tsx       ✅ Exam session state management
├── index.ts              ✅ Export tất cả contexts
└── README.md             ✅ Documentation đầy đủ
```

## 🎯 Contexts đã tạo

### 1. **Auth Context** (`AuthContext.tsx`)

Global authentication state management.

**Features:**

- ✅ User state management
- ✅ Token management
- ✅ Login/Register/Logout functions
- ✅ Persist state trong localStorage
- ✅ Auto load state on mount
- ✅ Update user info
- ✅ Refresh user function
- ✅ Loading state

**State:**

```typescript
interface IAuthContext {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: IRegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<IUser>) => void;
  refreshUser: () => void;
}
```

**Usage:**

```typescript
const { user, isAuthenticated, login, logout } = useAuthContext();

// Login
await login("user@example.com", "password");

// Logout
await logout();

// Update user
updateUser({ fullName: "New Name" });
```

---

### 2. **Exam Context** (`ExamContext.tsx`)

Global exam session state management với timer.

**Features:**

- ✅ Current exam state
- ✅ Exam questions management
- ✅ Session tracking
- ✅ Timer management (auto countdown)
- ✅ Answer tracking
- ✅ Question navigation
- ✅ Persist session trong sessionStorage
- ✅ Pause/Resume timer
- ✅ Time spent calculation

**State:**

```typescript
interface IExamContext {
  currentExam: IExam | null;
  questions: IQuestion[] | null;
  session: IExamSession | null;
  isTimerRunning: boolean;
  remainingTime: number;
  startExam: (exam, questions, sessionId) => void;
  endExam: () => void;
  answerQuestion: (questionId, answerIndex) => void;
  goToQuestion: (index) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  getTimeSpent: () => number;
}
```

**Usage:**

```typescript
const { currentExam, remainingTime, startExam, answerQuestion, endExam } =
  useExamContext();

// Start exam
startExam(exam, questions, "session-123");

// Answer question
answerQuestion(1, 0); // Question 1, Answer A

// End exam
endExam();
```

---

## ✨ Features

### ✅ Type Safety

- Full TypeScript support
- Exported types cho reuse
- Type-safe context hooks

### ✅ State Persistence

- **Auth**: localStorage (token, user info)
- **Exam**: sessionStorage (session, answers, timer)
- Auto load on mount
- Auto save on change

### ✅ Custom Hooks

- `useAuthContext()` - Auth state hook
- `useExamContext()` - Exam state hook
- Error nếu dùng ngoài Provider

### ✅ Loading States

- Initial loading state cho Auth
- Prevent flash of unauthenticated content

### ✅ Error Handling

- Try-catch trong tất cả async functions
- Clear invalid data from storage
- Console logging cho debugging

### ✅ Timer Management

- Auto countdown timer
- Pause/Resume functionality
- Time's up handling
- Time spent calculation

### ✅ Cleanup

- Auto cleanup on unmount
- Clear storage on logout/endExam
- Clear intervals on unmount

---

## 🚀 App Integration

### Updated `src/App.tsx`

```typescript
import { AuthProvider, ExamProvider } from "./contexts";

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <AppContent />
      </ExamProvider>
    </AuthProvider>
  );
}
```

**Context Hierarchy:**

```
App
└── AuthProvider (outermost)
    └── ExamProvider
        └── AppContent
            └── Components
```

---

## 🎯 Cách sử dụng

### 1. Authentication Example

```typescript
import { useAuthContext } from "@/contexts";

const LoginPage = () => {
  const { login, loading } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      showError("Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        Login
      </button>
    </form>
  );
};
```

### 2. Protected Route Example

```typescript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
};
```

### 3. Exam Taking Example

```typescript
const ExamTakingPage = () => {
  const {
    currentExam,
    questions,
    remainingTime,
    answerQuestion,
    endExam,
    getTimeSpent,
  } = useExamContext();

  const handleSubmit = async () => {
    const timeSpent = getTimeSpent();
    const answers = session?.answers || {};

    await submitExam(currentExam?.id, { answers, timeSpent });
    endExam();
    navigate("/result");
  };

  return (
    <div>
      <h1>{currentExam?.title}</h1>
      <Timer time={remainingTime} />

      {questions?.map((q) => (
        <Question
          key={q.id}
          question={q}
          onAnswer={(answerIndex) => answerQuestion(q.id, answerIndex)}
        />
      ))}

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```

### 4. User Profile Example

```typescript
const ProfilePage = () => {
  const { user, updateUser } = useAuthContext();

  const handleUpdate = () => {
    updateUser({
      fullName: "New Name",
      phone: "0987654321",
    });
  };

  return (
    <div>
      <p>Name: {user?.fullName}</p>
      <p>Email: {user?.email}</p>
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
};
```

---

## 📊 State Persistence

### Auth State (localStorage)

**Keys:**

- `access_token` - JWT access token
- `refresh_token` - JWT refresh token
- `user_info` - User object (JSON)

**Lifecycle:**

- ✅ Auto loaded on app mount
- ✅ Auto saved on login/register
- ✅ Auto cleared on logout

### Exam Session (sessionStorage)

**Keys:**

- `exam_session` - Session object (JSON)

**Content:**

```typescript
{
  sessionId: string;
  examId: string | number;
  startTime: string;
  remainingTime: number;
  answers: Record<number, number>;
  currentQuestion: number;
}
```

**Lifecycle:**

- ✅ Auto loaded on mount
- ✅ Auto saved on state change
- ✅ Auto cleared on endExam()

---

## 🎯 Best Practices

### 1. Luôn wrap App với Providers

```typescript
// ✅ Good
<AuthProvider>
  <ExamProvider>
    <App />
  </ExamProvider>
</AuthProvider>

// ❌ Bad
<App /> // Missing providers
```

### 2. Sử dụng custom hooks

```typescript
// ✅ Good
const { user } = useAuthContext();

// ❌ Bad
const context = useContext(AuthContext);
```

### 3. Handle loading states

```typescript
const { user, loading } = useAuthContext();

if (loading) return <Spinner />;
return <div>Welcome, {user?.fullName}</div>;
```

### 4. Error handling

```typescript
try {
  await login(email, password);
} catch (error) {
  showError("Login failed");
}
```

---

## 🔍 Kiểm tra

### ✅ Linter Status

```
No linter errors found.
```

### ✅ Files Created

- ✅ AuthContext.tsx (5.2 KB) - Auth state management
- ✅ ExamContext.tsx (6.8 KB) - Exam session management
- ✅ index.ts (0.5 KB) - Export all contexts
- ✅ README.md (10.5 KB) - Full documentation

### ✅ App.tsx Updated

- ✅ Imported AuthProvider và ExamProvider
- ✅ Wrapped AppContent với providers
- ✅ Correct provider hierarchy

---

## 📚 Documentation

Chi tiết đầy đủ xem tại: `src/contexts/README.md`

**Nội dung:**

- Cách sử dụng từng context
- API reference
- Examples
- Best practices
- Protected routes
- State persistence
- TypeScript support
- Debugging tips

---

## 🎉 Kết luận

Contexts layer đã được setup hoàn chỉnh với:

- ✅ 2 contexts (Auth, Exam)
- ✅ 2 custom hooks (useAuthContext, useExamContext)
- ✅ Full TypeScript support
- ✅ State persistence (localStorage + sessionStorage)
- ✅ Loading states
- ✅ Error handling
- ✅ Timer management
- ✅ Clean code structure
- ✅ Documentation đầy đủ
- ✅ App integration complete
- ✅ Ready to use!

**Benefits:**

- 🎯 Global state management
- 💾 Persistent authentication
- ⏱️ Exam timer management
- 🔒 Protected routes support
- 🧹 Auto cleanup
- 📝 Well documented
- 💪 Type-safe

**Bạn có thể bắt đầu sử dụng contexts ngay trong components để quản lý global state!**

---

**Created:** October 10, 2025  
**Status:** ✅ Complete  
**Version:** 1.0.0
