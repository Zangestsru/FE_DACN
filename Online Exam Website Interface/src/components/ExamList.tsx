import React from 'react';
import { IExam } from '@/types';
import { useExams } from '@/hooks';

interface Exam {
  id: number;
  title: string;
  subject: string;
  date: string;
  time: string;
  questions: number;
  duration: string;
  price: number;
}

const exams: Exam[] = [
  {
    id: 1,
    title: "ĐỀ THI THỬ Anh Ngữ 3 (Ngữ pháp)",
    subject: "🎯 Câu hỏi: 60 câu",
    date: "📅 22/04/2024",
    time: "⏰ Thời gian: 90 phút",
    questions: 60,
    duration: "Thời gian: 60 phút",
    price: 5000
  },
  {
    id: 2,
    title: "Anh Ngữ 3 (Phần đọc hiểu)",
    subject: "🎯 Câu hỏi: 75 câu",
    date: "📅 12/05/2024",
    time: "⏰ Thời gian: 105 phút",
    questions: 75,
    duration: "Thời gian: 105 phút",
    price: 5000
  },
  {
    id: 3,
    title: "Pháp Luật Đại Cương (Luyện phần 1)",
    subject: "🎯 Câu hỏi: 50 câu",
    date: "📅 18/04/2024",
    time: "⏰ Thời gian: 120 phút",
    questions: 50,
    duration: "Thời gian: 120 phút",
    price: 0
  },
  {
    id: 4,
    title: "Pháp Luật Đại Cương (Luyện phần 2)",
    subject: "🎯 Câu hỏi: 45 câu",
    date: "📅 19/04/2024",
    time: "⏰ Thời gian: 135 phút",
    questions: 45,
    duration: "Thời gian: 135 phút",
    price: 10000
  },
  {
    id: 5,
    title: "Pháp Luật Đại Cương (Luyện phần 3)",
    subject: "🎯 Câu hỏi: 55 câu",
    date: "📅 07/05/2024",
    time: "⏰ Thời gian: 165 phút",
    questions: 55,
    duration: "Thời gian: 165 phút",
    price: 10000
  },
  {
    id: 6,
    title: "Pháp Luật Đại Cương (Luyện phần 4)",
    subject: "🎯 Câu hỏi: 40 câu",
    date: "📅 21/05/2024",
    time: "⏰ Thời gian: 120 phút",
    questions: 40,
    duration: "Thời gian: 120 phút",
    price: 10000
  },
  {
    id: 7,
    title: "Tiếng Anh 5 (Phần đọc hiểu)",
    subject: "🎯 Câu hỏi: 50 câu",
    date: "📅 15/05/2024",
    time: "⏰ Thời gian: 90 phút",
    questions: 50,
    duration: "Thời gian: 90 phút",
    price: 5000
  },
  {
    id: 8,
    title: "Tiếng Anh 4 (Phần đọc hiểu)",
    subject: "🎯 Câu hỏi: 45 câu",
    date: "📅 12/05/2024",
    time: "⏰ Thời gian: 135 phút",
    questions: 45,
    duration: "Thời gian: 135 phút",
    price: 4000
  },
  {
    id: 9,
    title: "Tiếng Anh 4 (Phần nghe)",
    subject: "🎯 Câu hỏi: 30 câu",
    date: "📅 09/05/2024",
    time: "⏰ Thời gian: 60 phút",
    questions: 30,
    duration: "Thời gian: 60 phút",
    price: 4000
  },
  {
    id: 10,
    title: "Tiếng Anh 3 - Khoa cũ (Phần đọc hiểu)",
    subject: "🎯 Câu hỏi: 40 câu",
    date: "📅 22/05/2024",
    time: "⏰ Thời gian: 120 phút",
    questions: 40,
    duration: "Thời gian: 120 phút",
    price: 3000
  }
];

export const ExamList: React.FC = () => {
  return (
    <div className="p-3">
      <div className="row">
        {exams.map((exam) => (
          <div key={exam.id} className="col-12 mb-2">
            <div className="exam-card p-3">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h6 className="mb-2">
                    <a href="#" className="exam-title">
                      {exam.title}
                    </a>
                  </h6>
                  <div className="exam-meta">
                    <span className="me-3">{exam.subject}</span>
                    <span className="me-3">{exam.date}</span>
                    <span className="me-3">{exam.time}</span>
                    <span className="me-3">👥 Làm bài: 0</span>
                    {exam.price > 0 && (
                      <span className="text-danger">💰 Phí: {exam.price.toLocaleString()}đ</span>
                    )}
                    {exam.price === 0 && (
                      <span className="text-success">🆓 Miễn phí</span>
                    )}
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <button className="btn btn-primary btn-sm me-2">
                    Thi thử
                  </button>
                  <button className="btn btn-outline-secondary btn-sm">
                    Xem đáp án
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      <nav aria-label="Exam pagination" className="mt-4">
        <ul className="pagination justify-content-center">
          <li className="page-item disabled">
            <span className="page-link">«</span>
          </li>
          <li className="page-item active">
            <span className="page-link">1</span>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">2</a>
          </li>
          <li className="page-item">
            <span className="page-link">...</span>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">37</a>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">»</a>
          </li>
        </ul>
      </nav>
    </div>
  );
};