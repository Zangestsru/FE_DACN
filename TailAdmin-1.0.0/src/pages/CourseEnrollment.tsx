import { useEffect, useState } from 'react';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { EyeIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { courseEnrollmentService, type CourseEnrollmentDto, type PagedResponse } from '../services/courseEnrollment.service';

export default function CourseEnrollment() {
  const [paged, setPaged] = useState<PagedResponse<CourseEnrollmentDto> | null>(null);
  const enrollments = paged?.items ?? [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
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

  const loadEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        pageIndex,
        pageSize,
      };
      if (courseIdFilter.trim()) params.courseId = parseInt(courseIdFilter.trim());
      if (userIdFilter.trim()) params.userId = parseInt(userIdFilter.trim());
      if (statusFilter) params.status = statusFilter;
      if (isCompletedFilter) params.isCompleted = isCompletedFilter === 'true';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await courseEnrollmentService.getCourseEnrollments(params);
      setPaged(res);
    } catch (e: any) {
      const errorMsg = e?.message || 'Không thể tải lịch sử đăng ký khóa học';
      // If 405 or 404, show a more helpful message
      if (e?.status === 405 || e?.status === 404) {
        setError('Endpoint chưa được hỗ trợ. Vui lòng liên hệ admin để kích hoạt tính năng này hoặc kiểm tra lại backend API.');
      } else {
        setError(errorMsg);
      }
      console.error('Error loading course enrollments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, [pageIndex, pageSize]);

  const handleViewDetail = async (enrollment: CourseEnrollmentDto) => {
    try {
      const detail = await courseEnrollmentService.getCourseEnrollmentById(enrollment.enrollmentId);
      setSelectedEnrollment(detail);
      setIsDetailOpen(true);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải chi tiết');
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
      setError(e?.message || 'Không thể xóa lịch sử đăng ký');
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
      <PageMeta title="Quản lý lịch sử đăng ký khóa học" description="Xem và quản lý lịch sử đăng ký khóa học của tất cả người dùng" />
      <PageBreadcrumb pageTitle="Quản Lý Lịch Sử Đăng Ký Khóa Học" />

      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadEnrollments} className="mt-2">Thử lại</Button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            type="number"
            value={courseIdFilter}
            onChange={(e) => setCourseIdFilter(e.target.value)}
            placeholder="Course ID"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            type="number"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            placeholder="User ID"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Đang học</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
          <select
            value={isCompletedFilter}
            onChange={(e) => setIsCompletedFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
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
              {loading ? (
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
                  <TableCell colSpan={9} className="px-6 py-12 text-center text-gray-500">Không có dữ liệu</TableCell>
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
        title="Chi tiết đăng ký khóa học"
      >
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
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedEnrollment(null);
        }}
        title="Xác nhận xóa"
      >
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
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

