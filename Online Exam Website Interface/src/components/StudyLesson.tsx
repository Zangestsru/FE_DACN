import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { courseService } from '../services/course.service';
import { ILesson } from '../types/course.types';
import { useCourseDetail } from '../hooks/useCourses';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import './StudyLesson.css';

interface StudyLessonProps {
  onBackToCourse: (courseId: string) => void;
}

export const StudyLesson: React.FC<StudyLessonProps> = ({ onBackToCourse }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const isTrialMode = searchParams.get('trial') === 'true';

  // ✅ Fetch course data from API using courseId from URL
  const { data: course, loading: loadingCourse, error: courseError } = useCourseDetail(courseId || null);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [activeTab, setActiveTab] = useState('playlist');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const [completingCourse, setCompletingCourse] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  // State cho câu hỏi
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number[] }>({});
  const [showResults, setShowResults] = useState<{ [questionId: number]: boolean }>({});

  // Kiểm tra enrollment status
  const checkEnrollment = async () => {
    if (!courseId || !course?.id || !isAuthenticated) {
      setIsEnrolled(false);
      return;
    }

    try {
      setCheckingEnrollment(true);
      const enrollmentStatus = await courseService.getEnrollmentStatus(course.id);
      setIsEnrolled(enrollmentStatus.isEnrolled);
      setIsCourseCompleted(enrollmentStatus.isCompleted);
      console.log('✅ Enrollment status:', enrollmentStatus);
    } catch (error) {
      console.error('Error checking enrollment:', error);
      setIsEnrolled(false);
      setIsCourseCompleted(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  // Fetch lessons and materials when component mounts or courseId changes
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) {
        console.warn('⚠️ No courseId found in URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📚 Loading course data for courseId:', courseId);

        // Fetch lessons
        console.log('📤 Fetching lessons from API...');
        const fetchedLessons = await courseService.getCourseLessons(courseId);
        console.log('✅ Loaded lessons:', fetchedLessons);
        console.log('✅ Number of lessons:', fetchedLessons.length);
        setLessons(fetchedLessons);

        // Fetch course materials
        try {
          console.log('📤 Fetching materials from API...');
          const materials = await courseService.getCourseMaterials(courseId);
          console.log('✅ Loaded course materials:', materials);
          console.log('✅ Number of materials:', materials?.length || 0);
          setCourseMaterials(materials || []);
        } catch (materialError) {
          console.error('⚠️ Error loading course materials:', materialError);
          setCourseMaterials([]);
        }

        // Load saved progress and mark completed lessons
        try {
          console.log('📤 Fetching saved progress from API...');
          const progress = await courseService.getCourseProgress(courseId);
          console.log('✅ Loaded progress:', progress);

          if (progress && progress.progressPercentage > 0) {
            // Đánh dấu các bài học đã hoàn thành dựa trên completedLessons count
            const completedCount = progress.completedLessons?.length || 0;
            if (completedCount > 0 && fetchedLessons.length > 0) {
              const updatedLessons = fetchedLessons.map((lesson, index) => ({
                ...lesson,
                completed: index < completedCount
              }));
              setLessons(updatedLessons);
              console.log('✅ Updated lessons with completed status:', updatedLessons);
            }
          }
        } catch (progressError) {
          console.warn('Could not load saved progress:', progressError);
        }
      } catch (error) {
        console.error('❌ Error loading course data:', error);
        console.error('❌ Error details:', error);
        setLessons([]);
        setCourseMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();

    // Kiểm tra enrollment nếu đã đăng nhập
    if (isAuthenticated && course?.id) {
      checkEnrollment();
    }
  }, [courseId, course?.id, isAuthenticated]);

  // Fallback lessons if API fails
  const fallbackLessons = [
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

  // Use fetched lessons or fallback
  const displayLessons = lessons.length > 0 ? lessons : fallbackLessons;
  const currentLessonData: ILesson = (displayLessons[currentLesson] || displayLessons[0] || {
    id: 0,
    title: 'Không có bài học',
    type: 'document' as const,
    duration: '0:00',
    content: 'Chưa có nội dung bài học.',
    materials: [],
    completed: false
  }) as ILesson;

  // Hàm kiểm tra và xử lý khi chuyển lesson
  const handleLessonChange = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= displayLessons.length) return;

    // Kiểm tra học thử miễn phí: chỉ áp dụng cho khóa học có phí
    // Chỉ cho phép lesson đầu tiên (index 0) nếu chưa enroll hoặc đang ở trial mode VÀ khóa học có phí
    const isPaidCourse = course?.price && Number(course.price) > 0;
    const shouldBlock = isPaidCourse && (isTrialMode || !isEnrolled) && newIndex > 0;

    if (shouldBlock) {
      toast.error('Bạn cần đăng ký khóa học để tiếp tục học. Bài học đầu tiên là học thử miễn phí.');
      navigate(`/study-detail/${courseId}`);
      return;
    }

    setCurrentLesson(newIndex);

    // Auto-save progress when lesson changes (only if enrolled)
    if (isEnrolled && course?.id && displayLessons[newIndex]) {
      try {
        const lesson = displayLessons[newIndex];
        console.log('💾 Auto-saving progress: lesson', lesson.id);
        courseService.updateCourseProgress(course.id, lesson.id!);
      } catch (error) {
        console.warn('Could not save progress:', error);
      }
    }
  };

  // Read lesson param from URL and set initial lesson (for "Continue Learning" feature)
  useEffect(() => {
    if (lessons.length === 0) return;

    const lessonIdParam = searchParams.get('lesson');
    if (lessonIdParam) {
      const lessonId = parseInt(lessonIdParam);
      // Find the lesson index by ID
      const lessonIndex = lessons.findIndex(l => l.id === lessonId);
      if (lessonIndex >= 0 && lessonIndex !== currentLesson) {
        console.log('📍 Setting initial lesson from URL param:', lessonId, '-> index', lessonIndex);
        setCurrentLesson(lessonIndex);
      }
    }
  }, [lessons, searchParams]);

  // Kiểm tra enrollment khi component mount hoặc khi enrollment status thay đổi
  useEffect(() => {
    // Chờ enrollment check hoàn thành trước khi quyết định
    if (checkingEnrollment || !course?.id) return;

    const isPaidCourse = course?.price && Number(course.price) > 0;

    console.log('🔍 Enrollment check:', {
      isTrialMode,
      isEnrolled,
      isAuthenticated,
      courseId: course?.id,
      checkingEnrollment,
      currentLesson,
      isPaidCourse,
      coursePrice: course?.price
    });

    // Nếu chưa đăng nhập, cho phép xem (có thể cần login sau)
    if (!isAuthenticated) {
      return;
    }

    // Nếu đã enroll, cho phép truy cập tất cả lessons
    if (isEnrolled) {
      console.log('✅ User is enrolled, allowing access to all lessons');
      return;
    }

    // Nếu khóa học miễn phí, cho phép truy cập tất cả lessons (không cần enroll)
    if (!isPaidCourse) {
      console.log('✅ Free course, allowing access to all lessons without enrollment');
      return;
    }

    // Nếu chưa enroll và khóa học có phí:
    // - Nếu có trial=true trong URL, cho phép học thử lesson đầu tiên
    // - Nếu không có trial=true, redirect về study-detail
    if (!isEnrolled && isPaidCourse) {
      if (isTrialMode) {
        console.log('✅ Trial mode enabled for paid course, allowing first lesson only');
        // Đảm bảo chỉ ở lesson đầu tiên
        if (currentLesson > 0) {
          console.log('⚠️ Trial mode but trying to access lesson > 0, resetting to 0');
          setCurrentLesson(0);
        }
      } else {
        console.log('⚠️ Not enrolled in paid course and not in trial mode, redirecting to study-detail');
        toast.error('Bạn cần đăng ký khóa học để tiếp tục học. Bài học đầu tiên là học thử miễn phí.');
        navigate(`/study-detail/${courseId}`);
      }
    }
  }, [isEnrolled, isTrialMode, isAuthenticated, course?.id, course?.price, checkingEnrollment, courseId, navigate, currentLesson]);

  // Kiểm tra khi currentLesson thay đổi (bảo vệ chống truy cập trực tiếp qua URL)
  useEffect(() => {
    // Chỉ áp dụng cho khóa học có phí
    const isPaidCourse = course?.price && Number(course.price) > 0;

    // Nếu khóa học có phí và (đang ở trial mode hoặc chưa enroll), chỉ cho phép lesson đầu tiên
    if (isPaidCourse && (isTrialMode || !isEnrolled) && currentLesson > 0) {
      console.log('⚠️ Blocking access to lesson', currentLesson, '- paid course, not enrolled and not trial mode for first lesson');
      toast.error('Bạn cần đăng ký khóa học để tiếp tục học. Bài học đầu tiên là học thử miễn phí.');
      setCurrentLesson(0);
      navigate(`/study-detail/${courseId}`);
    }
  }, [currentLesson, isEnrolled, isTrialMode, courseId, navigate, course?.price]);

  // Debug: Log current lesson data
  useEffect(() => {
    console.log('🔍 Current lesson data:', currentLessonData);
    console.log('🔍 Questions:', currentLessonData.questions);
    console.log('🔍 Questions length:', currentLessonData.questions?.length || 0);
  }, [currentLessonData]);

  // Reset answers and results when lesson changes
  useEffect(() => {
    setSelectedAnswers({});
    setShowResults({});
  }, [currentLesson]);

  const handleLessonComplete = async () => {
    const lesson = displayLessons[currentLesson];
    if (!lesson || !course?.id) return;

    try {
      // Mark lesson as completed via API
      await courseService.completeLesson(course.id, lesson.id!);

      // Update local state
      const updatedLessons = [...displayLessons] as ILesson[];
      updatedLessons[currentLesson] = { ...updatedLessons[currentLesson], completed: true };
      setLessons(updatedLessons);

      // Move to next lesson if available
      if (currentLesson < displayLessons.length - 1) {
        setCurrentLesson(currentLesson + 1);
      }
    } catch (error) {
      console.error('❌ Error completing lesson:', error);
      // Still update UI even if API fails
      const updatedLessons = [...displayLessons] as ILesson[];
      updatedLessons[currentLesson] = { ...updatedLessons[currentLesson], completed: true };
      setLessons(updatedLessons);
    }
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return '0:00';
    return duration;
  };

  const getProgress = () => {
    if (displayLessons.length === 0) return 0;
    const completed = displayLessons.filter(lesson => lesson.completed).length;
    return Math.round((completed / displayLessons.length) * 100);
  };

  const handleCompleteCourse = async () => {
    const courseIdNum = course?.id;
    if (!courseIdNum) {
      console.error('No courseId found');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn kết thúc khóa học này không?')) {
      return;
    }

    try {
      setCompletingCourse(true);
      await courseService.completeCourse(courseIdNum);
      setIsCourseCompleted(true);
      alert('Chúc mừng bạn đã hoàn thành khóa học! Bây giờ bạn có thể đánh giá khóa học.');
      // Quay về trang chủ sau 1 giây
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      console.error('Error completing course:', error);
      alert(error.message || 'Có lỗi xảy ra khi hoàn thành khóa học');
    } finally {
      setCompletingCourse(false);
    }
  };

  // Lưu tiến trình học tập thủ công
  const handleSaveProgress = async () => {
    if (!course?.id || !isEnrolled || savingProgress) return;

    const lesson = displayLessons[currentLesson];
    if (!lesson) return;

    try {
      setSavingProgress(true);
      await courseService.updateCourseProgress(course.id, lesson.id!);
      toast.success('Đã lưu tiến trình học tập!');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Không thể lưu tiến trình. Vui lòng thử lại.');
    } finally {
      setSavingProgress(false);
    }
  };

  // Xử lý nội dung để giữ định dạng xuống dòng
  const formatLessonContent = (content: string): string => {
    if (!content) return '';

    // Kiểm tra xem content có chứa HTML tags không
    const hasHtmlTags = /<[^>]+>/.test(content);

    if (hasHtmlTags) {
      // Nếu có HTML tags, chỉ replace \n ở những chỗ không phải trong tags
      // Tách content thành các phần (text và HTML tags)
      return content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split(/(<[^>]+>)/)
        .map((part, index) => {
          // Nếu là HTML tag, giữ nguyên
          if (part.startsWith('<')) {
            return part;
          }
          // Nếu là text, replace \n thành <br/>
          return part.replace(/\n/g, '<br/>');
        })
        .join('');
    } else {
      // Nếu không có HTML, chỉ cần replace \n thành <br/>
      return content
        .replace(/\r\n/g, '<br/>')
        .replace(/\n/g, '<br/>')
        .replace(/\r/g, '<br/>');
    }
  };

  // Kiểm tra xem URL có phải là video không
  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m3u8'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) ||
      lowerUrl.includes('video/') ||
      lowerUrl.includes('.m3u8');
  };

  // Kiểm tra xem lesson có video từ contentUrl không
  const hasVideoFromContentUrl = (): boolean => {
    if (!currentLessonData.contentUrl) return false;

    // Kiểm tra trong courseMaterials để lấy mediaType
    const material = courseMaterials.find((m: any) =>
      m.fileUrl === currentLessonData.contentUrl ||
      m.url === currentLessonData.contentUrl
    );

    if (material?.mediaType?.startsWith('video/')) {
      return true;
    }

    // Kiểm tra extension
    return isVideoUrl(currentLessonData.contentUrl);
  };

  // Chuyển đổi URL YouTube sang định dạng embed
  const convertYouTubeUrl = (url: string): string => {
    if (!url || !url.trim()) return '';

    const trimmedUrl = url.trim();

    // Nếu đã là URL embed thì trả về luôn
    if (trimmedUrl.includes('youtube.com/embed/')) {
      return trimmedUrl;
    }

    // Trích xuất video ID từ các định dạng URL YouTube phổ biến
    let videoId = '';

    try {
      // Xử lý URL dạng youtu.be/VIDEO_ID?si=...
      // Ví dụ: https://youtu.be/NtJnix-9niI?si=2v6urbuMPS0XbKNc
      if (trimmedUrl.includes('youtu.be/')) {
        const urlObj = new URL(trimmedUrl);
        // Lấy pathname và loại bỏ dấu / đầu tiên
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
          videoId = pathParts[0];
        }
      }
      // Xử lý URL dạng youtube.com/watch?v=VIDEO_ID
      else if (trimmedUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(trimmedUrl);
        videoId = urlObj.searchParams.get('v') || '';
      }
      // Xử lý URL dạng youtube.com/embed/VIDEO_ID (đã là embed)
      else if (trimmedUrl.includes('youtube.com/embed/')) {
        return trimmedUrl;
      }
    } catch (e) {
      // Nếu URL không hợp lệ, thử dùng regex
      console.warn('Error parsing YouTube URL, trying regex fallback:', e);

      // Regex fallback cho youtu.be/VIDEO_ID
      const shortMatch = trimmedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (shortMatch && shortMatch[1]) {
        videoId = shortMatch[1];
      }
      // Regex fallback cho youtube.com/watch?v=VIDEO_ID
      else {
        const watchMatch = trimmedUrl.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
        if (watchMatch && watchMatch[1]) {
          videoId = watchMatch[1];
        }
      }
    }

    // Nếu tìm thấy video ID, chuyển sang embed URL
    if (videoId) {
      // Lấy tham số t (thời gian) nếu có
      let timeParam = '';
      try {
        const urlObj = new URL(trimmedUrl);
        const t = urlObj.searchParams.get('t');
        if (t) {
          // Chuyển đổi t=123s thành start=123
          const timeValue = t.replace(/[^0-9]/g, '');
          if (timeValue) {
            timeParam = `?start=${timeValue}`;
          }
        }
      } catch (e) {
        // Ignore
      }

      return `https://www.youtube.com/embed/${videoId}${timeParam}`;
    }

    // Nếu không phải URL YouTube hợp lệ, trả về URL gốc
    console.warn('Could not extract YouTube video ID from URL:', trimmedUrl);
    return trimmedUrl;
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

  // Loading state
  if (loadingCourse || loading) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#000' }}>
        <div className="text-center text-white">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (courseError || !course || !courseId) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#000' }}>
        <div className="text-center text-white">
          <h4>Lỗi!</h4>
          <p>{courseError?.message || 'Không tìm thấy khóa học'}</p>
          <button className="btn btn-primary" onClick={() => courseId && onBackToCourse(courseId)}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vh-100 d-flex flex-column study-lesson-container">
      {/* Header - Responsive */}
      <div className="study-header">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between">
          <div className="d-flex align-items-center mb-2 mb-md-0 me-md-4">
            <button
              className="btn btn-dark btn-sm me-2 me-md-3"
              onClick={() => courseId && onBackToCourse(courseId)}
            >
              ← <span className="d-none d-sm-inline">Quay lại</span>
            </button>
            <h5 className="mb-0 study-header-title">{course?.title}</h5>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-grow-1 flex-md-grow-0">
            <div className="study-progress-wrapper">
              <span className="d-none d-sm-inline small">Tiến độ:</span>
              <span className="small">{getProgress()}%</span>
              <div className="study-progress-bar">
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>
              {getProgress() === 100 && !isCourseCompleted && (
                <button
                  className="btn btn-success btn-sm ms-2 d-none d-md-inline-block"
                  onClick={handleCompleteCourse}
                  disabled={completingCourse}
                >
                  {completingCourse ? '...' : '✓ Kết thúc'}
                </button>
              )}
              {isCourseCompleted && (
                <span className="badge bg-success ms-2 d-none d-sm-inline">
                  ✓ Hoàn thành
                </span>
              )}
              {isEnrolled && !isCourseCompleted && (
                <button
                  className="btn btn-outline-light btn-sm ms-2"
                  onClick={handleSaveProgress}
                  disabled={savingProgress}
                  title="Lưu tiến trình"
                >
                  {savingProgress ? '💾...' : '💾'}
                </button>
              )}
            </div>
            <button
              className="btn btn-outline-light btn-sm ms-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              id="sidebarToggleBtn"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow-1 d-flex position-relative" style={{ minHeight: 0, overflow: 'hidden' }}>
        {/* Main Content - Responsive */}
        <div
          className="study-main-content"
          style={{
            width: sidebarOpen ? 'calc(100% - 300px)' : '100%',
            transition: 'width 0.3s ease-in-out'
          }}
        >
          {/* Video/Content Area */}
          <div className="study-content-scroll">
            {loading ? (
              <div className="d-flex align-items-center justify-content-center h-100 bg-dark text-white">
                <div className="text-center">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                  <p>Đang tải nội dung...</p>
                </div>
              </div>
            ) : (currentLessonData.type === 'video' && currentLessonData.videoUrl) || hasVideoFromContentUrl() ? (
              <div className="d-flex flex-column w-100">
                {/* Video Player - Responsive */}
                <div className="study-video-container">
                  {(() => {
                    // Helper function để kiểm tra xem URL có phải là video file trực tiếp không
                    const isDirectVideoUrl = (url: string): boolean => {
                      if (!url) return false;
                      const lowerUrl = url.toLowerCase();
                      // Kiểm tra extension video
                      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m3u8'];
                      if (videoExtensions.some(ext => lowerUrl.includes(ext))) return true;
                      // Kiểm tra Cloudinary video URL
                      if (lowerUrl.includes('cloudinary.com') && lowerUrl.includes('/video/')) return true;
                      // Kiểm tra các CDN video khác
                      if (lowerUrl.includes('video/upload')) return true;
                      return false;
                    };

                    // Lấy URL video - ưu tiên videoUrl, sau đó contentUrl
                    const videoSource = currentLessonData.videoUrl || currentLessonData.contentUrl;

                    if (!videoSource) return null;

                    // Nếu là video file trực tiếp (Cloudinary, MP4, etc.), dùng video element
                    if (isDirectVideoUrl(videoSource)) {
                      console.log('Rendering as direct video:', videoSource);
                      return (
                        <video
                          key={videoSource}
                          src={videoSource}
                          controls
                          controlsList="download"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain', // Giữ tỷ lệ, không cắt
                            display: 'block',
                            backgroundColor: '#000'
                          }}
                        >
                          Trình duyệt của bạn không hỗ trợ video tag.
                        </video>
                      );
                    }

                    // Nếu là YouTube URL, dùng iframe
                    if (currentLessonData.videoUrl &&
                      (currentLessonData.videoUrl.includes('youtube.com') ||
                        currentLessonData.videoUrl.includes('youtu.be'))) {
                      const embedUrl = convertYouTubeUrl(currentLessonData.videoUrl);
                      console.log('Rendering as YouTube iframe:', embedUrl);
                      return (
                        <iframe
                          key={embedUrl}
                          src={embedUrl}
                          className="border-0"
                          style={{
                            width: '100%',
                            height: '100%'
                          }}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          title={currentLessonData.title}
                        />
                      );
                    }

                    // Fallback: thử render như video element
                    console.log('Fallback: Rendering as video element:', videoSource);
                    return (
                      <video
                        key={videoSource}
                        src={videoSource}
                        controls
                        controlsList="download"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          backgroundColor: '#000'
                        }}
                      >
                        Trình duyệt của bạn không hỗ trợ video tag.
                      </video>
                    );
                  })()}
                </div>

                {/* Nội dung bài học bên dưới video (nếu có) - Tiếp tục cuộn */}
                {(currentLessonData.content || currentLessonData.description || (currentLessonData.questions && currentLessonData.questions.length > 0)) && (
                  <div className="bg-white">
                    <div className="container-fluid py-3 py-md-4">
                      <div className="row justify-content-center">
                        <div className="col-12 col-lg-8">
                          {(currentLessonData.content || currentLessonData.description) && (
                            <>
                              <h5 className="mb-3 fw-bold">Nội dung bài học</h5>
                              {currentLessonData.content ? (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: formatLessonContent(currentLessonData.content)
                                  }}
                                  style={{
                                    lineHeight: '1.8',
                                    fontSize: '16px',
                                    color: '#333'
                                  }}
                                />
                              ) : currentLessonData.description ? (
                                <div
                                  style={{
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.8',
                                    fontSize: '16px',
                                    color: '#333'
                                  }}
                                >
                                  {currentLessonData.description}
                                </div>
                              ) : null}
                            </>
                          )}

                          {/* Hiển thị tài liệu bài học nếu có (chỉ khi không phải video) */}
                          {currentLessonData.contentUrl && !hasVideoFromContentUrl() && (
                            <div className="mt-4 p-3 border rounded bg-light">
                              <h6 className="mb-2 fw-bold">Tài liệu bài học</h6>
                              <a
                                href={currentLessonData.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                download
                              >
                                📄 Tải tài liệu về
                              </a>
                            </div>
                          )}

                          {/* Hiển thị câu hỏi nếu có */}
                          {currentLessonData.questions && currentLessonData.questions.length > 0 && (
                            <div className={`${(currentLessonData.content || currentLessonData.description) ? 'mt-5 pt-4 border-top' : 'mt-0'}`} style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                              <h5 className="mb-4 fw-bold" style={{ color: '#000' }}>Câu hỏi bài học ({currentLessonData.questions.length})</h5>
                              {currentLessonData.questions.map((question, qIndex) => {
                                console.log('🔍 Rendering question:', question);
                                console.log('🔍 Question options:', question.options);
                                if (!question.options || question.options.length === 0) {
                                  console.warn('⚠️ Question has no options:', question);
                                }
                                return (
                                  <div key={question.questionId || qIndex} className="mb-4 p-4 border rounded bg-light" style={{ display: 'block', visibility: 'visible' }}>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                      <h6 className="mb-0 fw-bold">
                                        Câu {qIndex + 1}: {question.content}
                                      </h6>
                                      {question.marks && (
                                        <span className="badge bg-primary">Điểm: {question.marks}</span>
                                      )}
                                    </div>

                                    <div className="mb-3">
                                      {question.options && question.options.length > 0 ? question.options.map((option) => {
                                        const isSelected = selectedAnswers[question.questionId]?.includes(option.optionId) || false;
                                        const isCorrect = option.isCorrect;
                                        const showResult = showResults[question.questionId];

                                        let optionClass = "form-check p-2 mb-2 border rounded";
                                        if (showResult) {
                                          if (isCorrect) {
                                            optionClass += " bg-success bg-opacity-10 border-success";
                                          } else if (isSelected && !isCorrect) {
                                            optionClass += " bg-danger bg-opacity-10 border-danger";
                                          }
                                        } else if (isSelected) {
                                          optionClass += " bg-primary bg-opacity-10 border-primary";
                                        }

                                        return (
                                          <label
                                            key={option.optionId}
                                            className={optionClass}
                                            style={{ cursor: showResult ? 'default' : 'pointer' }}
                                          >
                                            <input
                                              type={question.questionType === 'MultipleChoice' ? 'radio' : 'checkbox'}
                                              name={`question-${question.questionId}`}
                                              checked={isSelected}
                                              onChange={() => {
                                                if (!showResult) {
                                                  if (question.questionType === 'MultipleChoice') {
                                                    setSelectedAnswers({
                                                      ...selectedAnswers,
                                                      [question.questionId]: [option.optionId]
                                                    });
                                                  } else {
                                                    const current = selectedAnswers[question.questionId] || [];
                                                    if (current.includes(option.optionId)) {
                                                      setSelectedAnswers({
                                                        ...selectedAnswers,
                                                        [question.questionId]: current.filter(id => id !== option.optionId)
                                                      });
                                                    } else {
                                                      setSelectedAnswers({
                                                        ...selectedAnswers,
                                                        [question.questionId]: [...current, option.optionId]
                                                      });
                                                    }
                                                  }
                                                }
                                              }}
                                              disabled={showResult}
                                              className="form-check-input me-2"
                                            />
                                            <span className="form-check-label">
                                              {option.content}
                                              {showResult && isCorrect && (
                                                <span className="ms-2 text-success fw-bold">✓ Đúng</span>
                                              )}
                                              {showResult && isSelected && !isCorrect && (
                                                <span className="ms-2 text-danger fw-bold">✗ Sai</span>
                                              )}
                                            </span>
                                          </label>
                                        );
                                      }) : (
                                        <div className="text-muted p-2">Chưa có đáp án cho câu hỏi này.</div>
                                      )}
                                    </div>

                                    {!showResults[question.questionId] ? (
                                      <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                          setShowResults({
                                            ...showResults,
                                            [question.questionId]: true
                                          });
                                        }}
                                        disabled={!selectedAnswers[question.questionId] || selectedAnswers[question.questionId].length === 0}
                                      >
                                        Xem kết quả
                                      </button>
                                    ) : (
                                      <div className="alert alert-info mb-0">
                                        <strong>Kết quả:</strong> {
                                          selectedAnswers[question.questionId]?.every(optId => {
                                            const opt = question.options.find(o => o.optionId === optId);
                                            return opt?.isCorrect;
                                          }) &&
                                            question.options.filter(o => o.isCorrect).every(opt =>
                                              selectedAnswers[question.questionId]?.includes(opt.optionId)
                                            )
                                            ? 'Bạn đã trả lời đúng!'
                                            : 'Bạn đã trả lời sai. Hãy xem lại đáp án đúng được đánh dấu màu xanh.'
                                        }
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : hasVideoFromContentUrl() ? (
              // Nếu contentUrl là video, hiển thị video player ở trên và nội dung ở dưới
              <div className="d-flex flex-column w-100">
                {/* Video Player từ contentUrl */}
                <div
                  className="bg-dark flex-shrink-0"
                  style={{
                    width: '100%',
                    height: (currentLessonData.content || currentLessonData.description) ? '85vh' : 'calc(100vh - 150px)',
                    minHeight: (currentLessonData.content || currentLessonData.description) ? '700px' : 'calc(100vh - 150px)',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'stretch'
                  }}
                >
                  <video
                    key={currentLessonData.contentUrl}
                    src={currentLessonData.contentUrl}
                    controls
                    controlsList="download"
                    className="w-100 h-100"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'fill', // Fill to stretch video to fill entire container
                      flex: '1 1 auto',
                      display: 'block'
                    }}
                  >
                    Trình duyệt của bạn không hỗ trợ video tag.
                  </video>
                </div>

                {/* Nội dung bài học bên dưới video (nếu có) */}
                {(currentLessonData.content || currentLessonData.description || (currentLessonData.questions && currentLessonData.questions.length > 0)) && (
                  <div className="bg-white">
                    <div className="container-fluid py-3 py-md-4">
                      <div className="row justify-content-center">
                        <div className="col-12 col-lg-8">
                          {(currentLessonData.content || currentLessonData.description) && (
                            <>
                              <h5 className="mb-3 fw-bold">Nội dung bài học</h5>
                              {currentLessonData.content ? (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: formatLessonContent(currentLessonData.content)
                                  }}
                                  style={{
                                    lineHeight: '1.8',
                                    fontSize: '16px',
                                    color: '#333'
                                  }}
                                />
                              ) : currentLessonData.description ? (
                                <div
                                  style={{
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.8',
                                    fontSize: '16px',
                                    color: '#333'
                                  }}
                                >
                                  {currentLessonData.description}
                                </div>
                              ) : null}
                            </>
                          )}

                          {/* Hiển thị câu hỏi nếu có */}
                          {(() => {
                            const hasQuestions = currentLessonData.questions && currentLessonData.questions.length > 0;
                            console.log('🔍 [Questions Section] Should render?', hasQuestions);
                            console.log('🔍 [Questions Section] Questions:', currentLessonData.questions);
                            return hasQuestions;
                          })() && (
                              <div className={`${(currentLessonData.content || currentLessonData.description) ? 'mt-5 pt-4 border-top' : 'mt-0'}`} style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                                <h5 className="mb-4 fw-bold" style={{ color: '#000' }}>Câu hỏi bài học ({currentLessonData.questions.length})</h5>
                                {currentLessonData.questions.map((question, qIndex) => {
                                  console.log('🔍 Rendering question:', question);
                                  console.log('🔍 Question options:', question.options);
                                  if (!question.options || question.options.length === 0) {
                                    console.warn('⚠️ Question has no options:', question);
                                  }
                                  return (
                                    <div key={question.questionId || qIndex} className="mb-4 p-4 border rounded bg-light" style={{ display: 'block', visibility: 'visible' }}>
                                      <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h6 className="mb-0 fw-bold">
                                          Câu {qIndex + 1}: {question.content}
                                        </h6>
                                        {question.marks && (
                                          <span className="badge bg-primary">Điểm: {question.marks}</span>
                                        )}
                                      </div>

                                      <div className="mb-3">
                                        {question.options && question.options.length > 0 ? question.options.map((option) => {
                                          const isSelected = selectedAnswers[question.questionId]?.includes(option.optionId) || false;
                                          const isCorrect = option.isCorrect;
                                          const showResult = showResults[question.questionId];

                                          let optionClass = "form-check p-2 mb-2 border rounded";
                                          if (showResult) {
                                            if (isCorrect) {
                                              optionClass += " bg-success bg-opacity-10 border-success";
                                            } else if (isSelected && !isCorrect) {
                                              optionClass += " bg-danger bg-opacity-10 border-danger";
                                            }
                                          } else if (isSelected) {
                                            optionClass += " bg-primary bg-opacity-10 border-primary";
                                          }

                                          return (
                                            <label
                                              key={option.optionId}
                                              className={optionClass}
                                              style={{ cursor: showResult ? 'default' : 'pointer' }}
                                            >
                                              <input
                                                type={question.questionType === 'MultipleChoice' ? 'radio' : 'checkbox'}
                                                name={`question-${question.questionId}`}
                                                checked={isSelected}
                                                onChange={() => {
                                                  if (!showResult) {
                                                    if (question.questionType === 'MultipleChoice') {
                                                      setSelectedAnswers({
                                                        ...selectedAnswers,
                                                        [question.questionId]: [option.optionId]
                                                      });
                                                    } else {
                                                      const current = selectedAnswers[question.questionId] || [];
                                                      if (current.includes(option.optionId)) {
                                                        setSelectedAnswers({
                                                          ...selectedAnswers,
                                                          [question.questionId]: current.filter(id => id !== option.optionId)
                                                        });
                                                      } else {
                                                        setSelectedAnswers({
                                                          ...selectedAnswers,
                                                          [question.questionId]: [...current, option.optionId]
                                                        });
                                                      }
                                                    }
                                                  }
                                                }}
                                                disabled={showResult}
                                                className="form-check-input me-2"
                                              />
                                              <span className="form-check-label">
                                                {option.content}
                                                {showResult && isCorrect && (
                                                  <span className="ms-2 text-success fw-bold">✓ Đúng</span>
                                                )}
                                                {showResult && isSelected && !isCorrect && (
                                                  <span className="ms-2 text-danger fw-bold">✗ Sai</span>
                                                )}
                                              </span>
                                            </label>
                                          );
                                        }) : (
                                          <div className="text-muted p-2">Chưa có đáp án cho câu hỏi này.</div>
                                        )}
                                      </div>

                                      {!showResults[question.questionId] ? (
                                        <button
                                          className="btn btn-primary btn-sm"
                                          onClick={() => {
                                            setShowResults({
                                              ...showResults,
                                              [question.questionId]: true
                                            });
                                          }}
                                          disabled={!selectedAnswers[question.questionId] || selectedAnswers[question.questionId].length === 0}
                                        >
                                          Xem kết quả
                                        </button>
                                      ) : (
                                        <div className="alert alert-info mb-0">
                                          <strong>Kết quả:</strong> {
                                            selectedAnswers[question.questionId]?.every(optId => {
                                              const opt = question.options.find(o => o.optionId === optId);
                                              return opt?.isCorrect;
                                            }) &&
                                              question.options.filter(o => o.isCorrect).every(opt =>
                                                selectedAnswers[question.questionId]?.includes(opt.optionId)
                                              )
                                              ? 'Bạn đã trả lời đúng!'
                                              : 'Bạn đã trả lời sai. Hãy xem lại đáp án đúng được đánh dấu màu xanh.'
                                          }
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-100 bg-white p-3 p-md-4 overflow-auto">
                <div className="container-fluid">
                  <div className="row justify-content-center">
                    <div className="col-12 col-lg-8">
                      {/* Hiển thị nội dung bài học */}
                      {currentLessonData.content ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: formatLessonContent(currentLessonData.content)
                          }}
                          style={{
                            lineHeight: '1.8',
                            fontSize: '16px',
                            color: '#333'
                          }}
                        />
                      ) : currentLessonData.description ? (
                        <div
                          style={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.8',
                            fontSize: '16px',
                            color: '#333'
                          }}
                        >
                          {currentLessonData.description}
                        </div>
                      ) : currentLessonData.contentUrl ? (
                        <div className="text-center p-4">
                          <p className="mb-3">Tài liệu bài học:</p>
                          <a
                            href={currentLessonData.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            download
                          >
                            📄 Tải tài liệu về
                          </a>
                        </div>
                      ) : (
                        !currentLessonData.questions || currentLessonData.questions.length === 0 ? (
                          <div className="text-center p-4 text-muted">
                            <p>Chưa có nội dung cho bài học này.</p>
                          </div>
                        ) : null
                      )}

                      {/* Hiển thị tài liệu bài học nếu có (khi đã có content hoặc description và không phải video) */}
                      {currentLessonData.contentUrl && (currentLessonData.content || currentLessonData.description) && !hasVideoFromContentUrl() && (
                        <div className="mt-4 p-3 border rounded bg-light">
                          <h6 className="mb-2 fw-bold">Tài liệu bài học</h6>
                          <a
                            href={currentLessonData.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            download
                          >
                            📄 Tải tài liệu về
                          </a>
                        </div>
                      )}

                      {/* Hiển thị câu hỏi nếu có */}
                      {currentLessonData.questions && currentLessonData.questions.length > 0 && (
                        <div className={`mt-5 ${(currentLessonData.content || currentLessonData.description) ? 'pt-4 border-top' : ''}`}>
                          <h5 className="mb-4 fw-bold">Câu hỏi bài học</h5>
                          {currentLessonData.questions.map((question, qIndex) => (
                            <div key={question.questionId} className="mb-4 p-4 border rounded bg-light">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <h6 className="mb-0 fw-bold">
                                  Câu {qIndex + 1}: {question.content}
                                </h6>
                                {question.marks && (
                                  <span className="badge bg-primary">Điểm: {question.marks}</span>
                                )}
                              </div>

                              <div className="mb-3">
                                {question.options && question.options.length > 0 ? question.options.map((option) => {
                                  const isSelected = selectedAnswers[question.questionId]?.includes(option.optionId) || false;
                                  const isCorrect = option.isCorrect;
                                  const showResult = showResults[question.questionId];

                                  let optionClass = "form-check p-2 mb-2 border rounded";
                                  if (showResult) {
                                    if (isCorrect) {
                                      optionClass += " bg-success bg-opacity-10 border-success";
                                    } else if (isSelected && !isCorrect) {
                                      optionClass += " bg-danger bg-opacity-10 border-danger";
                                    }
                                  } else if (isSelected) {
                                    optionClass += " bg-primary bg-opacity-10 border-primary";
                                  }

                                  return (
                                    <label
                                      key={option.optionId}
                                      className={optionClass}
                                      style={{ cursor: showResult ? 'default' : 'pointer' }}
                                    >
                                      <input
                                        type={question.questionType === 'MultipleChoice' ? 'radio' : 'checkbox'}
                                        name={`question-${question.questionId}`}
                                        checked={isSelected}
                                        onChange={() => {
                                          if (!showResult) {
                                            if (question.questionType === 'MultipleChoice') {
                                              setSelectedAnswers({
                                                ...selectedAnswers,
                                                [question.questionId]: [option.optionId]
                                              });
                                            } else {
                                              const current = selectedAnswers[question.questionId] || [];
                                              if (current.includes(option.optionId)) {
                                                setSelectedAnswers({
                                                  ...selectedAnswers,
                                                  [question.questionId]: current.filter(id => id !== option.optionId)
                                                });
                                              } else {
                                                setSelectedAnswers({
                                                  ...selectedAnswers,
                                                  [question.questionId]: [...current, option.optionId]
                                                });
                                              }
                                            }
                                          }
                                        }}
                                        disabled={showResult}
                                        className="form-check-input me-2"
                                      />
                                      <span className="form-check-label">
                                        {option.content}
                                        {showResult && isCorrect && (
                                          <span className="ms-2 text-success fw-bold">✓ Đúng</span>
                                        )}
                                        {showResult && isSelected && !isCorrect && (
                                          <span className="ms-2 text-danger fw-bold">✗ Sai</span>
                                        )}
                                      </span>
                                    </label>
                                  );
                                }) : (
                                  <div className="text-muted p-2">Chưa có đáp án cho câu hỏi này.</div>
                                )}
                              </div>

                              {!showResults[question.questionId] ? (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    setShowResults({
                                      ...showResults,
                                      [question.questionId]: true
                                    });
                                  }}
                                  disabled={!selectedAnswers[question.questionId] || selectedAnswers[question.questionId].length === 0}
                                >
                                  Xem kết quả
                                </button>
                              ) : (
                                <div className="alert alert-info mb-0">
                                  <strong>Kết quả:</strong> {
                                    selectedAnswers[question.questionId]?.every(optId => {
                                      const opt = question.options.find(o => o.optionId === optId);
                                      return opt?.isCorrect;
                                    }) &&
                                      question.options.filter(o => o.isCorrect).every(opt =>
                                        selectedAnswers[question.questionId]?.includes(opt.optionId)
                                      )
                                      ? 'Bạn đã trả lời đúng!'
                                      : 'Bạn đã trả lời sai. Hãy xem lại đáp án đúng được đánh dấu màu xanh.'
                                  }
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
                <small className="text-muted">
                  {currentLessonData.type === 'video'
                    ? `Video • ${formatDuration(currentLessonData.duration)}`
                    : 'Tài liệu học tập'
                  }
                </small>
              </div>

              <div className="study-nav-buttons d-flex flex-column flex-md-row gap-2">
                <button
                  className="btn btn-outline-light study-nav-btn flex-fill order-1 order-md-1"
                  disabled={currentLesson === 0}
                  onClick={() => handleLessonChange(currentLesson - 1)}
                >
                  ← Trước
                </button>

                <button
                  className="btn btn-success study-nav-btn flex-fill order-3 order-md-2"
                  onClick={handleLessonComplete}
                >
                  {currentLessonData.completed ? '✓ Hoàn thành' : '✓ Xong bài'}
                </button>

                <button
                  className="btn btn-outline-light study-nav-btn flex-fill order-2 order-md-3"
                  disabled={currentLesson === displayLessons.length - 1}
                  onClick={() => handleLessonChange(currentLesson + 1)}
                >
                  Tiếp →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Responsive */}
        <div className={`study-sidebar ${sidebarOpen ? 'sidebar-visible' : ''}`}
          style={{
            width: sidebarOpen ? '300px' : '0px'
          }}>
          {/* Tabs */}
          <div className="study-sidebar-tabs">
            <button
              className={`nav-link ${activeTab === 'playlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('playlist')}
            >
              📚 Bài học
            </button>
            <button
              className={`nav-link ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => setActiveTab('materials')}
            >
              📄 Tài liệu
            </button>
          </div>

          <div className="study-sidebar-content">
            {/* Playlist Tab */}
            {activeTab === 'playlist' && (
              <div className="playlist-tab pb-5">
                {loading ? (
                  <div className="text-center p-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="small text-muted mt-2">Đang tải danh sách bài học...</p>
                  </div>
                ) : displayLessons.length === 0 ? (
                  <div className="text-center p-3">
                    <p className="text-muted small">Chưa có bài học nào trong khóa học này.</p>
                  </div>
                ) : (
                  displayLessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`p-2 border rounded mb-2 cursor-pointer ${index === currentLesson ? 'bg-primary text-white' : 'bg-light'
                        }`}
                      onClick={() => {
                        // Kiểm tra học thử miễn phí: chỉ áp dụng cho khóa học có phí
                        // Chỉ cho phép lesson đầu tiên (index 0) nếu chưa enroll hoặc đang ở trial mode VÀ khóa học có phí
                        const isPaidCourse = course?.price && Number(course.price) > 0;
                        const shouldBlock = isPaidCourse && (isTrialMode || !isEnrolled) && index > 0;

                        if (shouldBlock) {
                          toast.error('Bạn cần đăng ký khóa học để tiếp tục học. Bài học đầu tiên là học thử miễn phí.');
                          navigate(`/study-detail/${courseId}`);
                          return;
                        }

                        handleLessonChange(index);
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
                  ))
                )}
              </div>
            )}



            {/* Materials Tab */}
            {activeTab === 'materials' && (
              <div className="materials-tab pb-5">
                {/* Course materials (from MaterialsService) */}
                {courseMaterials.length > 0 && (
                  <div>
                    <h6 className="mb-2 fs-6 fw-bold">Tài liệu khóa học</h6>
                    {courseMaterials.map((material: any, index: number) => (
                      <div key={`course-material-${index}`} className="d-flex align-items-center p-2 border rounded mb-2">
                        <div className="me-2" style={{ flexShrink: 0 }}>
                          {material.mediaType?.startsWith('video/') ? '🎥' :
                            material.mediaType?.includes('pdf') ? '📄' :
                              material.mediaType?.includes('zip') ? '📦' :
                                material.mediaType?.includes('doc') ? '📝' : '📎'}
                        </div>
                        <div className="flex-grow-1 overflow-hidden mx-1">
                          <div className="fw-medium small text-truncate" style={{ fontSize: '0.85rem' }}>
                            {material.title}
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {material.fileUrl ? 'Có sẵn' : 'Chưa có file'}
                          </small>
                        </div>
                        {material.fileUrl && (
                          <a
                            href={material.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm py-1 px-2"
                            style={{ flexShrink: 0, fontSize: '0.8rem' }}
                          >
                            Tải về
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {courseMaterials.length === 0 && (
                  <div className="text-center p-3">
                    <p className="text-muted small">Chưa có tài liệu nào cho khóa học này.</p>
                  </div>
                )}

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

// CSS is now imported from StudyLesson.css