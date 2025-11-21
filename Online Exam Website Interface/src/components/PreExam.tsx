import React, { useState } from 'react';

interface PreExamProps {
  exam: any;
  onStartExam: () => void;
}

export const PreExam: React.FC<PreExamProps> = ({ exam, onStartExam }) => {
  const [isAgreed, setIsAgreed] = useState(false);

  const handleStartExam = () => {
    if (!isAgreed) {
      alert('Vui lòng đồng ý với quy định trước khi bắt đầu.');
      return;
    }
    onStartExam();
  };

  if (!exam) return null;

  // Fixed time and countdown as requested
  const currentTime = "14:40:00 20/10/2025";
  const countdownTime = "89:18";

  return (
    <div style={{ maxWidth: '800px', margin: '140px auto 20px auto', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', backgroundColor: '#0073e6', color: 'white', padding: '20px', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ margin: 0 }}>THÔNG TIN BÀI THI</h1>
        <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', lineHeight: '1.4' }}>
          {exam.title}<br />
          {exam.description}
        </p>
      </header>

      {/* Student Information Section */}
      <section style={{ 
        margin: '20px 0', 
        padding: '0', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        backgroundColor: '#ffffff'
      }}>
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid #ddd'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#333',
            textAlign: 'center'
          }}>
            THÔNG TIN THÍ SINH
          </h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px' 
          }}>
            <div style={{ 
              padding: '16px 20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <div style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>Họ và tên</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#666' }}>Nguyễn Văn A</div>
            </div>
            <div style={{ 
              padding: '16px 20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <div style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>Mã thí sinh</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#666' }}>TS001234</div>
            </div>
            <div style={{ 
              padding: '16px 20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <div style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>Email</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#666' }}>nguyen.van.a@email.com</div>
            </div>
            <div style={{ 
              padding: '16px 20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <div style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>Thời gian làm bài</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#666' }}>90 phút</div>
            </div>
            <div style={{ 
              padding: '16px 20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <div style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>Số câu hỏi</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#666' }}>65</div>
            </div>
            <div style={{ 
              padding: '16px 20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <div style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>Điểm tối thiểu để đạt</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#666' }}>70%</div>
            </div>
            <div style={{ 
              padding: '16px 20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <div style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>Mức độ khó</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#666' }}>Beginner</div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines Section */}
      <section style={{ 
        margin: '20px 0', 
        padding: '0', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        backgroundColor: '#ffffff'
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px 24px', 
          borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid #ddd'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#333',
            textAlign: 'center'
          }}>
            QUY ĐỊNH VÀ HƯỚNG DẪN
          </h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '20px' 
          }}>
            {/* Important Notes Card */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#333'
              }}>
                Lưu ý quan trọng:
              </h3>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                color: '#333',
                fontSize: '18px',
                lineHeight: '1.6'
              }}>
                <li style={{ marginBottom: '12px' }}>Không được thoát khỏi trình duyệt trong lúc thi</li>
                <li style={{ marginBottom: '12px' }}>Không được sử dụng tài liệu tham khảo</li>
                <li style={{ marginBottom: '12px' }}>Khi hết thời gian, bài thi sẽ tự động nộp</li>
                <li style={{ marginBottom: '12px' }}>Mỗi câu hỏi chỉ có 1 đáp án đúng</li>
              </ul>
            </div>

            {/* Instructions Card */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#333'
              }}>
                Hướng dẫn làm bài:
              </h3>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                color: '#333',
                fontSize: '18px',
                lineHeight: '1.6'
              }}>
                <li style={{ marginBottom: '12px' }}>Đọc kỹ đề bài trước khi chọn đáp án</li>
                <li style={{ marginBottom: '12px' }}>Có thể quay lại câu hỏi đã làm để kiểm tra</li>
                <li style={{ marginBottom: '12px' }}>Nhấn "Nộp bài" khi hoàn thành</li>
                <li style={{ marginBottom: '12px' }}>Kiểm tra kết nối internet trước khi bắt đầu</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* System Check Section */}
      <section style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fafafa' }}>
        <h2 style={{ margin: '0 0 15px 0', textAlign: 'center', fontSize: '20px' }}>KIỂM TRA HỆ THỐNG</h2>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', margin: '10px' }}>
            <strong>Kết nối mạng</strong><br />
            Tốt
          </div>
          <div style={{ textAlign: 'center', margin: '10px' }}>
            <strong>Trình duyệt</strong><br />
            Tương thích
          </div>
          <div style={{ textAlign: 'center', margin: '10px' }}>
            <strong>Camera/Mic</strong><br />
            Hoạt động
          </div>
          <div style={{ textAlign: 'center', margin: '10px' }}>
            <strong>Thời gian</strong><br />
            {currentTime}
          </div>
        </div>
      </section>

      {/* Timer */}
       <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c', textAlign: 'center', margin: '20px 0' }}>
         Đồng hồ đếm ngược: {countdownTime}
       </div>

      {/* Agreement and Start Button */}
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <input 
          type="checkbox" 
          id="agree" 
          checked={isAgreed}
          onChange={(e) => setIsAgreed(e.target.checked)}
          required 
        />
        <label htmlFor="agree" style={{ marginLeft: '8px' }}>
          Tôi đã đọc và hiểu rõ các quy định thi, đồng ý tuân thủ các quy tắc trên
        </label>
        <br /><br />
        <button 
          onClick={handleStartExam}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '18px',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
        >
          Bắt đầu thi
        </button>
        <p style={{ marginTop: '10px' }}>Đồng hồ đếm ngược sẽ bắt đầu chạy.</p>
      </div>
    </div>
  );
};