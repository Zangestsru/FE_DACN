import { useMemo, useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { EyeIcon, ArrowUpIcon as RefreshIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { examFeedbackService, type ExamFeedback } from "../services/examFeedback.service";
import { courseFeedbackService, type CourseFeedback } from "../services/courseFeedback.service";
import authService from "../services/auth.service";
import { examsService } from "../services/exams.service";
import { coursesService } from "../services/courses.service";

// Helper function để lấy teacherId từ user hoặc token
const getTeacherId = (): number | null => {
  const currentUser = authService.getUser();
  
  // Thử lấy từ user object
  if (currentUser) {
    const userId = (currentUser as any).userId || currentUser.userId;
    if (userId) {
      return typeof userId === 'number' ? userId : parseInt(String(userId), 10);
    }
  }
  
  // Fallback: lấy từ JWT token
  const token = authService.getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId || payload.UserId || payload.sub || payload.user_id || payload.id;
      if (userId) {
        return typeof userId === 'number' ? userId : parseInt(String(userId), 10);
      }
    } catch (e) {
      console.error('Error decoding token:', e);
    }
  }
  
  return null;
};

export default function Feedback() {
  const [activeTab, setActiveTab] = useState<"course" | "exam">("exam"); // Default to exam feedback
  
  // Exam feedback state
  const [examFeedbacks, setExamFeedbacks] = useState<ExamFeedback[]>([]);
  const [examLoading, setExamLoading] = useState(true);
  const [examError, setExamError] = useState<string | null>(null);
  const [selectedExamFeedback, setSelectedExamFeedback] = useState<ExamFeedback | null>(null);
  const [isExamViewOpen, setIsExamViewOpen] = useState(false);
  
  // Course feedback state
  const [courseFeedbacks, setCourseFeedbacks] = useState<CourseFeedback[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [selectedCourseFeedback, setSelectedCourseFeedback] = useState<CourseFeedback | null>(null);
  const [isCourseViewOpen, setIsCourseViewOpen] = useState(false);
  
  // Exam feedback filters
  const [examSearchQuery, setExamSearchQuery] = useState("");
  const [examRatingFilter, setExamRatingFilter] = useState<number | "">("");

  // Course feedback filters
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [courseRatingFilter, setCourseRatingFilter] = useState<number | "">("");
  
  // Teacher's exam and course IDs (for filtering)
  const [teacherExamIds, setTeacherExamIds] = useState<number[]>([]);
  const [teacherCourseIds, setTeacherCourseIds] = useState<number[]>([]);
  const [teacherDataLoaded, setTeacherDataLoaded] = useState(false); // Flag để biết đã load xong chưa

  // Load teacher's exams and courses on mount
  useEffect(() => {
    const loadTeacherData = async () => {
      const teacherId = getTeacherId();
      console.log('Loading teacher data, teacherId:', teacherId);
      if (!teacherId) {
        console.error('No teacherId found');
        setTeacherDataLoaded(true); // Vẫn set flag để không bị block
        return;
      }

      try {
        // Load teacher's exams
        console.log('Fetching exams for teacherId:', teacherId);
        let examsData = await examsService.getExams({ teacherId, pageSize: 1000 });
        console.log('Exams data received:', examsData);
        console.log('Exams items:', examsData.items);
        console.log('Total exams:', examsData.total);
        
        // Nếu không có bài thi với teacherId filter, thử load tất cả và filter ở client-side
        if (!examsData.items || examsData.items.length === 0) {
          console.warn('No exams found with teacherId filter. Trying to load all exams and filter client-side...');
          const allExamsData = await examsService.getExams({ pageSize: 1000 });
          console.log('All exams (no filter):', allExamsData);
          console.log('All exams items:', allExamsData?.items);
          
          // Filter ở client-side dựa vào createdBy hoặc teacherId
          if (allExamsData && allExamsData.items && allExamsData.items.length > 0) {
            const filteredExams = allExamsData.items.filter(exam => {
              // Thử lấy từ createdBy trước (từ cột CreatedBy trong DB)
              const examCreatedBy = (exam as any).createdBy || (exam as any).CreatedBy;
              const examTeacherId = exam.teacherId || examCreatedBy;
              
              console.log(`Exam ${exam.id}: createdBy=${examCreatedBy}, teacherId=${exam.teacherId}, currentTeacherId=${teacherId}, match=${examCreatedBy === teacherId || examTeacherId === teacherId}`);
              
              // So sánh với teacherId hiện tại (dùng createdBy hoặc teacherId)
              return examCreatedBy === teacherId || examTeacherId === teacherId;
            });
            
            console.log('Filtered exams (client-side):', filteredExams);
            examsData = {
              ...allExamsData,
              items: filteredExams,
              total: filteredExams.length
            };
          }
        }
        
        const examIds = examsData.items.map(exam => exam.id);
        console.log('Mapped exam IDs:', examIds);
        setTeacherExamIds(examIds);
        console.log('Teacher exam IDs set:', examIds);

        // Load teacher's courses
        const coursesData = await coursesService.getCourses({ teacherId, pageSize: 1000 });
        const courseIds = coursesData.items.map(course => course.courseId);
        setTeacherCourseIds(courseIds);
        console.log('Teacher course IDs:', courseIds);
      } catch (err) {
        console.error('Error loading teacher data:', err);
      } finally {
        setTeacherDataLoaded(true); // Đánh dấu đã load xong
      }
    };

    loadTeacherData();
  }, []);

  // Load exam feedbacks when tab changes and teacher data is loaded
  useEffect(() => {
    if (activeTab === "exam" && teacherDataLoaded) {
      loadExamFeedbacks();
    }
  }, [activeTab, teacherDataLoaded]); // Chỉ load khi teacher data đã được load xong

  // Load course feedbacks when tab changes and teacher data is loaded
  useEffect(() => {
    if (activeTab === "course" && teacherDataLoaded) {
      loadCourseFeedbacks();
    }
  }, [activeTab, teacherDataLoaded]); // Chỉ load khi teacher data đã được load xong

  useEffect(() => {
    if (activeTab === "exam") {
      // Filter is handled by useMemo
    }
  }, [examSearchQuery, examRatingFilter]);

  useEffect(() => {
    if (activeTab === "course") {
      // Filter is handled by useMemo
    }
  }, [courseSearchQuery, courseRatingFilter]);

  const loadExamFeedbacks = async () => {
    try {
      setExamLoading(true);
      setExamError(null);
      const teacherId = getTeacherId();
      
      if (!teacherId) {
        setExamError('Không thể xác định thông tin giáo viên. Vui lòng đăng nhập lại.');
        setExamLoading(false);
        return;
      }

      // Sử dụng teacherExamIds đã được load từ useEffect đầu tiên
      const currentExamIds = teacherExamIds;

      // Load all exam feedbacks
      const allFeedbacks = await examFeedbackService.getAllExamFeedbacks();
      console.log('All exam feedbacks loaded:', allFeedbacks.length, allFeedbacks);
      console.log('Current exam IDs for filtering:', currentExamIds);
      
      // Nếu không có exam IDs, vẫn hiển thị empty array thay vì lọc
      if (currentExamIds.length === 0) {
        console.log('No exams found for this teacher, showing empty feedback list');
        setExamFeedbacks([]);
        setExamLoading(false);
        return;
      }
      
      // Filter: chỉ lấy feedback của bài thi do teacher này tạo
      const filtered = allFeedbacks.filter(fb => {
        const isTeacherExam = currentExamIds.includes(fb.examId);
        console.log(`Exam feedback ${fb.feedbackId}: examId=${fb.examId}, teacherExamIds=${JSON.stringify(currentExamIds)}, isTeacherExam=${isTeacherExam}`);
        return isTeacherExam;
      });
      
      console.log('Filtered exam feedbacks:', filtered.length, filtered);
      setExamFeedbacks(filtered);
    } catch (err) {
      setExamError(err instanceof Error ? err.message : 'Lỗi khi tải đánh giá bài thi');
      console.error('Error loading exam feedbacks:', err);
    } finally {
      setExamLoading(false);
    }
  };

  const loadCourseFeedbacks = async () => {
    try {
      setCourseLoading(true);
      setCourseError(null);
      const teacherId = getTeacherId();
      
      if (!teacherId) {
        setCourseError('Không thể xác định thông tin giáo viên. Vui lòng đăng nhập lại.');
        setCourseLoading(false);
        return;
      }

      // Đảm bảo teacherCourseIds đã được load
      if (teacherCourseIds.length === 0) {
        console.log('Teacher course IDs not loaded yet, loading courses first...');
        const coursesData = await coursesService.getCourses({ teacherId, pageSize: 1000 });
        const courseIds = coursesData.items.map(course => course.courseId);
        setTeacherCourseIds(courseIds);
        console.log('Teacher course IDs loaded:', courseIds);
      }

      // Load all course feedbacks
      console.log('Loading all course feedbacks...');
      const allFeedbacks = await courseFeedbackService.getAllCourseFeedbacks();
      console.log('All course feedbacks loaded:', allFeedbacks.length, allFeedbacks);
      
      // Filter: chỉ lấy feedback của khóa học do teacher này tạo
      const currentCourseIds = teacherCourseIds.length > 0 ? teacherCourseIds : 
        (await coursesService.getCourses({ teacherId, pageSize: 1000 })).items.map(c => c.courseId);
      
      const filtered = allFeedbacks.filter(fb => {
        const isTeacherCourse = currentCourseIds.includes(fb.courseId);
        console.log(`Course feedback ${fb.feedbackId}: courseId=${fb.courseId}, teacherCourseIds=${JSON.stringify(currentCourseIds)}, isTeacherCourse=${isTeacherCourse}`);
        return isTeacherCourse;
      });
      
      console.log('Filtered course feedbacks:', filtered.length, filtered);
      setCourseFeedbacks(filtered);
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : 'Lỗi khi tải đánh giá khóa học');
      console.error('Error loading course feedbacks:', err);
    } finally {
      setCourseLoading(false);
    }
  };

  const openExamView = (feedback: ExamFeedback) => {
    setSelectedExamFeedback(feedback);
    setIsExamViewOpen(true);
  };

  const openCourseView = (feedback: CourseFeedback) => {
    setSelectedCourseFeedback(feedback);
    setIsCourseViewOpen(true);
  };

  // Filter exam feedbacks
  const filteredExamFeedbacks = useMemo(() => {
    let filtered = examFeedbacks;
    
    // Chỉ hiển thị feedback của bài thi do teacher này tạo
    filtered = filtered.filter(fb => teacherExamIds.includes(fb.examId));
    
    if (examSearchQuery) {
      const query = examSearchQuery.toLowerCase();
      filtered = filtered.filter(fb => 
        (fb.userName?.toLowerCase().includes(query)) ||
        (fb.examTitle?.toLowerCase().includes(query)) ||
        (fb.comment?.toLowerCase().includes(query))
      );
    }
    
    if (examRatingFilter !== "") {
      filtered = filtered.filter(fb => fb.stars === examRatingFilter);
    }
    
    return filtered;
  }, [examFeedbacks, examSearchQuery, examRatingFilter, teacherExamIds]);

  // Filter course feedbacks
  const filteredCourseFeedbacks = useMemo(() => {
    let filtered = courseFeedbacks;
    
    // Chỉ hiển thị feedback của khóa học do teacher này tạo
    filtered = filtered.filter(fb => teacherCourseIds.includes(fb.courseId));
    
    if (courseSearchQuery) {
      const query = courseSearchQuery.toLowerCase();
      filtered = filtered.filter(fb => 
        (fb.userName?.toLowerCase().includes(query)) ||
        (fb.courseTitle?.toLowerCase().includes(query)) ||
        (fb.comment?.toLowerCase().includes(query))
      );
    }
    
    if (courseRatingFilter !== "") {
      filtered = filtered.filter(fb => fb.stars === courseRatingFilter);
    }
    
    return filtered;
  }, [courseFeedbacks, courseSearchQuery, courseRatingFilter, teacherCourseIds]);


  return (
    <>
      <PageMeta title="Quản Lý Feedback" description="Quản lý đánh giá bài thi và khóa học" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Feedback</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              startIcon={<RefreshIcon className="h-4 w-4" />}
              onClick={activeTab === "course" ? loadCourseFeedbacks : loadExamFeedbacks}
              disabled={activeTab === "exam" ? examLoading : courseLoading}
            >
              Làm mới
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("exam")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "exam"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Đánh giá bài thi ({examFeedbacks.length})
            </button>
            <button
              onClick={() => setActiveTab("course")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "course"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Đánh giá khóa học ({courseFeedbacks.length})
            </button>
          </nav>
        </div>

        {/* Exam Feedback Statistics */}
        {activeTab === "exam" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600">{examFeedbacks.length}</div>
              <div className="text-sm text-gray-500">Tổng đánh giá</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-600">
                {examFeedbacks.length > 0 
                  ? (examFeedbacks.reduce((sum, fb) => sum + fb.stars, 0) / examFeedbacks.length).toFixed(1)
                  : '0'}
              </div>
              <div className="text-sm text-gray-500">Đánh giá trung bình</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600">
                {examFeedbacks.filter(fb => fb.stars >= 4).length}
              </div>
              <div className="text-sm text-gray-500">Đánh giá tích cực (≥4 sao)</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600">
                {examFeedbacks.filter(fb => fb.stars <= 2).length}
              </div>
              <div className="text-sm text-gray-500">Đánh giá tiêu cực (≤2 sao)</div>
            </div>
          </div>
        )}

        {/* Course Feedback Statistics */}
        {activeTab === "course" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600">{courseFeedbacks.length}</div>
              <div className="text-sm text-gray-500">Tổng đánh giá</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-600">
                {courseFeedbacks.length > 0 
                  ? (courseFeedbacks.reduce((sum, fb) => sum + fb.stars, 0) / courseFeedbacks.length).toFixed(1)
                  : '0'}
              </div>
              <div className="text-sm text-gray-500">Đánh giá trung bình</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600">
                {courseFeedbacks.filter(fb => fb.stars >= 4).length}
              </div>
              <div className="text-sm text-gray-500">Đánh giá tích cực (≥4 sao)</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600">
                {courseFeedbacks.filter(fb => fb.stars <= 2).length}
          </div>
              <div className="text-sm text-gray-500">Đánh giá tiêu cực (≤2 sao)</div>
          </div>
          </div>
        )}

        {/* Error display */}
        {examError && activeTab === "exam" && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{examError}</p>
            <Button size="sm" variant="outline" onClick={() => setExamError(null)} className="mt-2">
              Đóng
            </Button>
          </div>
        )}

        {courseError && activeTab === "course" && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{courseError}</p>
            <Button size="sm" variant="outline" onClick={() => setCourseError(null)} className="mt-2">
              Đóng
            </Button>
          </div>
        )}

        {/* Filters - Exam Feedback */}
        {activeTab === "exam" && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={examSearchQuery}
              onChange={(e) => setExamSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, bài thi, comment..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
            />
            <select
              value={examRatingFilter}
              onChange={(e) => setExamRatingFilter(e.target.value ? parseInt(e.target.value) : "")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="">Tất cả số sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>
        )}

        {/* Filters - Course Feedback */}
        {activeTab === "course" && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, khóa học, comment..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
              value={courseRatingFilter}
              onChange={(e) => setCourseRatingFilter(e.target.value ? parseInt(e.target.value) : "")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
              <option value="">Tất cả số sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
          </select>
        </div>
        )}

        {/* Exam Feedback Table */}
        {activeTab === "exam" && (
          <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người đánh giá</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài thi</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số sao</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhận xét</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đánh giá</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examLoading ? (
                  <TableRow>
                    <TableCell className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        <span className="text-gray-500">Đang tải dữ liệu...</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                  </TableRow>
                ) : filteredExamFeedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-6 py-12 text-center text-gray-500">
                      {examFeedbacks.length === 0 ? "Chưa có đánh giá nào" : "Không tìm thấy kết quả nào"}
                    </TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                  </TableRow>
                ) : (
                  filteredExamFeedbacks.map((feedback) => (
                    <TableRow key={feedback.feedbackId} className="border-t border-gray-100 dark:border-gray-800">
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{feedback.userName || `User ${feedback.userId}`}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{feedback.examTitle || `Exam ${feedback.examId}`}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-lg">
                            {'★'.repeat(feedback.stars)}
                            {'☆'.repeat(5 - feedback.stars)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">({feedback.stars})</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 dark:text-white truncate">
                            {feedback.comment || <span className="text-gray-400">Không có nhận xét</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openExamView(feedback)}
                            title="Xem"
                            className="!p-2"
                          >
                            <EyeIcon className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Course Feedback Table */}
        {activeTab === "course" && (
          <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người đánh giá</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa học</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số sao</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhận xét</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đánh giá</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseLoading ? (
                  <TableRow>
                    <TableCell className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        <span className="text-gray-500">Đang tải dữ liệu...</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                  </TableRow>
                ) : filteredCourseFeedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-6 py-12 text-center text-gray-500">
                      {courseFeedbacks.length === 0 ? "Chưa có đánh giá nào" : "Không tìm thấy kết quả nào"}
                    </TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                    <TableCell><span className="hidden"></span></TableCell>
                  </TableRow>
                ) : (
                  filteredCourseFeedbacks.map((feedback) => (
                    <TableRow key={feedback.feedbackId} className="border-t border-gray-100 dark:border-gray-800">
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{feedback.userName || `User ${feedback.userId}`}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{feedback.courseTitle || `Course ${feedback.courseId}`}</div>
                      </TableCell>
                  <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-lg">
                            {'★'.repeat(feedback.stars)}
                            {'☆'.repeat(5 - feedback.stars)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">({feedback.stars})</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="max-w-xs">
                          <div className="text-sm text-gray-900 dark:text-white truncate">
                            {feedback.comment || <span className="text-gray-400">Không có nhận xét</span>}
                          </div>
                    </div>
                  </TableCell>
                      <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                            onClick={() => openCourseView(feedback)}
                        title="Xem"
                        className="!p-2"
                      >
                        <EyeIcon className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
        </div>
        )}
      </div>

      {/* Exam Feedback View Modal */}
      <Modal isOpen={isExamViewOpen} onClose={() => setIsExamViewOpen(false)} className="max-w-3xl p-6">
        {selectedExamFeedback && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Chi Tiết Đánh Giá Bài Thi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Người đánh giá:</span>
                  <div className="font-medium">{selectedExamFeedback.userName || `User ${selectedExamFeedback.userId}`}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Bài thi:</span>
                  <div className="font-medium">{selectedExamFeedback.examTitle || `Exam ${selectedExamFeedback.examId}`}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Số sao:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-500 text-2xl">
                      {'★'.repeat(selectedExamFeedback.stars)}
                      {'☆'.repeat(5 - selectedExamFeedback.stars)}
                    </span>
                    <span className="text-gray-600 font-medium">({selectedExamFeedback.stars}/5)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Ngày đánh giá:</span>
                  <div className="font-medium">{new Date(selectedExamFeedback.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">ID Đánh giá:</span>
                  <div className="font-medium">#{selectedExamFeedback.feedbackId}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">ID Bài thi:</span>
                  <div className="font-medium">#{selectedExamFeedback.examId}</div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-gray-600 text-sm">Nhận xét:</span>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {selectedExamFeedback.comment || <span className="text-gray-400 italic">Không có nhận xét</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsExamViewOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>


      {/* Course Feedback View Modal */}
      <Modal isOpen={isCourseViewOpen} onClose={() => setIsCourseViewOpen(false)} className="max-w-3xl p-6">
        {selectedCourseFeedback && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Chi Tiết Đánh Giá Khóa Học</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Người đánh giá:</span>
                  <div className="font-medium">{selectedCourseFeedback.userName || `User ${selectedCourseFeedback.userId}`}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Khóa học:</span>
                  <div className="font-medium">{selectedCourseFeedback.courseTitle || `Course ${selectedCourseFeedback.courseId}`}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Số sao:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-500 text-2xl">
                      {'★'.repeat(selectedCourseFeedback.stars)}
                      {'☆'.repeat(5 - selectedCourseFeedback.stars)}
                    </span>
                    <span className="text-gray-600 font-medium">({selectedCourseFeedback.stars}/5)</span>
                </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Ngày đánh giá:</span>
                  <div className="font-medium">{new Date(selectedCourseFeedback.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">ID Đánh giá:</span>
                  <div className="font-medium">#{selectedCourseFeedback.feedbackId}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">ID Khóa học:</span>
                  <div className="font-medium">#{selectedCourseFeedback.courseId}</div>
                </div>
              </div>
            </div>

              <div>
              <span className="text-gray-600 text-sm">Nhận xét:</span>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {selectedCourseFeedback.comment || <span className="text-gray-400 italic">Không có nhận xét</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={() => setIsCourseViewOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}


