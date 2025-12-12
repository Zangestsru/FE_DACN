# Contexts Documentation

Thư mục này chứa tất cả React Contexts cho global state management.

## 📁 Cấu trúc

```
src/contexts/
├── AuthContext.tsx       # Authentication state management
├── ExamContext.tsx       # Exam session state management
├── index.ts              # Export tất cả contexts
└── README.md             # Documentation
```

## 🚀 Cách sử dụng

### Setup trong App

```typescript
import { AuthProvider, ExamProvider } from "@/contexts";

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <YourApp />
      </ExamProvider>
    </AuthProvider>
  );
}
```

## 📚 Contexts

### 1. Auth Context (`AuthContext.tsx`)

Global authentication state management.

#### Features:

- ✅ User state management
- ✅ Token management
- ✅ Login/Register/Logout functions
- ✅ Persist state trong localStorage
- ✅ Auto load state on mount
- ✅ Update user info

#### State:

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

#### Usage:

```typescript
import { useAuthContext } from "@/contexts";

const MyComponent = () => {
  const { user, isAuthenticated, login, logout, loading } = useAuthContext();

  // Show loading state
  if (loading) {
    return <Spinner />;
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <button onClick={() => login("user@example.com", "password")}>
        Login
      </button>
    );
  }

  // Show user info
  return (
    <div>
      <p>Welcome, {user?.fullName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

#### Login Example:

```typescript
const LoginPage = () => {
  const { login } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
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
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
};
```

#### Register Example:

```typescript
const RegisterPage = () => {
  const { register } = useAuthContext();

  const handleRegister = async (data: IRegisterRequest) => {
    try {
      await register(data);
      navigate("/dashboard");
    } catch (err) {
      showError("Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleRegister)}>{/* Form fields */}</form>
  );
};
```

#### Update User Example:

```typescript
const ProfilePage = () => {
  const { user, updateUser } = useAuthContext();

  const handleUpdateProfile = () => {
    updateUser({
      fullName: "New Name",
      phone: "0987654321",
    });
  };

  return (
    <div>
      <p>Name: {user?.fullName}</p>
      <button onClick={handleUpdateProfile}>Update</button>
    </div>
  );
};
```

---

### 2. Exam Context (`ExamContext.tsx`)

Global exam session state management với timer.

#### Features:

- ✅ Current exam state
- ✅ Exam questions management
- ✅ Session tracking
- ✅ Timer management (auto countdown)
- ✅ Answer tracking
- ✅ Question navigation
- ✅ Persist session trong sessionStorage
- ✅ Pause/Resume timer

#### State:

```typescript
interface IExamContext {
  currentExam: IExam | null;
  questions: IQuestion[] | null;
  session: IExamSession | null;
  isTimerRunning: boolean;
  remainingTime: number;
  startExam: (exam: IExam, questions: IQuestion[], sessionId: string) => void;
  endExam: () => void;
  answerQuestion: (questionId: number, answerIndex: number) => void;
  goToQuestion: (index: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  getTimeSpent: () => number;
}
```

#### Usage:

```typescript
import { useExamContext } from "@/contexts";

const ExamTakingPage = () => {
  const {
    currentExam,
    questions,
    session,
    remainingTime,
    isTimerRunning,
    startExam,
    endExam,
    answerQuestion,
    goToQuestion,
    pauseTimer,
    resumeTimer,
    getTimeSpent,
  } = useExamContext();

  // Start exam
  useEffect(() => {
    if (exam && examQuestions) {
      startExam(exam, examQuestions, "session-123");
    }
  }, [exam, examQuestions]);

  // Handle answer
  const handleAnswer = (questionId: number, answerIndex: number) => {
    answerQuestion(questionId, answerIndex);
  };

  // Submit exam
  const handleSubmit = async () => {
    const timeSpent = getTimeSpent();
    const answers = session?.answers || {};

    await submitExam(currentExam?.id, { answers, timeSpent });
    endExam();
  };

  return (
    <div>
      <h1>{currentExam?.title}</h1>

      {/* Timer */}
      <Timer time={remainingTime} />

      {/* Questions */}
      {questions?.map((q, index) => (
        <Question
          key={q.id}
          question={q}
          selected={session?.answers[q.id]}
          onAnswer={(answerIndex) => handleAnswer(q.id, answerIndex)}
        />
      ))}

      {/* Navigation */}
      <button onClick={() => goToQuestion(session.currentQuestion - 1)}>
        Previous
      </button>
      <button onClick={() => goToQuestion(session.currentQuestion + 1)}>
        Next
      </button>

      {/* Timer controls */}
      {isTimerRunning ? (
        <button onClick={pauseTimer}>Pause</button>
      ) : (
        <button onClick={resumeTimer}>Resume</button>
      )}

      {/* Submit */}
      <button onClick={handleSubmit}>Submit Exam</button>
    </div>
  );
};
```

#### Timer Display:

```typescript
const Timer = ({ time }: { time: number }) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return (
    <div className={time < 300 ? "text-danger" : ""}>
      {hours > 0 && `${hours}:`}
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
};
```

#### Question Navigation:

```typescript
const QuestionNav = () => {
  const { questions, session, goToQuestion } = useExamContext();

  return (
    <div className="question-nav">
      {questions?.map((q, index) => (
        <button
          key={q.id}
          onClick={() => goToQuestion(index)}
          className={`
            ${session?.currentQuestion === index ? "active" : ""}
            ${session?.answers[q.id] !== undefined ? "answered" : ""}
          `}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
};
```

---

## 🎯 Best Practices

### 1. Luôn wrap App với Providers

```typescript
// ✅ Good
function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <AppContent />
      </ExamProvider>
    </AuthProvider>
  );
}

// ❌ Bad - Missing providers
function App() {
  return <AppContent />;
}
```

### 2. Sử dụng hooks thay vì useContext trực tiếp

```typescript
// ✅ Good
const { user } = useAuthContext();

// ❌ Bad
const context = useContext(AuthContext);
```

### 3. Handle loading states

```typescript
const { user, loading } = useAuthContext();

if (loading) {
  return <Spinner />;
}

return <div>Welcome, {user?.fullName}</div>;
```

### 4. Error handling

```typescript
const { login } = useAuthContext();

try {
  await login(email, password);
} catch (error) {
  showError("Login failed");
}
```

### 5. Cleanup khi unmount

```typescript
useEffect(() => {
  const { endExam } = useExamContext();

  return () => {
    // Cleanup exam session when leaving page
    endExam();
  };
}, []);
```

---

## 🔒 Protected Routes Example

```typescript
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Usage
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>;
```

---

## 📊 State Persistence

### Auth State (localStorage)

Được persist tự động:

- `access_token`
- `refresh_token`
- `user_info`

```typescript
// Auto loaded on mount
// Auto saved on login/register
// Auto cleared on logout
```

### Exam Session (sessionStorage)

Được persist tự động:

- `exam_session` (session ID, exam ID, start time, answers, etc.)

```typescript
// Auto loaded on mount
// Auto saved on state change
// Auto cleared on endExam()
```

---

## 🔄 Context Hierarchy

```
App
└── AuthProvider (outermost)
    └── ExamProvider
        └── AppContent
            └── Your Components
```

**Lý do:**

- AuthProvider ở ngoài cùng vì authentication cần thiết cho toàn app
- ExamProvider bên trong vì exam session chỉ cần khi làm bài thi

---

## 🚀 Advanced Usage

### Combine với Custom Hooks

```typescript
const ExamPage = () => {
  // Context
  const { startExam, endExam } = useExamContext();

  // Custom hook
  const { data: exam } = useExamDetail(examId);
  const { data: questions } = useExamQuestions(examId);

  useEffect(() => {
    if (exam && questions) {
      startExam(exam, questions, "session-" + Date.now());
    }
  }, [exam, questions]);

  return <ExamTaking />;
};
```

### Multiple Contexts

```typescript
const MyComponent = () => {
  const { user } = useAuthContext();
  const { currentExam, remainingTime } = useExamContext();

  return (
    <div>
      <p>User: {user?.fullName}</p>
      <p>Exam: {currentExam?.title}</p>
      <p>Time: {remainingTime}s</p>
    </div>
  );
};
```

---

## 📝 TypeScript Support

Tất cả contexts đều có full TypeScript support:

```typescript
import type { IAuthContext, IExamContext } from "@/contexts";

// Type-safe context usage
const auth: IAuthContext = useAuthContext();
const exam: IExamContext = useExamContext();
```

---

## 🐛 Debugging

### Check Auth State

```typescript
const { user, token, isAuthenticated } = useAuthContext();

console.log("User:", user);
console.log("Token:", token);
console.log("Authenticated:", isAuthenticated);
```

### Check Exam State

```typescript
const { session, remainingTime } = useExamContext();

console.log("Session:", session);
console.log("Remaining:", remainingTime);
console.log("Answers:", session?.answers);
```

### Check localStorage

```javascript
// In browser console
localStorage.getItem("access_token");
localStorage.getItem("user_info");
```

### Check sessionStorage

```javascript
// In browser console
sessionStorage.getItem("exam_session");
```

---

## 📚 Tài liệu tham khảo

- [React Context](https://react.dev/reference/react/useContext)
- [React Context Best Practices](https://kentcdodds.com/blog/how-to-use-react-context-effectively)

---

**Lưu ý**: Contexts hiện đang sử dụng mock data từ services. Khi backend API sẵn sàng, chỉ cần update services và contexts sẽ tự động hoạt động với real API.
