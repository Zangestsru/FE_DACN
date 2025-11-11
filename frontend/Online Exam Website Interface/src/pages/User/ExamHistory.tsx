import React, { useEffect, useState } from 'react';
import { examService } from '@/services/exam.service';
import { userService } from '@/services/user.service';
import type { IExam, IExamResult } from '@/types';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} phút ${s} giây`;
}

interface ResultWithExam extends IExamResult { exam: IExam }

const ExamHistory: React.FC = () => {
  const [results, setResults] = useState<ResultWithExam[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      examService.getMyResults(),
      userService.getActivityHistory(),
    ])
      .then(([res, acts]) => {
        if (!mounted) return;
        setResults(res);
        // Chỉ hiển thị các hoạt động liên quan đến bài thi
        setActivities(acts.filter((a: any) => a.type?.includes('exam')));
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError('Không thể tải lịch sử làm bài.');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-3">Lịch sử làm bài</h2>
      <p className="text-muted mb-4">Xem lại các bài thi bạn đã làm và kết quả.</p>

      {loading && (
        <div className="text-center py-5"><div className="spinner-border" role="status"/><div className="mt-2">Đang tải...</div></div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">{error}</div>
      )}

      {!loading && !error && (
        <div className="row">
          {results.map((item, idx) => (
            <div className="col-md-6" key={idx}>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="card-title mb-1">{item.exam.title}</h5>
                      <div className="text-muted">{item.exam.category} · {item.exam.difficulty}</div>
                    </div>
                    <span className={`badge ${item.passed ? 'bg-success' : 'bg-danger'}`}>{item.passed ? 'Đạt' : 'Chưa đạt'}</span>
                  </div>
                  <div className="mt-3">
                    <div className="row">
                      <div className="col-6">
                        <div><strong>Điểm:</strong> {item.score}</div>
                        <div><strong>Số câu đúng:</strong> {item.correctAnswers}/{item.totalQuestions}</div>
                      </div>
                      <div className="col-6">
                        <div><strong>Thời gian làm:</strong> {formatDuration(item.timeSpent)}</div>
                        <div><strong>Giá:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.exam.price)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="col-12">
              <div className="card"><div className="card-body text-muted">Chưa có kết quả làm bài nào.</div></div>
            </div>
          )}
        </div>
      )}

      {/* Hoạt động liên quan đến bài thi */}
      {!loading && !error && activities.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-3">Hoạt động gần đây</h5>
          <ul className="list-group">
            {activities.map((a, i) => (
              <li className="list-group-item d-flex justify-content-between" key={i}>
                <span>{a.title}</span>
                <span className="text-muted small">{new Date(a.timestamp).toLocaleString('vi-VN')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExamHistory;