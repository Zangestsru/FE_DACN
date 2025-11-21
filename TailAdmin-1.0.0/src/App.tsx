import { BrowserRouter as Router, Routes, Route } from "react-router";
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
import Home from "./pages/Dashboard/Home";
import EducationDashboard from "./pages/Dashboard/EducationDashboard";
import Users from "./pages/Users";
import Teachers from "./pages/Teachers";
import Questions from "./pages/Questions";
import Exams from "./pages/Exams";
import Subjects from "./pages/Subjects";
import Statistics from "./pages/Statistics";
import Chat from "./pages/Chat";
import Feedback from "./pages/Feedback";
import Reports from "./pages/Reports";
import Payments from "./pages/Payments";

export default function App() {
  useRequireAdmin();
  return (
    <>
      <Router basename="/admin">
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
            <Route path="exams" element={<Exams />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="chat" element={<Chat />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="reports" element={<Reports />} />
            <Route path="payments" element={<Payments />} />
          </Route>

          {/* Auth routes removed - use Online Exam login at root /signin */}

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
