import { BrowserRouter as Router, Routes, Route } from "react-router";
import { useEffect } from "react";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { useRequireAdmin } from "./context/AuthContext";
import { ScrollToTop } from "./components/common/ScrollToTop";
import EducationDashboard from "./pages/Dashboard/EducationDashboard";
import Users from "./pages/Users";
import Teachers from "./pages/Teachers";
import Questions from "./pages/Questions";
import Exams from "./pages/Exams";
import Courses from "./pages/Courses";
import Subjects from "./pages/Subjects";
import Statistics from "./pages/Statistics";
import Chat from "./pages/Chat";
import Feedback from "./pages/Feedback";
import Reports from "./pages/Reports";
import Payments from "./pages/Payments";
import ExamHistory from "./pages/ExamHistory";
import CourseEnrollment from "./pages/CourseEnrollment";
import { AiChatProvider } from "./context/AiChatContext";
import { apiService } from "./services/api.service";
import AiChatDock from "./components/chat/AiChatDock";

export default function App() {
  useEffect(() => {
    try {
      const envAny: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
      const tok = String(envAny.VITE_TEST_TOKEN || '').trim();
      if (tok) {
        apiService.setAuthToken(tok);
        const ls = typeof localStorage !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken')) : '';
        if (!ls && typeof localStorage !== 'undefined') {
          localStorage.setItem('access_token', tok);
        }
      }
    } catch {}
  }, []);
  useRequireAdmin();
  return (
    <>
      <Router basename="/admin">
        <AiChatProvider>
          <ScrollToTop />
          <Routes>
          {/* Dashboard Layout */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<EducationDashboard />} />
            <Route path="education-dashboard" element={<EducationDashboard />} />

            {/* Pages mới */}
            <Route path="users" element={<Users />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="questions" element={<Questions />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="exams" element={<Exams />} />
            <Route path="courses" element={<Courses />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="chat" element={<Chat />} />
            <Route path="ai-chat" element={<Chat />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="reports" element={<Reports />} />
            <Route path="payments" element={<Payments />} />
            <Route path="exam-history" element={<ExamHistory />} />
            <Route path="course-enrollment" element={<CourseEnrollment />} />
          </Route>

          {/* Auth routes removed - use Online Exam login at root /signin */}

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          <AiChatDock />
        </AiChatProvider>
      </Router>
    </>
  );
}
