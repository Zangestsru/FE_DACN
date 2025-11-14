import { Routes, Route } from 'react-router-dom';
import AppLayout from '@/teacher/layout/AppLayout';
import { ScrollToTop } from '@/teacher/components/common/ScrollToTop';
import { ThemeProvider } from '@/teacher/context/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
 
import Home from '@/teacher/pages/Dashboard/Home';
import EducationDashboard from '@/teacher/pages/Dashboard/EducationDashboard';
import Users from '@/teacher/pages/Users';
import Teachers from '@/teacher/pages/Teachers';
import Questions from '@/teacher/pages/Questions';
import Exams from '@/teacher/pages/Exams';
import Statistics from '@/teacher/pages/Statistics';
import Chat from '@/teacher/pages/Chat';
import Feedback from '@/teacher/pages/Feedback';
import Reports from '@/teacher/pages/Reports';
import Students from '@/teacher/pages/Students';
import MockExams from '@/teacher/pages/MockExams';
import NotFound from '@/teacher/pages/OtherPage/NotFound';

export default function TeacherApp() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <ScrollToTop />
        <Routes>
          <Route path="" element={<AppLayout />}> 
            <Route index element={<Home />} />
            <Route path="education-dashboard" element={<EducationDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="questions" element={<Questions />} />
            <Route path="exams" element={<Exams />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="chat" element={<Chat />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="reports" element={<Reports />} />
            <Route path="students" element={<Students />} />
            <Route path="mock-exams" element={<MockExams />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </HelmetProvider>
  );
}
