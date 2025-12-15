import { useEffect, useState } from 'react';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { EyeIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { examHistoryService, type ExamAttemptDto, type PagedResponse } from '../services/examHistory.service';
import { examsService } from '../services/exams.service';
import { usersService } from '../services/users.service';

export default function ExamHistory() {
  const [paged, setPaged] = useState<PagedResponse<ExamAttemptDto> | null>(null);
  const attempts = paged?.items ?? [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const [examIdFilter, setExamIdFilter] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isPassedFilter, setIsPassedFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected attempt for detail view
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttemptDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        pageIndex,
        pageSize,
      };
      if (examIdFilter.trim()) params.examId = parseInt(examIdFilter.trim());
      if (userIdFilter.trim()) params.userId = parseInt(userIdFilter.trim());
      if (statusFilter) params.status = statusFilter;
      if (isPassedFilter) params.isPassed = isPassedFilter === 'true';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await examHistoryService.getExamAttempts(params);
      setPaged(res);
    } catch (e: any) {
      const errorMsg = e?.message || 'Không thể tải lịch sử làm bài thi';
      // If 405 or 404, show a more helpful message
      if (e?.status === 405 || e?.status === 404) {
        setError('Endpoint chưa được hỗ trợ. Vui lòng liên hệ admin để kích hoạt tính năng này hoặc kiểm tra lại backend API.');
      } else {
        setError(errorMsg);
      }
      console.error('Error loading exam attempts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, [pageIndex, pageSize]);

  const handleViewDetail = async (attempt: ExamAttemptDto) => {
    try {
      const detail = await examHistoryService.getExamAttemptById(attempt.examAttemptId);
      setSelectedAttempt(detail);
      setIsDetailOpen(true);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải chi tiết');
    }
  };

  const handleDelete = async () => {
    if (!selectedAttempt) return;
    setDeleting(true);
    try {
      await examHistoryService.deleteExamAttempt(selectedAttempt.examAttemptId);
      setIsDeleteOpen(false);
      setSelectedAttempt(null);
      await loadAttempts();
    } catch (e: any) {
      setError(e?.message || 'Không thể xóa lịch sử làm bài');
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

  const formatDuration = (seconds?: number, minutes?: number) => {
    if (seconds !== undefined && seconds > 0) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h > 0) return `${h}h ${m}m ${s}s`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    }
    if (minutes !== undefined && minutes > 0) {
      return `${minutes} phút`;
    }
    return '-';
  };

  return (
    <div>
      <PageMeta title="Quản lý lịch sử làm bài thi" description="Xem và quản lý lịch sử làm bài thi của tất cả người dùng" />
      <PageBreadcrumb pageTitle="Quản Lý Lịch Sử Làm Bài Thi" />

      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadAttempts} className="mt-2">Thử lại</Button>
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
            value={examIdFilter}
            onChange={(e) => setExamIdFilter(e.target.value)}
            placeholder="Exam ID"
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
            <option value="InProgress">Đang làm</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Abandoned">Bỏ dở</option>
          </select>
          <select
            value={isPassedFilter}
            onChange={(e) => setIsPassedFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả</option>
            <option value="true">Đã đạt</option>
            <option value="false">Chưa đạt</option>
          </select>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setPageIndex(1); loadAttempts(); }}>Lọc</Button>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setExamIdFilter('');
              setUserIdFilter('');
              setStatusFilter('');
              setIsPassedFilter('');
              setPageIndex(1);
              loadAttempts();
            }}>Xóa lọc</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài thi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người làm</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm số</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kết quả</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nộp bài</TableCell>
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
              ) : attempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-12 text-center text-gray-500">Không có dữ liệu</TableCell>
                </TableRow>
              ) : (
                attempts.map((attempt) => {
                  const isPassed = attempt.isPassed || attempt.passed || false;
                  const correctAnswers = attempt.correctAnswers || attempt.score || 0;
                  const totalQuestions = attempt.totalQuestions || attempt.maxScore || 0;
                  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10 : 0;

                  return (
                    <TableRow key={attempt.examAttemptId} className="border-t border-gray-100 dark:border-gray-800">
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">#{attempt.examAttemptId}</div>
                        {attempt.attemptNumber && attempt.attemptNumber > 1 && (
                          <div className="text-xs text-gray-500">Lần {attempt.attemptNumber}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{attempt.examTitle || `Exam #${attempt.examId}`}</div>
                        {attempt.variantCode && (
                          <div className="text-xs text-gray-500">Variant: {attempt.variantCode}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{attempt.userName || `User #${attempt.userId}`}</div>
                        {attempt.userEmail && (
                          <div className="text-xs text-gray-500">{attempt.userEmail}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {correctAnswers}/{totalQuestions} ({percentage}%)
                        </div>
                        {attempt.score !== undefined && (
                          <div className="text-xs text-gray-500">Điểm: {attempt.score}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isPassed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {isPassed ? 'Đạt' : 'Chưa đạt'}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDuration(attempt.timeSpentSeconds, attempt.timeSpentMinutes)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {attempt.status || 'N/A'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(attempt.submittedAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="!p-2"
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(attempt)}
                          >
                            <EyeIcon className="h-4 w-4 fill-current" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="!p-2 text-red-600 hover:text-red-700"
                            title="Xóa"
                            onClick={() => {
                              setSelectedAttempt(attempt);
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
          setSelectedAttempt(null);
        }}
        title="Chi tiết lịch sử làm bài thi"
      >
        {selectedAttempt && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID Attempt</label>
                <p className="text-sm text-gray-900 dark:text-white">#{selectedAttempt.examAttemptId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bài thi</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedAttempt.examTitle || `Exam #${selectedAttempt.examId}`}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Người làm</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedAttempt.userName || `User #${selectedAttempt.userId}`}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedAttempt.userEmail || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Điểm số</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedAttempt.correctAnswers || selectedAttempt.score || 0} / {selectedAttempt.totalQuestions || selectedAttempt.maxScore || 0}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kết quả</label>
                <p className="text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (selectedAttempt.isPassed || selectedAttempt.passed) 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {(selectedAttempt.isPassed || selectedAttempt.passed) ? 'Đạt' : 'Chưa đạt'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian làm</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDuration(selectedAttempt.timeSpentSeconds, selectedAttempt.timeSpentMinutes)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedAttempt.status || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bắt đầu</label>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedAttempt.startTime)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nộp bài</label>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedAttempt.submittedAt)}</p>
              </div>
              {selectedAttempt.variantCode && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Variant Code</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAttempt.variantCode}</p>
                </div>
              )}
              {selectedAttempt.attemptNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lần làm</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedAttempt.attemptNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedAttempt(null);
        }}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa lịch sử làm bài thi này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedAttempt(null);
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

