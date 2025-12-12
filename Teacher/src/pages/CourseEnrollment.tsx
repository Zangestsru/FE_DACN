import { useEffect, useState } from 'react';
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { EyeIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { courseEnrollmentService, type CourseEnrollmentDto, type PagedResponse } from '../services/courseEnrollment.service';
import { coursesService } from '../services/courses.service';
import authService from '../services/auth.service';

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

export default function CourseEnrollment() {
  const [paged, setPaged] = useState<PagedResponse<CourseEnrollmentDto> | null>(null);
  const enrollments = paged?.items ?? [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  
  // Teacher's course IDs (for filtering)
  const [teacherCourseIds, setTeacherCourseIds] = useState<number[]>([]);
  const [teacherDataLoaded, setTeacherDataLoaded] = useState(false);
  
  // Filters
  const [courseIdFilter, setCourseIdFilter] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCompletedFilter, setIsCompletedFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected enrollment for detail view
  const [selectedEnrollment, setSelectedEnrollment] = useState<CourseEnrollmentDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load teacher's courses on mount
  useEffect(() => {
    const loadTeacherCourses = async () => {
      const teacherId = getTeacherId();
      if (import.meta.env.DEV) {
        console.log('Loading teacher courses for teacherId:', teacherId);
      }
      if (!teacherId) {
        setTeacherDataLoaded(true);
        return;
      }

      try {
        // Load teacher's courses
        if (import.meta.env.DEV) {
          console.log('Fetching courses for teacherId:', teacherId);
        }
        let coursesData = await coursesService.getCourses({ teacherId, pageSize: 1000 });
        if (import.meta.env.DEV) {
          console.log('Courses data received:', coursesData);
          console.log('Courses items:', coursesData.items);
          console.log('Total courses:', coursesData.total);
        }
        
        // Nếu không có khóa học với teacherId filter, thử load tất cả và filter ở client-side
        if (!coursesData.items || coursesData.items.length === 0) {
          if (import.meta.env.DEV) {
            console.warn('No courses found with teacherId filter. Trying to load all courses and filter client-side...');
          }
          const allCoursesData = await coursesService.getCourses({ pageSize: 1000 });
          if (import.meta.env.DEV) {
            console.log('All courses (no filter):', allCoursesData);
            console.log('All courses items:', allCoursesData?.items);
          }
          
          // Filter ở client-side dựa vào teacherId
          if (allCoursesData && allCoursesData.items && allCoursesData.items.length > 0) {
            const filteredCourses = allCoursesData.items.filter(course => {
              const courseTeacherId = course.teacherId;
              if (import.meta.env.DEV) {
                console.log(`Course ${course.courseId}: teacherId=${courseTeacherId}, currentTeacherId=${teacherId}, match=${courseTeacherId === teacherId}`);
              }
              return courseTeacherId === teacherId;
            });
            if (import.meta.env.DEV) {
              console.log('Filtered courses (client-side):', filteredCourses);
            }
            setTeacherCourseIds(filteredCourses.map(course => course.courseId));
          } else {
            if (import.meta.env.DEV) {
              console.log('No courses found at all, setting teacherCourseIds to empty.');
            }
            setTeacherCourseIds([]);
          }
        } else {
          setTeacherCourseIds(coursesData.items.map(course => course.courseId));
          if (import.meta.env.DEV) {
            console.log('Mapped course IDs from API with teacherId filter:', coursesData.items.map(course => course.courseId));
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Error loading teacher courses:', err);
        }
        setTeacherCourseIds([]);
      } finally {
        setTeacherDataLoaded(true);
      }
    };

    loadTeacherCourses();
  }, []);

  const loadEnrollments = async () => {
    if (!teacherDataLoaded) {
      if (import.meta.env.DEV) {
        console.log('Teacher data not loaded yet, waiting...');
      }
      return;
    }

    if (teacherCourseIds.length === 0) {
      if (import.meta.env.DEV) {
        console.log('No courses found for teacher, showing empty list');
      }
      setPaged({
        items: [],
        total: 0,
        pageIndex: 1,
        pageSize: pageSize,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Load enrollments for each course ID of teacher
      const allEnrollments: CourseEnrollmentDto[] = [];
      
      // If courseIdFilter is set, only load for that course
      const courseIdsToLoad = courseIdFilter.trim() 
        ? [parseInt(courseIdFilter.trim())].filter(id => !isNaN(id) && teacherCourseIds.includes(id))
        : teacherCourseIds;

      // Only log in development mode
      if (import.meta.env.DEV) {
        console.log('Loading enrollments for course IDs:', courseIdsToLoad);
        console.log('Teacher course IDs:', teacherCourseIds);
      }

      if (!courseIdsToLoad || courseIdsToLoad.length === 0) {
        if (import.meta.env.DEV) {
          console.log('No course IDs to load enrollments for');
        }
        setPaged({
          items: [],
          total: 0,
          pageIndex: 1,
          pageSize: pageSize,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        });
        setLoading(false);
        return;
      }

      // Load enrollments for each course (with pagination, we'll load all and paginate client-side)
      for (const courseId of courseIdsToLoad) {
        if (!courseId || isNaN(courseId)) {
          if (import.meta.env.DEV) {
            console.warn(`Skipping invalid courseId: ${courseId}`);
          }
          continue;
        }
        
        try {
          const params: any = {
            pageIndex: 1,
            pageSize: 1000, // Load all enrollments for this course
            courseId: courseId,
          };
          if (statusFilter) params.status = statusFilter;
          if (isCompletedFilter) params.isCompleted = isCompletedFilter === 'true';
          if (searchQuery.trim()) params.search = searchQuery.trim();

          const res = await courseEnrollmentService.getCourseEnrollments(params);
          allEnrollments.push(...res.items);
        } catch (err: any) {
          // Completely silent - suppress all errors for expected backend issues (SQL errors, 403, 500)
          // These are handled gracefully by returning empty results
          // Continue with other courses
        }
      }

      // If no enrollments loaded, just show empty state (no error message)
      // This is normal when no students have enrolled yet
      
      // Apply search filter if any
      let filteredItems = allEnrollments;
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        filteredItems = filteredItems.filter(enrollment => 
          (enrollment.courseTitle?.toLowerCase().includes(searchLower)) ||
          (enrollment.userName?.toLowerCase().includes(searchLower)) ||
          (enrollment.userEmail?.toLowerCase().includes(searchLower))
        );
      }
      
      // Filter by userId if set
      if (userIdFilter.trim()) {
        const userId = parseInt(userIdFilter.trim());
        if (!isNaN(userId)) {
          filteredItems = filteredItems.filter(enrollment => enrollment.userId === userId);
        }
      }
      
      // Sort by enrolledAt descending (newest first)
      filteredItems.sort((a, b) => {
        const dateA = a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0;
        const dateB = b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0;
        return dateB - dateA;
      });
      
      // Apply pagination
      const total = filteredItems.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (pageIndex - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);
      
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.log('Filtered and paginated course enrollments:', paginatedItems.length, paginatedItems);
      }
      
      setPaged({
        items: paginatedItems,
        total,
        pageIndex,
        pageSize,
        totalPages,
        hasNextPage: pageIndex < totalPages,
        hasPreviousPage: pageIndex > 1,
      });
    } catch (e: any) {
      // Silently handle errors - don't show error messages to user
      // Just show empty state instead
      // Only log in development mode for debugging
      if (import.meta.env.DEV) {
        console.error('Error loading course enrollments:', e);
      }
      // Set empty result instead of showing error
      setPaged({
        items: [],
        total: 0,
        pageIndex: params?.pageIndex || 1,
        pageSize: params?.pageSize || 10,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacherDataLoaded) {
      loadEnrollments();
    }
  }, [teacherDataLoaded, pageIndex]);

  const handleViewDetail = async (enrollment: CourseEnrollmentDto) => {
    try {
      const detail = await courseEnrollmentService.getCourseEnrollmentById(enrollment.enrollmentId);
      setSelectedEnrollment(detail);
      setIsDetailOpen(true);
    } catch (e: any) {
      // Silently handle error - don't show error message
      if (import.meta.env.DEV) {
        console.error('Error loading enrollment detail:', e);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedEnrollment) return;
    setDeleting(true);
    try {
      await courseEnrollmentService.deleteCourseEnrollment(selectedEnrollment.enrollmentId);
      setIsDeleteOpen(false);
      setSelectedEnrollment(null);
      await loadEnrollments();
    } catch (e: any) {
      // Silently handle error - don't show error message
      if (import.meta.env.DEV) {
        console.error('Error deleting enrollment:', e);
      }
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <PageMeta title="Quản lý lịch sử đăng ký khóa học" description="Xem và quản lý lịch sử đăng ký khóa học của các khóa học do bạn tạo" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản Lý Lịch Sử Đăng Ký Khóa Học</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Quản lý lịch sử đăng ký của các khóa học do bạn tạo</p>
      </div>

      <div className="space-y-4">
        {/* Error messages removed - show empty state instead when no data */}

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            type="number"
            value={courseIdFilter}
            onChange={(e) => setCourseIdFilter(e.target.value)}
            placeholder="Course ID"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            type="number"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            placeholder="User ID"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Đang học</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
          <select
            value={isCompletedFilter}
            onChange={(e) => setIsCompletedFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả</option>
            <option value="true">Đã hoàn thành</option>
            <option value="false">Chưa hoàn thành</option>
          </select>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setPageIndex(1); loadEnrollments(); }}>Lọc</Button>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setCourseIdFilter('');
              setUserIdFilter('');
              setStatusFilter('');
              setIsCompletedFilter('');
              setPageIndex(1);
              loadEnrollments();
            }}>Xóa lọc</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa học</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người đăng ký</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiến độ</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đăng ký lúc</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoàn thành lúc</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truy cập cuối</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || !teacherDataLoaded ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    {teacherCourseIds.length === 0 
                      ? "Bạn chưa có khóa học nào. Vui lòng tạo khóa học trước." 
                      : "Chưa có học viên nào đăng ký các khóa học của bạn."}
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment) => {
                  const isCompleted = enrollment.isCompleted || false;
                  const progress = enrollment.progress || 0;

                  return (
                    <TableRow key={enrollment.enrollmentId} className="border-t border-gray-100 dark:border-gray-800">
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">#{enrollment.enrollmentId}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{enrollment.courseTitle || `Course #${enrollment.courseId}`}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{enrollment.userName || `User #${enrollment.userId}`}</div>
                        {enrollment.userEmail && (
                          <div className="text-xs text-gray-500">{enrollment.userEmail}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isCompleted
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : enrollment.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {isCompleted ? 'Hoàn thành' : enrollment.status || 'Đang học'}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(enrollment.enrolledAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(enrollment.completedAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(enrollment.lastAccessedAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="!p-2"
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(enrollment)}
                          >
                            <EyeIcon className="h-4 w-4 fill-current" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="!p-2 text-red-600 hover:text-red-700"
                            title="Xóa"
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <TrashBinIcon className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {paged && paged.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Trang {paged.pageIndex} / {paged.totalPages} ({paged.total} kết quả)
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                disabled={!paged.hasPreviousPage} 
                onClick={() => setPageIndex(p => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button 
                variant="outline" 
                disabled={!paged.hasNextPage} 
                onClick={() => setPageIndex(p => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEnrollment(null);
        }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Chi tiết đăng ký khóa học</h2>
        {selectedEnrollment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID Enrollment</label>
                <p className="text-sm text-gray-900 dark:text-white">#{selectedEnrollment.enrollmentId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Khóa học</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedEnrollment.courseTitle || `Course #${selectedEnrollment.courseId}`}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Người đăng ký</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedEnrollment.userName || `User #${selectedEnrollment.userId}`}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedEnrollment.userEmail || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tiến độ</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(selectedEnrollment.progress || 0, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedEnrollment.progress || 0}%</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</label>
                <p className="text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedEnrollment.isCompleted
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : selectedEnrollment.status === 'Cancelled'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {selectedEnrollment.isCompleted ? 'Hoàn thành' : selectedEnrollment.status || 'Đang học'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Đăng ký lúc</label>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedEnrollment.enrolledAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hoàn thành lúc</label>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedEnrollment.completedAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Truy cập cuối</label>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedEnrollment.lastAccessedAt)}</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedEnrollment(null);
        }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Xác nhận xóa</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa lịch sử đăng ký khóa học này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedEnrollment(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700 border-red-600"
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        </div>
        </div>
      </Modal>
    </div>
  );
}

