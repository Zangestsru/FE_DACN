import { Routes, Route } from 'react-router-dom';
 
import Users from '@/admin/pages/Users';
import Teachers from '@/admin/pages/Teachers';
import Questions from '@/admin/pages/Questions';
import Exams from '@/admin/pages/Exams';
import Reports from '@/admin/pages/Reports';
import Chat from '@/admin/pages/Chat';
import Feedback from '@/admin/pages/Feedback';
import Calendar from '@/admin/pages/Calendar';
import Blank from '@/admin/pages/Blank';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="" element={<Blank />} />
      <Route path="users" element={<Users />} />
      <Route path="teachers" element={<Teachers />} />
      <Route path="questions" element={<Questions />} />
      <Route path="exams" element={<Exams />} />
      <Route path="reports" element={<Reports />} />
      <Route path="chat" element={<Chat />} />
      <Route path="calendar" element={<Calendar />} />
      <Route path="blank" element={<Blank />} />
    </Routes>
  );
}

