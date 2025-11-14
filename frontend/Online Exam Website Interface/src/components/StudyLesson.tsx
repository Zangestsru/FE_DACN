import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface StudyLessonProps {
  course: any;
  onBackToCourse: () => void;
}

export const StudyLesson: React.FC<StudyLessonProps> = ({ course, onBackToCourse }) => {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [activeTab, setActiveTab] = useState('video');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const lessons = [
    {
      id: 1,
      title: 'Giới thiệu khóa học',
      type: 'video',
      duration: '15:30',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      transcript: `
Xin chào và chào mừng các bạn đến với khóa học ${course?.title}. 
Trong bài học đầu tiên này, chúng ta sẽ tìm hiểu tổng quan về khóa học...
      `,
      materials: [
        { name: 'Slide bài giảng', type: 'pdf', size: '2.5 MB' },
        { name: 'Source code', type: 'zip', size: '1.2 MB' }
      ],
      completed: false
    },
    {
      id: 2,
      title: 'Cài đặt môi trường phát triển',
      type: 'video',
      duration: '25:45',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      transcript: `
Trong bài học này, chúng ta sẽ học cách cài đặt và cấu hình môi trường phát triển...
      `,
      materials: [
        { name: 'Hướng dẫn cài đặt', type: 'pdf', size: '3.1 MB' },
        { name: 'Tool list', type: 'txt', size: '1 KB' }
      ],
      completed: false
    },
    {
      id: 3,
      title: 'Tài liệu tham khảo',
      type: 'document',
      content: `
# Tài liệu tham khảo

## 1. Giới thiệu

Đây là tài liệu tham khảo chi tiết cho khóa học ${course?.title}.

## 2. Kiến thức cơ bản

### 2.1 Khái niệm cơ bản
- Định nghĩa A
- Định nghĩa B
- Định nghĩa C

### 2.2 Nguyên tắc quan trọng
1. Nguyên tắc thứ nhất
2. Nguyên tắc thứ hai
3. Nguyên tắc thứ ba

## 3. Thực hành

### 3.1 Bài tập cơ bản
- Bài tập 1: Làm quen với giao diện
- Bài tập 2: Thực hiện tác vụ đơn giản
- Bài tập 3: Tích hợp với hệ thống

### 3.2 Dự án thực tế
Áp dụng kiến thức đã học vào dự án thực tế...

## 4. Tài nguyên bổ sung

- Link 1: [Tài liệu chính thức](https://example.com)
- Link 2: [Best practices](https://example.com)
- Link 3: [Community forum](https://example.com)
      `,
      materials: [
        { name: 'Tài liệu PDF đầy đủ', type: 'pdf', size: '5.2 MB' },
        { name: 'Checklist', type: 'doc', size: '500 KB' }
      ],
      completed: false
    }
  ];

  const currentLessonData = lessons[currentLesson];

  const handleLessonComplete = () => {
    lessons[currentLesson].completed = true;
    if (currentLesson < lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    }
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return '0:00';
    return duration;
  };

  const getProgress = () => {
    const completed = lessons.filter(lesson => lesson.completed).length;
    return Math.round((completed / lessons.length) * 100);
  };

  // Xử lý sự kiện resize cửa sổ
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial state
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="vh-100 d-flex flex-column" style={{ backgroundColor: '#000' }}>
      {/* Header - Đã tối ưu cho mobile */}
      <div className="bg-dark text-white p-2 p-md-3">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between">
          <div className="d-flex align-items-center mb-2 mb-md-0 me-md-4">
            <button 
              className="btn btn-dark btn-sm me-3"
              onClick={onBackToCourse}
            >
              ← Quay lại
            </button>
            <h5 className="mb-0 fs-6 text-truncate">{course?.title}</h5>
          </div>
          
          <div className="d-flex align-items-center justify-content-between w-100 w-md-auto ms-md-4">
            <div className="d-flex align-items-center">
              <span className="me-2 small">Tiến độ: {getProgress()}%</span>
              <div className="progress me-2" style={{ width: '80px', height: '6px' }}>
                <div 
                  className="progress-bar bg-success" 
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>
            </div>
            <button 
              className="btn btn-dark btn-sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              id="sidebarToggleBtn"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow-1 d-flex position-relative">
        {/* Main Content - Đã tối ưu cho mobile */}
        <div 
          className="flex-grow-1 d-flex flex-column"
          style={{ 
            width: sidebarOpen ? 'calc(100% - 300px)' : '100%',
            transition: 'width 0.3s ease-in-out'
          }}
        >
          {/* Video/Content Area */}
          <div className="flex-grow-1 position-relative">
            {currentLessonData.type === 'video' ? (
              <iframe
                src={currentLessonData.videoUrl}
                className="w-100 h-100 border-0"
                allowFullScreen
                title={currentLessonData.title}
              />
            ) : (
              <div className="h-100 bg-white p-3 p-md-4 overflow-auto">
                <div className="container-fluid">
                  <div className="row justify-content-center">
                    <div className="col-12 col-lg-8">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: currentLessonData.content?.replace(/\n/g, '<br/>') || '' 
                        }}
                        style={{ 
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.6',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls - Đã tối ưu cho mobile */}
          <div className="bg-dark text-white p-2 p-md-3">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between">
              <div className="mb-2 mb-md-0">
                <h6 className="mb-1 fs-6">{currentLessonData.title}</h6>
                <small className="text-muted">
                  {currentLessonData.type === 'video' 
                    ? `Video • ${formatDuration(currentLessonData.duration)}`
                    : 'Tài liệu học tập'
                  }
                </small>
              </div>
              
              <div className="d-grid d-md-flex gap-2">
                <button 
                  className="btn btn-outline-light btn-sm mb-2 mb-md-0"
                  disabled={currentLesson === 0}
                  onClick={() => setCurrentLesson(currentLesson - 1)}
                >
                  ← Bài trước
                </button>
                
                <button 
                  className="btn btn-success btn-sm mb-2 mb-md-0"
                  onClick={handleLessonComplete}
                >
                  {currentLessonData.completed ? '✓ Đã hoàn thành' : 'Hoàn thành bài học'}
                </button>
                
                <button 
                  className="btn btn-outline-light btn-sm"
                  disabled={currentLesson === lessons.length - 1}
                  onClick={() => setCurrentLesson(currentLesson + 1)}
                >
                  Bài tiếp theo →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Đã tối ưu cho mobile */}
        <div className={`bg-white border-start study-sidebar ${sidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`} 
             style={{ 
               width: sidebarOpen ? '300px' : '0px', 
               height: '100vh', 
               position: 'relative',
               zIndex: 1030,
               overflow: 'hidden',
               transition: 'width 0.3s ease-in-out',
               display: 'flex',
               flexDirection: 'column'
             }}>
            {/* Tabs */}
            <div className="border-bottom d-flex justify-content-between align-items-center">
              <ul className="nav nav-tabs border-0 flex-nowrap w-100" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
                <li className="nav-item flex-fill text-center">
                  <button 
                    className={`nav-link ${activeTab === 'playlist' ? 'active' : ''} border-0 w-100 px-1 px-md-2`}
                    onClick={() => setActiveTab('playlist')}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Danh sách bài học
                  </button>
                </li>
                <li className="nav-item flex-fill text-center">
                  <button 
                    className={`nav-link ${activeTab === 'notes' ? 'active' : ''} border-0 w-100 px-1 px-md-2`}
                    onClick={() => setActiveTab('notes')}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Ghi chú
                  </button>
                </li>
                <li className="nav-item flex-fill text-center">
                  <button 
                    className={`nav-link ${activeTab === 'materials' ? 'active' : ''} border-0 w-100 px-1 px-md-2`}
                    onClick={() => setActiveTab('materials')}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Tài liệu
                  </button>
                </li>
              </ul>
              <button className="btn btn-sm btn-close d-md-none position-absolute" style={{ right: '8px', top: '8px' }} onClick={() => setSidebarOpen(false)}></button>
            </div>

            <div className="p-3 flex-grow-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 50px)' }}>
              {/* Playlist Tab */}
              {activeTab === 'playlist' && (
                <div className="playlist-tab pb-5">
                  {lessons.map((lesson, index) => (
                    <div 
                      key={lesson.id}
                      className={`p-2 border rounded mb-2 cursor-pointer ${
                        index === currentLesson ? 'bg-primary text-white' : 'bg-light'
                      }`}
                      onClick={() => {
                        setCurrentLesson(index);
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="me-2" style={{ flexShrink: 0 }}>
                          {lesson.completed ? '✅' : (lesson.type === 'video' ? '▶️' : '📄')}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="fw-medium small text-truncate">{lesson.title}</div>
                          <small className={index === currentLesson ? 'text-white-50' : 'text-muted'}>
                            {lesson.type === 'video' 
                              ? formatDuration(lesson.duration)
                              : 'Tài liệu'
                            }
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="notes-tab pb-5">
                  <h6 className="mb-2 fs-6 fw-bold">Ghi chú của bạn</h6>
                  <textarea 
                    className="form-control mb-2" 
                    rows={6}
                    placeholder="Viết ghi chú cho bài học này..."
                    style={{ fontSize: '0.9rem' }}
                  />
                  <button className="btn btn-primary btn-sm w-100 py-1">
                    Lưu ghi chú
                  </button>
                  
                  <div className="mt-3">
                    <h6 className="mb-2 fs-6 fw-bold">Transcript</h6>
                    {currentLessonData.transcript && (
                      <div className="p-2 bg-light rounded" style={{ fontSize: '0.85rem' }}>
                        <small>{currentLessonData.transcript}</small>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Materials Tab */}
              {activeTab === 'materials' && (
                <div className="materials-tab pb-5">
                  <h6 className="mb-2 fs-6 fw-bold">Tài liệu bài học</h6>
                  {currentLessonData.materials?.map((material, index) => (
                    <div key={index} className="d-flex align-items-center p-2 border rounded mb-2">
                      <div className="me-2" style={{ flexShrink: 0 }}>
                        {material.type === 'pdf' ? '📄' : 
                         material.type === 'zip' ? '📦' : 
                         material.type === 'doc' ? '📝' : '📎'}
                      </div>
                      <div className="flex-grow-1 overflow-hidden mx-1">
                        <div className="fw-medium small text-truncate" style={{ fontSize: '0.85rem' }}>{material.name}</div>
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>{material.size}</small>
                      </div>
                      <button className="btn btn-outline-primary btn-sm py-1 px-2" style={{ flexShrink: 0, fontSize: '0.8rem' }}>
                        Tải về
                      </button>
                    </div>
                  ))}
                  
                  <div className="mt-4">
                    <h6 className="mb-3 fs-6">Liên kết hữu ích</h6>
                    <div className="list-group list-group-flush">
                      <a href="#" className="list-group-item list-group-item-action py-2">
                        📚 Tài liệu tham khảo chính thức
                      </a>
                      <a href="#" className="list-group-item list-group-item-action py-2">
                        🎯 Bài tập thực hành
                      </a>
                      <a href="#" className="list-group-item list-group-item-action py-2">
                        💬 Diễn đàn thảo luận
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

// Thêm CSS vào component để xử lý responsive
const styles = `
@media (max-width: 767.98px) {
  .study-sidebar {
    width: 100% !important;
    max-width: 300px;
    box-shadow: -2px 0 10px rgba(0,0,0,0.2);
  }
  
  .sidebar-hidden {
    display: none;
  }
  
  .nav-tabs .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  
  .notes-tab h6, .materials-tab h6 {
    font-size: 0.9rem !important;
  }
  
  .notes-tab textarea {
    min-height: 100px;
  }
  
  .materials-tab .btn {
    padding: 0.2rem 0.5rem !important;
  }
}

@media (max-width: 575.98px) {
  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .progress {
    width: 60px !important;
  }
}
`;

// Thêm CSS vào document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}