import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { coursesService, type CourseListItemDto, type CreateCourseRequest, type UpdateCourseRequest, type PagedResponse } from "../services/courses.service";
import { subjectsService, type Subject } from "../services/subjects.service";
import { materialsService, type Material } from "../services/materials.service";
import { lessonsService, type Lesson, type CreateLessonRequest } from "../services/lessons.service";
import { questionsService, type QuestionBankResponse } from "../services/questions.service";
import authService from "../services/auth.service";
import { EyeIcon, PencilIcon, TrashBinIcon, PlusIcon } from "../icons";

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

export default function Courses() {
  const [paged, setPaged] = useState<PagedResponse<CourseListItemDto> | null>(null);
  const courses = paged?.items ?? [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<CourseListItemDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);

  // Dropdown data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Current teacher ID (from auth)
  const [currentTeacherId, setCurrentTeacherId] = useState<number | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateCourseRequest>({
    title: "",
    description: "",
    teacherId: undefined,
    subjectId: undefined,
    price: undefined,
    isFree: true,
    thumbnailUrl: "",
    durationMinutes: undefined,
    level: "",
    status: "Draft",
  });

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateCourseRequest>({
    title: "",
    description: "",
    teacherId: undefined,
    subjectId: undefined,
    price: undefined,
    isFree: undefined,
    thumbnailUrl: undefined,
    durationMinutes: undefined,
    level: undefined,
    status: undefined,
  });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Material form state
  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    orderIndex: undefined as number | undefined,
    files: [] as File[],
  });
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  // Course materials state (for detail view)
  const [courseMaterials, setCourseMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Course lessons state (for detail view)
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Lesson form state
  const [lessonForm, setLessonForm] = useState<CreateLessonRequest>({
    courseId: 0,
    title: "",
    description: "",
    content: "",
    type: "video",
    videoUrl: "",
    contentUrl: "",
    durationSeconds: undefined,
    orderIndex: undefined,
    isFree: true,
  });
  const [savingLesson, setSavingLesson] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  
  // Questions state
  const [availableQuestions, setAvailableQuestions] = useState<QuestionBankResponse[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  // Filters
  const [titleQuery, setTitleQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "Draft" | "Active" | "Inactive">("");
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(1);
  const [currentPageSize, setCurrentPageSize] = useState<number>(20);

  // Load current teacher ID and dropdown data from API
  useEffect(() => {
    const teacherId = getTeacherId();
    if (teacherId) {
      setCurrentTeacherId(teacherId);
    }
    loadDropdowns();
  }, []);

  useEffect(() => {
    loadCourses(currentPageIndex, currentPageSize);
  }, [currentPageIndex, currentPageSize]);

  const loadCourses = async (pageIndex = 1, pageSize = 20) => {
    try {
      setLoading(true);
      setError(null);
      
      // Lấy teacherId từ helper function
      const teacherId = getTeacherId();
      
      if (!teacherId) {
        console.error('Cannot determine teacherId');
        setError('Không thể xác định thông tin giáo viên. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      const searchQuery = titleQuery.trim() || undefined;
      
      // Chỉ lấy khóa học của giáo viên đang đăng nhập
      const data = await coursesService.getCourses({
        pageIndex,
        pageSize,
        teacherId: teacherId,
        search: searchQuery,
      });
      
      console.log('Courses data received:', data);
      console.log('Total courses:', data?.total);
      console.log('Courses items:', data?.items);
      
      // Nếu không có khóa học, thử load tất cả để kiểm tra và filter ở client-side
      if (!data || !data.items || data.items.length === 0) {
        console.warn('No courses found with teacherId filter. Trying to load all courses to debug...');
        const allData = await coursesService.getCourses({
          pageIndex,
          pageSize,
          search: searchQuery,
        });
        console.log('All courses (no filter):', allData);
        console.log('All courses items:', allData?.items);
        
        // Nếu có khóa học nhưng không match teacherId, filter ở client side
        if (allData && allData.items && allData.items.length > 0) {
          const filteredItems = allData.items.filter(course => {
            // Thử lấy từ createdBy trước (từ cột CreatedBy trong DB)
            // Nếu không có thì thử teacherId
            const courseCreatedBy = (course as any).createdBy || (course as any).CreatedBy;
            const courseTeacherId = course.teacherId || courseCreatedBy;
            
            console.log(`Course ${course.courseId}: createdBy=${courseCreatedBy}, teacherId=${course.teacherId}, currentTeacherId=${teacherId}, match=${courseCreatedBy === teacherId || course.teacherId === teacherId}`);
            
            // So sánh với teacherId hiện tại (dùng createdBy hoặc teacherId)
            return courseCreatedBy === teacherId || course.teacherId === teacherId;
          });
          
          console.log('Filtered courses (client-side):', filteredItems);
          
          setPaged({
            ...allData,
            items: filteredItems,
            total: filteredItems.length,
            totalPages: Math.ceil(filteredItems.length / pageSize)
          });
          return;
        }
      }
      
      setPaged(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu khóa học');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      // ✅ Only load subjects (no need to load teachers for teacher role)
      const subjectsData = await subjectsService.getSubjects();
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Error loading dropdowns:', err);
    }
  };

  // Handle image upload for create form
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File không được vượt quá 20MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await coursesService.uploadCourseImage(formData);
      setCreateForm({ ...createForm, thumbnailUrl: response.url });
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Lỗi khi upload ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image upload for edit form
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File không được vượt quá 20MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await coursesService.uploadCourseImage(formData);
      setEditForm({ ...editForm, thumbnailUrl: response.url });
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Lỗi khi upload ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!createForm.title.trim()) {
      setError('Vui lòng nhập tên khóa học');
      return;
    }

    // Validate required fields
    if (!createForm.subjectId) {
      setError('Vui lòng chọn môn học');
      return;
    }
    if (!createForm.isFree && (!createForm.price || createForm.price <= 0)) {
      setError('Vui lòng nhập giá khóa học');
      return;
    }

    try {
      setError(null);

      // Lấy teacherId từ helper function
      const teacherId = getTeacherId();
      if (!teacherId) {
        setError('Không thể xác định thông tin giáo viên. Vui lòng đăng nhập lại.');
        return;
      }

      // Gán teacherId vào course data
      const courseData: CreateCourseRequest = {
        ...createForm,
        teacherId: teacherId,
      };

      console.log('📤 Creating course with data:', courseData);
      await coursesService.createCourse(courseData);
      await loadCourses();
      setIsCreateOpen(false);
      setCreateForm({
        title: "",
        description: "",
        teacherId: undefined,
        subjectId: undefined,
        price: undefined,
        isFree: true,
        thumbnailUrl: "",
        durationMinutes: undefined,
        level: "",
        status: "Draft",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo khóa học');
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;
    if (!editForm.title?.trim() && !selectedCourse.title) {
      setError('Vui lòng nhập tên khóa học');
      return;
    }

    try {
      setError(null);
      await coursesService.updateCourse(selectedCourse.courseId, editForm);
      await loadCourses();
      setIsEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật khóa học');
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    try {
      setError(null);
      await coursesService.deleteCourse(selectedCourse.courseId);
      await loadCourses();
      setIsDeleteOpen(false);
      setSelectedCourse(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa khóa học');
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchTitle = !titleQuery || course.title.toLowerCase().includes(titleQuery.toLowerCase());
    const matchStatus = !statusFilter || course.status === statusFilter;
    return matchTitle && matchStatus;
  });

  const openDetail = async (course: CourseListItemDto) => {
    console.log('🔍 Opening detail for course:', course.courseId, course.title);
    setSelectedCourse(course);
    setIsDetailOpen(true);
    // Load materials and lessons for this course
    try {
      await Promise.all([
        loadCourseMaterials(course.courseId),
        loadCourseLessons(course.courseId)
      ]);
      console.log('✅ Materials and lessons loaded for course:', course.courseId);
    } catch (err) {
      console.error('❌ Error loading course details:', err);
    }
  };

  // Function to load course materials (reusable)
  const loadCourseMaterials = async (courseId: number) => {
    console.log('🔄 Loading materials for course:', courseId);
    setLoadingMaterials(true);
    try {
      const materials = await materialsService.getMaterialsByCourseId(courseId);
      console.log('📚 Loaded materials for course:', courseId, materials);
      console.log('📚 Materials count:', materials?.length || 0);
      setCourseMaterials(materials || []);
    } catch (err) {
      console.error('❌ Error loading course materials:', err);
      setCourseMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Function to load course lessons (reusable)
  const loadCourseLessons = async (courseId: number) => {
    setLoadingLessons(true);
    try {
      const lessons = await lessonsService.getLessonsByCourseId(courseId);
      console.log('📖 Loaded lessons for course:', courseId, lessons);
      setCourseLessons(lessons);
    } catch (err) {
      console.error('Error loading course lessons:', err);
      setCourseLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const openEdit = (course: CourseListItemDto) => {
    setSelectedCourse(course);
    setEditForm({
      title: course.title,
      description: course.description || "",
      teacherId: course.teacherId,
      subjectId: course.subjectId,
      price: course.price,
      isFree: course.isFree,
      thumbnailUrl: course.thumbnailUrl,
      durationMinutes: course.durationMinutes,
      level: course.level || "",
      status: course.status,
    });
    setIsEditOpen(true);
  };

  const openDelete = (course: CourseListItemDto) => {
    setSelectedCourse(course);
    setIsDeleteOpen(true);
  };

  const openAddMaterial = (course: CourseListItemDto) => {
    setSelectedCourse(course);
    setMaterialForm({
      title: "",
      description: "",
      orderIndex: undefined,
      files: [],
    });
    setIsAddMaterialOpen(true);
  };

  const openAddLesson = async (course: CourseListItemDto) => {
    setSelectedCourse(course);
    setLessonForm({
      courseId: course.courseId,
      title: "",
      description: "",
      content: "",
      type: "video",
      videoUrl: "",
      contentUrl: "",
      durationSeconds: undefined,
      orderIndex: undefined,
      isFree: true,
    });
    setSelectedQuestionIds([]);
    setIsAddLessonOpen(true);
    // Load materials for this course to show in dropdown
    await loadCourseMaterials(course.courseId);
    // Load questions from question bank
    await loadQuestions();
  };

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const response = await questionsService.getQuestions({ pageSize: 100 });
      setAvailableQuestions(response.questions || []);
    } catch (err) {
      console.error('Error loading questions:', err);
      setAvailableQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleMaterialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMaterialForm({ ...materialForm, files });
  };

  const handleAddMaterial = async () => {
    if (!selectedCourse || materialForm.files.length === 0) {
      alert("Vui lòng chọn ít nhất một tệp");
      return;
    }

    try {
      setUploadingMaterial(true);
      setError(null);

      const formData = new FormData();
      formData.append("courseId", String(selectedCourse.courseId));
      if (materialForm.title) formData.append("title", materialForm.title);
      if (materialForm.description) formData.append("description", materialForm.description);
      formData.append("isPaid", "false"); // Tài liệu luôn miễn phí vì đã mua khóa học
      if (materialForm.orderIndex !== undefined) formData.append("orderIndex", String(materialForm.orderIndex));
      
      // Append all files
      materialForm.files.forEach((file) => {
        formData.append("files", file);
      });

      const result = await materialsService.createMaterial(formData);
      console.log("✅ Material created:", result);
      alert(`Thêm tài liệu thành công! Đã tạo ${result.length} tài liệu.`);
      
      // Reload materials if detail modal or add lesson modal is open for the same course
      if (selectedCourse && selectedCourse.courseId) {
        await loadCourseMaterials(selectedCourse.courseId);
      }
      
      setIsAddMaterialOpen(false);
      // Don't clear selectedCourse if detail modal is still open
      if (!isDetailOpen) {
        setSelectedCourse(null);
      }
      setMaterialForm({
        title: "",
        description: "",
        orderIndex: undefined,
        files: [],
      });
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || err?.response?.data?.error || "Lỗi khi thêm tài liệu";
      setError(errorMessage);
      console.error("❌ Error adding material:", err);
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleAddLesson = async () => {
    if (!selectedCourse || !lessonForm.title.trim()) {
      alert("Vui lòng nhập tiêu đề bài học");
      return;
    }

    try {
      setSavingLesson(true);
      setError(null);

      // Include selected question IDs in the request
      // Bài học luôn miễn phí vì đã mua khóa học
      const lessonData: CreateLessonRequest & { questionIds?: number[] } = {
        ...lessonForm,
        isFree: true, // Luôn set là miễn phí
        ...(selectedQuestionIds.length > 0 && { questionIds: selectedQuestionIds })
      };

      const result = await lessonsService.createLesson(lessonData);
      console.log("✅ Lesson created:", result);
      alert("Thêm bài học thành công!");
      
      // Reload lessons if detail modal is open
      if (isDetailOpen && selectedCourse) {
        await loadCourseLessons(selectedCourse.courseId);
      }
      
      setIsAddLessonOpen(false);
      if (!isDetailOpen) {
        setSelectedCourse(null);
      }
      setLessonForm({
        courseId: selectedCourse?.courseId || 0,
        title: "",
        description: "",
        content: "",
        type: "video",
        videoUrl: "",
        contentUrl: "",
        durationSeconds: undefined,
        orderIndex: undefined,
        isFree: true,
      });
      setSelectedQuestionIds([]);
      setSelectedMaterialId(null);
    } catch (err: any) {
      const errorMessage = err?.message || "Lỗi khi thêm bài học";
      setError(errorMessage);
      console.error("❌ Error adding lesson:", err);
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setSavingLesson(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} giờ ${mins > 0 ? `${mins} phút` : ''}`;
    }
    return `${mins} phút`;
  };

  return (
    <>
      <PageMeta title="Quản Lý Khóa Học" description="Quản lý khóa học, bài học và tài liệu" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Khóa Học</h1>
          <Button onClick={() => setIsCreateOpen(true)} startIcon={<PlusIcon className="h-4 w-4 fill-current" />}>
            Tạo Khóa Học Mới
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{paged?.total ?? 0}</div>
            <div className="text-sm text-gray-500">Tổng khóa học</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(c => c.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-500">Đang hoạt động</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-orange-600">
              {courses.filter(c => c.isFree).length}
            </div>
            <div className="text-sm text-gray-500">Khóa học miễn phí</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={titleQuery}
            onChange={(e) => {
              setTitleQuery(e.target.value);
              if (e.target.value.trim() === '') {
                loadCourses(currentPageIndex, currentPageSize);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                loadCourses(1, currentPageSize);
              }
            }}
            placeholder="Tìm kiếm theo tiêu đề"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Draft">Bản nháp</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Inactive">Không hoạt động</option>
          </select>
          <Button onClick={() => loadCourses(1, currentPageSize)} variant="outline">
            Tìm kiếm
          </Button>
        </div>

        {/* Pagination controls */}
        {paged && paged.totalPages > 1 && (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Trang {paged.pageIndex} / {paged.totalPages} ({paged.total} khóa học)
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPageIndex(p => Math.max(1, p - 1))}
                disabled={!paged.hasPreviousPage}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPageIndex(p => Math.min(paged.totalPages, p + 1))}
                disabled={!paged.hasNextPage}
              >
                Sau
              </Button>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={() => loadCourses(currentPageIndex, currentPageSize)} className="mt-2">
              Thử lại
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giáo viên</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Môn học</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời lượng</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="px-6 py-8 text-center text-gray-500">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell className="px-6 py-8 text-center text-gray-500">
                    Không có khóa học nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => (
                  <TableRow key={course.courseId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{course.title}</div>
                      {course.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">{course.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {course.teacherName || 'N/A'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {course.subjectName || 'N/A'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm">
                      <span className={course.isFree ? 'text-green-600' : 'text-blue-600'}>
                        {formatPrice(course.price)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDuration(course.durationMinutes)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${course.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          course.status === 'Draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {course.status || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openDetail(course)}
                          title="Xem"
                          className="!p-2"
                        >
                          <EyeIcon className="h-4 w-4 fill-current" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEdit(course)}
                          title="Sửa"
                          className="!p-2"
                        >
                          <PencilIcon className="h-4 w-4 fill-current" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openAddMaterial(course)}
                          title="Thêm tài liệu"
                          className="!p-2"
                        >
                          <PlusIcon className="h-4 w-4 fill-current" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openAddLesson(course)}
                          title="Thêm bài học"
                          className="!p-2"
                        >
                          <PlusIcon className="h-4 w-4 fill-current" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="!bg-red-500 hover:!bg-red-600 !p-2" 
                          onClick={() => openDelete(course)}
                          title="Xóa"
                        >
                          <TrashBinIcon className="h-4 w-4 fill-white" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          className="max-w-2xl w-full mx-4 my-4"
        >
          <div className="max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 pb-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Tạo Khóa Học Mới</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="Nhập tên khóa học"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea
                value={createForm.description || ''}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                rows={3}
                placeholder="Nhập mô tả khóa học"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* ✅ Teacher field removed - automatically set to current teacher */}

              <div>
                <label className="block text-sm font-medium mb-1">Môn học</label>
                <select
                  value={createForm.subjectId || ''}
                  onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((s) => (
                    <option key={s.subjectId} value={s.subjectId}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Miễn phí</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createForm.isFree}
                    onChange={(e) => setCreateForm({ ...createForm, isFree: e.target.checked, price: e.target.checked ? undefined : createForm.price })}
                    className="rounded"
                  />
                  <span className="text-sm">Khóa học miễn phí</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Giá (VND) {!createForm.isFree && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  value={createForm.price || ''}
                  onChange={(e) => setCreateForm({ ...createForm, price: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  placeholder={createForm.isFree ? "Miễn phí" : "Nhập giá (VND)"}
                  min="0"
                  disabled={createForm.isFree}
                />
                {createForm.isFree && (
                  <p className="text-xs text-gray-500 mt-1">Khóa học miễn phí không cần nhập giá</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Thời lượng (phút)</label>
                <input
                  type="number"
                  value={createForm.durationMinutes || ''}
                  onChange={(e) => setCreateForm({ ...createForm, durationMinutes: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="Ví dụ: 120"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cấp độ</label>
                <select
                  value={createForm.level || ''}
                  onChange={(e) => setCreateForm({ ...createForm, level: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="">Chọn cấp độ</option>
                  <option value="Beginner">Cơ bản</option>
                  <option value="Intermediate">Trung cấp</option>
                  <option value="Advanced">Nâng cao</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ảnh bìa</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="text-sm text-gray-500 mt-1">Đang upload...</p>}
              {createForm.thumbnailUrl && (
                <img src={createForm.thumbnailUrl} alt="Thumbnail" className="mt-2 w-32 h-32 object-cover rounded" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                value={createForm.status || 'Draft'}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="Draft">Bản nháp</option>
                <option value="Active">Đang hoạt động</option>
                <option value="Inactive">Không hoạt động</option>
              </select>
            </div>

              </div>
            </div>
            <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateCourse} disabled={uploadingImage}>
                  Tạo khóa học
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          className="max-w-2xl w-full mx-4 my-4"
        >
          <div className="max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 pb-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Sửa Khóa Học</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                    placeholder="Nhập tên khóa học"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mô tả</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                    rows={3}
                    placeholder="Nhập mô tả khóa học"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
              {/* ✅ Teacher field removed - cannot change teacher for existing course */}

              <div>
                <label className="block text-sm font-medium mb-1">Môn học</label>
                <select
                  value={editForm.subjectId || ''}
                  onChange={(e) => setEditForm({ ...editForm, subjectId: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((s) => (
                    <option key={s.subjectId} value={s.subjectId}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Miễn phí</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.isFree ?? selectedCourse?.isFree ?? false}
                    onChange={(e) => setEditForm({ ...editForm, isFree: e.target.checked, price: e.target.checked ? undefined : editForm.price })}
                    className="rounded"
                  />
                  <span className="text-sm">Khóa học miễn phí</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Giá (VND) {!(editForm.isFree ?? selectedCourse?.isFree ?? false) && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  value={editForm.price || ''}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  placeholder={(editForm.isFree ?? selectedCourse?.isFree ?? false) ? "Miễn phí" : "Nhập giá (VND)"}
                  min="0"
                  disabled={editForm.isFree ?? selectedCourse?.isFree ?? false}
                />
                {(editForm.isFree ?? selectedCourse?.isFree ?? false) && (
                  <p className="text-xs text-gray-500 mt-1">Khóa học miễn phí không cần nhập giá</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Thời lượng (phút)</label>
                <input
                  type="number"
                  value={editForm.durationMinutes || ''}
                  onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="Ví dụ: 120"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cấp độ</label>
                <select
                  value={editForm.level || ''}
                  onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="">Chọn cấp độ</option>
                  <option value="Beginner">Cơ bản</option>
                  <option value="Intermediate">Trung cấp</option>
                  <option value="Advanced">Nâng cao</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ảnh bìa</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleEditImageUpload}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="text-sm text-gray-500 mt-1">Đang upload...</p>}
              {(editForm.thumbnailUrl || selectedCourse?.thumbnailUrl) && (
                <img src={editForm.thumbnailUrl || selectedCourse?.thumbnailUrl} alt="Thumbnail" className="mt-2 w-32 h-32 object-cover rounded" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <select
                  value={editForm.status || selectedCourse?.status || 'Draft'}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="Draft">Bản nháp</option>
                  <option value="Active">Đang hoạt động</option>
                  <option value="Inactive">Không hoạt động</option>
                </select>
              </div>
              </div>
            </div>
            <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleUpdateCourse} disabled={uploadingImage}>
                  Cập nhật
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          className="max-w-2xl w-full mx-4 my-4"
        >
          {selectedCourse && (
            <div className="max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-6 pb-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">{selectedCourse.title || 'Chi Tiết Khóa Học'}</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedCourse.title}</p>
              </div>

              {selectedCourse.description && (
                <div>
                  <label className="block text-sm font-medium mb-1">Mô tả</label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedCourse.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Giáo viên</label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedCourse.teacherName || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Môn học</label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedCourse.subjectName || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Giá</label>
                  <p className={`font-medium ${selectedCourse.isFree ? 'text-green-600' : 'text-blue-600'}`}>
                    {formatPrice(selectedCourse.price)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Thời lượng</label>
                  <p className="text-gray-700 dark:text-gray-300">{formatDuration(selectedCourse.durationMinutes)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cấp độ</label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedCourse.level || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <span className={`px-2 py-1 text-xs rounded-full ${selectedCourse.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      selectedCourse.status === 'Draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    {selectedCourse.status || 'N/A'}
                  </span>
                </div>
              </div>

              {selectedCourse.thumbnailUrl && (
                <div>
                  <label className="block text-sm font-medium mb-1">Ảnh bìa</label>
                  <img src={selectedCourse.thumbnailUrl} alt="Thumbnail" className="w-full max-w-md h-48 object-cover rounded" />
                </div>
              )}

              {/* Course Materials Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Tài liệu khóa học</label>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsDetailOpen(false);
                      openAddMaterial(selectedCourse);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    + Thêm tài liệu
                  </Button>
                </div>
                
                {loadingMaterials ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-500">Đang tải tài liệu...</p>
                  </div>
                ) : courseMaterials.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    Chưa có tài liệu nào. Nhấn nút "+ Thêm tài liệu" để thêm tài liệu cho khóa học này.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {courseMaterials
                      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                      .map((material) => (
                        <div 
                          key={material.id} 
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">
                                  #{material.orderIndex || 'N/A'}
                                </span>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {material.title}
                                </h4>
                              </div>
                              {material.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {material.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {material.mediaType && (
                                  <span>
                                    {material.mediaType.startsWith('video/') ? '🎥 Video' : 
                                     material.mediaType.startsWith('image/') ? '🖼️ Hình ảnh' : 
                                     material.mediaType.includes('pdf') ? '📄 PDF' : 
                                     '📎 File'}
                                  </span>
                                )}
                                {material.price && (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {formatPrice(material.price)}
                                  </span>
                                )}
                                {material.createdAt && (
                                  <span>
                                    {new Date(material.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            </div>
                            {(material.externalLink || material.fileUrl) && (
                              <a
                                href={material.externalLink || material.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={material.fileUrl ? true : undefined}
                                className="ml-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                title={material.fileUrl ? "Tải tài liệu về" : "Xem tài liệu"}
                              >
                                {material.fileUrl ? "⬇️ Tải về" : "🔗 Xem"}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Course Lessons Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Bài học khóa học</label>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsDetailOpen(false);
                      openAddLesson(selectedCourse);
                    }}
                    className="text-green-600 hover:text-green-700"
                  >
                    + Thêm bài học
                  </Button>
                </div>
                
                {loadingLessons ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    <p className="text-sm text-gray-500">Đang tải bài học...</p>
                  </div>
                ) : courseLessons.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    Chưa có bài học nào. Nhấn nút "+ Thêm bài học" để thêm bài học cho khóa học này.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {courseLessons
                      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                      .map((lesson) => (
                        <div 
                          key={lesson.lessonId} 
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">
                                  #{lesson.orderIndex || 'N/A'}
                                </span>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {lesson.title}
                                </h4>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  {lesson.type === 'video' ? '🎥 Video' : 
                                   lesson.type === 'document' ? '📄 Tài liệu' : 
                                   lesson.type === 'quiz' ? '❓ Quiz' : 
                                   lesson.type === 'assignment' ? '📝 Bài tập' : 
                                   '📎 Khác'}
                                </span>
                              </div>
                              {lesson.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {lesson.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {lesson.durationSeconds && (
                                  <span>
                                    {Math.floor(lesson.durationSeconds / 60)}:{(lesson.durationSeconds % 60).toString().padStart(2, '0')}
                                  </span>
                                )}
                                {lesson.createdAt && (
                                  <span>
                                    {new Date(lesson.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            </div>
                            {(lesson.videoUrl || lesson.contentUrl) && (
                              <a
                                href={lesson.videoUrl || lesson.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                title="Xem bài học"
                              >
                                🔗 Xem
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

                </div>
              </div>
              <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Đóng
                  </Button>
                  <Button onClick={() => {
                    setIsDetailOpen(false);
                    openEdit(selectedCourse);
                  }}>
                    Chỉnh sửa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          className="max-w-md p-6"
        >
          {selectedCourse && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Xóa Khóa Học</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Bạn có chắc chắn muốn xóa khóa học <strong>{selectedCourse.title}</strong>?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Hành động này không thể hoàn tác!
              </p>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700">
                  Xóa
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Material Modal */}
        <Modal
          isOpen={isAddMaterialOpen}
          onClose={() => setIsAddMaterialOpen(false)}
          className="max-w-2xl p-6"
        >
          {selectedCourse && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Thêm Tài Liệu</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">Khóa học</label>
                <input
                  type="text"
                  value={selectedCourse.title}
                  disabled
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="Nhập tiêu đề tài liệu (để trống sẽ dùng tên file)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  rows={3}
                  placeholder="Nhập mô tả tài liệu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Thứ tự</label>
                <input
                  type="number"
                  value={materialForm.orderIndex || ""}
                  onChange={(e) => setMaterialForm({ ...materialForm, orderIndex: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="Thứ tự hiển thị (để trống sẽ tự động)"
                  min="0"
                />
              </div>


              <div>
                <label className="block text-sm font-medium mb-1">Tệp tài liệu *</label>
                <input
                  type="file"
                  multiple
                  onChange={handleMaterialFileChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  disabled={uploadingMaterial}
                />
                {materialForm.files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Đã chọn {materialForm.files.length} tệp:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {materialForm.files.map((file, index) => (
                        <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {uploadingMaterial && (
                <p className="text-sm text-gray-500">Đang upload tài liệu...</p>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddMaterialOpen(false)} disabled={uploadingMaterial}>
                  Hủy
                </Button>
                <Button onClick={handleAddMaterial} disabled={uploadingMaterial || materialForm.files.length === 0}>
                  Thêm tài liệu
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Lesson Modal */}
        <Modal
          isOpen={isAddLessonOpen}
          onClose={() => setIsAddLessonOpen(false)}
          className="max-w-2xl w-full mx-4 my-4"
        >
          <div className="max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 pb-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Thêm Bài Học</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <div className="space-y-4">
                {selectedCourse && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Khóa học</label>
                      <input
                        type="text"
                        value={selectedCourse.title}
                        disabled
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                      <input
                        type="text"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                        placeholder="Nhập tiêu đề bài học"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Nội dung bài học</label>
                      <textarea
                        value={lessonForm.content || ''}
                        onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                        rows={8}
                        placeholder="Nhập nội dung bài học (có thể sử dụng HTML để định dạng)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Nhập nội dung chi tiết của bài học. Có thể sử dụng HTML để định dạng văn bản.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Loại bài học</label>
                        <select
                          value={lessonForm.type || 'video'}
                          onChange={(e) => {
                            setLessonForm({ ...lessonForm, type: e.target.value });
                            setSelectedMaterialId(null); // Reset material selection when type changes
                          }}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                        >
                          <option value="video">Video</option>
                          <option value="document">Tài liệu</option>
                          <option value="quiz">Quiz</option>
                          <option value="assignment">Bài tập</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Thứ tự</label>
                        <input
                          type="number"
                          value={lessonForm.orderIndex || ''}
                          onChange={(e) => setLessonForm({ ...lessonForm, orderIndex: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                          placeholder="Thứ tự hiển thị (để trống sẽ tự động)"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Chọn từ tài liệu đã có */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Chọn từ tài liệu đã có (tùy chọn)
                      </label>
                      {loadingMaterials ? (
                        <p className="text-sm text-gray-500">Đang tải tài liệu...</p>
                      ) : courseMaterials.length > 0 ? (
                        <>
                          <select
                            value={selectedMaterialId || ''}
                            onChange={(e) => {
                              const materialId = e.target.value ? Number(e.target.value) : null;
                              setSelectedMaterialId(materialId);
                              
                              if (materialId) {
                                const material = courseMaterials.find(m => m.id === materialId);
                                if (material) {
                                  // Auto-fill based on material type
                                  if (material.mediaType?.startsWith('video/') && material.fileUrl) {
                                    setLessonForm({
                                      ...lessonForm,
                                      type: 'video',
                                      videoUrl: material.fileUrl,
                                      title: material.title || lessonForm.title,
                                      description: material.description || lessonForm.description,
                                    });
                                  } else if (material.fileUrl) {
                                    setLessonForm({
                                      ...lessonForm,
                                      type: lessonForm.type === 'video' ? 'document' : lessonForm.type,
                                      contentUrl: material.fileUrl,
                                      title: material.title || lessonForm.title,
                                      description: material.description || lessonForm.description,
                                    });
                                  }
                                }
                              } else {
                                // Reset when no material selected
                                setSelectedMaterialId(null);
                              }
                            }}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                          >
                            <option value="">-- Chọn tài liệu (tùy chọn) --</option>
                            {courseMaterials.map((material) => (
                              <option key={material.id} value={material.id}>
                                {material.title} {material.mediaType?.startsWith('video/') ? '(Video)' : '(Tài liệu)'}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Chọn tài liệu để tự động điền thông tin bài học
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Chưa có tài liệu nào. Vui lòng thêm tài liệu trước khi tạo bài học từ tài liệu.
                        </p>
                      )}
                    </div>

                    {/* Chọn câu hỏi từ ngân hàng */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Chọn câu hỏi từ ngân hàng (tùy chọn)
                      </label>
                      {loadingQuestions ? (
                        <div className="text-sm text-gray-500">Đang tải câu hỏi...</div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
                          {availableQuestions.length === 0 ? (
                            <p className="text-sm text-gray-500">Không có câu hỏi nào trong ngân hàng</p>
                          ) : (
                            availableQuestions.map((question) => (
                              <label
                                key={question.questionId}
                                className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedQuestionIds.includes(question.questionId)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedQuestionIds([...selectedQuestionIds, question.questionId]);
                                    } else {
                                      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== question.questionId));
                                    }
                                  }}
                                  className="mt-1 rounded"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {question.content?.substring(0, 100)}
                                    {question.content && question.content.length > 100 ? '...' : ''}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Loại: {question.questionType || 'N/A'} | 
                                    Độ khó: {question.difficulty || 'N/A'} | 
                                    Điểm: {question.marks || 0}
                                  </div>
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                      {selectedQuestionIds.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Đã chọn {selectedQuestionIds.length} câu hỏi
                        </p>
                      )}
                    </div>

                    {lessonForm.type === 'video' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">URL Video</label>
                        <input
                          type="url"
                          value={lessonForm.videoUrl || ''}
                          onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    )}

                    {(lessonForm.type === 'document' || lessonForm.type === 'assignment') && (
                      <div>
                        <label className="block text-sm font-medium mb-1">URL Tài liệu</label>
                        <input
                          type="url"
                          value={lessonForm.contentUrl || ''}
                          onChange={(e) => setLessonForm({ ...lessonForm, contentUrl: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Thời lượng (giây)</label>
                        <input
                          type="number"
                          value={lessonForm.durationSeconds || ''}
                          onChange={(e) => setLessonForm({ ...lessonForm, durationSeconds: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                          placeholder="Ví dụ: 900 (15 phút)"
                          min="0"
                        />
                      </div>

                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddLessonOpen(false)} disabled={savingLesson}>
                  Hủy
                </Button>
                <Button onClick={handleAddLesson} disabled={savingLesson || !lessonForm.title.trim()}>
                  {savingLesson ? 'Đang lưu...' : 'Thêm bài học'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}

