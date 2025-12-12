import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
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
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import EducationDashboard from "./pages/Dashboard/EducationDashboard";
import Users from "./pages/Users";
import Teachers from "./pages/Teachers";
import Questions from "./pages/Questions";
import Exams from "./pages/Exams";
import Subjects from "./pages/Subjects";
import Courses from "./pages/Courses";
import Statistics from "./pages/Statistics";
import Chat from "./pages/Chat";
import Feedback from "./pages/Feedback";
import Reports from "./pages/Reports";
import ExamHistory from "./pages/ExamHistory";
import CourseEnrollment from "./pages/CourseEnrollment";

export default function App() {
  return (
    <>
      <Router basename="/teacher">
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="education-dashboard" element={<EducationDashboard />} />

            {/* Pages mới */}
            <Route path="users" element={<Users />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="questions" element={<Questions />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="courses" element={<Courses />} />
            <Route path="exams" element={<Exams />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="chat" element={<Chat />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="reports" element={<Reports />} />
            <Route path="exam-history" element={<ExamHistory />} />
            <Route path="course-enrollment" element={<CourseEnrollment />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
