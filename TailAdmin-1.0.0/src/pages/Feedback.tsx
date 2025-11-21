import { useState, useEffect, useMemo } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { EyeIcon, ChatIcon, CheckCircleIcon, CloseIcon, DownloadIcon, ArrowUpIcon as RefreshIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { 
  feedbackService, 
  type Feedback, 
  type FeedbackStatus, 
  type FeedbackType,
  type FeedbackPriority,
  type RespondToFeedbackRequest
} from "../services/feedback.service";

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [statistics, setStatistics] = useState<any>(null);

  // Filters
  const [statusQuery, setStatusQuery] = useState<FeedbackStatus | "">("");
  const [typeQuery, setTypeQuery] = useState<FeedbackType | "">("");
  const [priorityQuery, setPriorityQuery] = useState<FeedbackPriority | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFromQuery, setDateFromQuery] = useState("");
  const [dateToQuery, setDateToQuery] = useState("");

  // Load data on mount
  useEffect(() => {
    loadFeedbacks();
    loadStatistics();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadFeedbacks();
  }, [statusQuery, typeQuery, priorityQuery, searchQuery, dateFromQuery, dateToQuery]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        ...(statusQuery && { status: statusQuery }),
        ...(typeQuery && { type: typeQuery }),
        ...(priorityQuery && { priority: priorityQuery }),
        ...(searchQuery && { search: searchQuery }),
        ...(dateFromQuery && { dateFrom: dateFromQuery }),
        ...(dateToQuery && { dateTo: dateToQuery }),
      };

      const data = await feedbackService.getFeedbacks(filters);
      setFeedbacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu phản hồi');
      console.error('Error loading feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await feedbackService.getFeedbackStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading feedback statistics:', err);
    }
  };

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback || !responseText.trim()) return;

    try {
      const responseData: RespondToFeedbackRequest = {
        response: responseText,
        respondedBy: "Admin", // In real app, get from auth context
        status: "responded"
      };

      await feedbackService.respondToFeedback(selectedFeedback.id, responseData);
      
      // Reload data
      await loadFeedbacks();
      await loadStatistics();
      
      // Close modal and reset
      setIsResponseOpen(false);
      setResponseText("");
      setSelectedFeedback(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi trả lời phản hồi');
    }
  };

  const handleStatusUpdate = async (feedback: Feedback, newStatus: FeedbackStatus) => {
    try {
      await feedbackService.updateFeedbackStatus(feedback.id, {
        status: newStatus,
        updatedBy: "Admin" // In real app, get from auth context
      });

      // Reload data
      await loadFeedbacks();
      await loadStatistics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) return;

    try {
      await feedbackService.deleteFeedback(feedbackId);
      await loadFeedbacks();
      await loadStatistics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa phản hồi');
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const filters = {
        ...(statusQuery && { status: statusQuery }),
        ...(typeQuery && { type: typeQuery }),
        ...(dateFromQuery && { dateFrom: dateFromQuery }),
        ...(dateToQuery && { dateTo: dateToQuery }),
      };

      await feedbackService.downloadFeedbackExport(filters, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xuất dữ liệu');
    }
  };

  const openView = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsViewOpen(true);
  };

  const openResponse = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText("");
    setIsResponseOpen(true);
  };

  // Filter feedback for display (this is now handled by API, but kept for client-side consistency)
  const filteredFeedbacks = feedbacks;

  // Statistics summary
  const statisticsSummary = useMemo(() => {
    if (!statistics) return null;

    return [
      { label: 'Tổng phản hồi', value: statistics.total, color: 'text-blue-600' },
      { label: 'Chờ xử lý', value: statistics.pending, color: 'text-yellow-600' },
      { label: 'Đã trả lời', value: statistics.responded, color: 'text-blue-600' },
      { label: 'Đã giải quyết', value: statistics.resolved, color: 'text-green-600' },
      { label: 'Đã bỏ qua', value: statistics.dismissed, color: 'text-gray-600' },
    ];
  }, [statistics]);

  return (
    <>
      <PageMeta title="Quản Lý Phản Hồi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Phản Hồi</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              startIcon={<RefreshIcon className="h-4 w-4" />}
              onClick={loadFeedbacks}
              disabled={loading}
            >
              Làm mới
            </Button>
            <Button
              variant="outline"
              startIcon={<DownloadIcon className="h-4 w-4" />}
              onClick={() => handleExport('excel')}
            >
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statisticsSummary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {statisticsSummary.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={() => setError(null)} className="mt-2">
              Đóng
            </Button>
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
          
          <select
            value={statusQuery}
            onChange={(e) => setStatusQuery(e.target.value as FeedbackStatus | "")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="responded">Đã trả lời</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="dismissed">Đã bỏ qua</option>
          </select>

          <select
            value={typeQuery}
            onChange={(e) => setTypeQuery(e.target.value as FeedbackType | "")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả loại</option>
            <option value="bug">Lỗi hệ thống</option>
            <option value="feature">Đề xuất tính năng</option>
            <option value="complaint">Khiếu nại</option>
            <option value="suggestion">Góp ý</option>
            <option value="other">Khác</option>
          </select>

          <select
            value={priorityQuery}
            onChange={(e) => setPriorityQuery(e.target.value as FeedbackPriority | "")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả mức độ</option>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
          </select>

          <input
            type="date"
            value={dateFromQuery}
            onChange={(e) => setDateFromQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
            placeholder="Từ ngày"
          />

          <input
            type="date"
            value={dateToQuery}
            onChange={(e) => setDateToQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
            placeholder="Đến ngày"
          />
        </div>

        {/* Feedback Table */}
        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người gửi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chủ đề</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức độ</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredFeedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {feedbacks.length === 0 ? "Chưa có phản hồi nào" : "Không tìm thấy kết quả nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeedbacks.map((feedback) => (
                  <TableRow key={feedback.id} className="border-t border-gray-100 dark:border-gray-800">
                    <TableCell className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{feedback.userName}</div>
                        <div className="text-xs text-gray-500">{feedback.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {feedback.subject}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{feedback.message}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-blue-200 text-blue-600 dark:ring-blue-900/40">
                        {feedbackService.getTypeText(feedback.type)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`font-medium ${feedbackService.getPriorityColor(feedback.priority)}`}>
                        {feedbackService.getPriorityText(feedback.priority)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ${
                        feedback.status === 'pending' ? 'ring-yellow-200 text-yellow-600 bg-yellow-50 dark:ring-yellow-700' :
                        feedback.status === 'responded' ? 'ring-blue-200 text-blue-600 bg-blue-50 dark:ring-blue-700' :
                        feedback.status === 'resolved' ? 'ring-green-200 text-green-600 bg-green-50 dark:ring-green-700' :
                        'ring-gray-200 text-gray-600 bg-gray-50 dark:ring-gray-700'
                      }`}>
                        {feedbackService.getStatusText(feedback.status)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="outline" startIcon={<EyeIcon className="h-3 w-3" />} onClick={() => openView(feedback)}>
                          Xem
                        </Button>
                        {feedback.status === 'pending' && (
                          <Button size="sm" variant="outline" startIcon={<ChatIcon className="h-3 w-3" />} onClick={() => openResponse(feedback)}>
                            Trả lời
                          </Button>
                        )}
                        {feedback.status !== 'resolved' && (
                          <Button 
                            size="sm" 
                            className="!bg-green-500 hover:!bg-green-600" 
                            startIcon={<CheckCircleIcon className="h-3 w-3" />}
                            onClick={() => handleStatusUpdate(feedback, 'resolved')}
                          >
                            Giải quyết
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="!bg-red-500 hover:!bg-red-600" 
                          startIcon={<CloseIcon className="h-3 w-3" />}
                          onClick={() => handleDeleteFeedback(feedback.id)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} className="max-w-3xl p-6">
        {selectedFeedback && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Chi Tiết Phản Hồi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Người gửi:</span>
                  <div className="font-medium">{selectedFeedback.userName}</div>
                  <div className="text-sm text-gray-500">{selectedFeedback.userEmail}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Loại:</span>
                  <div className="font-medium">{feedbackService.getTypeText(selectedFeedback.type)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Mức độ:</span>
                  <div className={`font-medium ${feedbackService.getPriorityColor(selectedFeedback.priority)}`}>
                    {feedbackService.getPriorityText(selectedFeedback.priority)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Trạng thái:</span>
                  <div className={`font-medium ${feedbackService.getStatusColor(selectedFeedback.status)}`}>
                    {feedbackService.getStatusText(selectedFeedback.status)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Ngày tạo:</span>
                  <div className="font-medium">{new Date(selectedFeedback.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                {selectedFeedback.respondedAt && (
                  <div>
                    <span className="text-gray-600 text-sm">Ngày trả lời:</span>
                    <div className="font-medium">{new Date(selectedFeedback.respondedAt).toLocaleString('vi-VN')}</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="text-gray-600 text-sm">Chủ đề:</span>
              <div className="font-medium text-lg">{selectedFeedback.subject}</div>
            </div>

            <div>
              <span className="text-gray-600 text-sm">Nội dung:</span>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {selectedFeedback.message}
              </div>
            </div>

            {selectedFeedback.response && (
              <div>
                <span className="text-gray-600 text-sm">Phản hồi từ {selectedFeedback.respondedBy}:</span>
                <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  {selectedFeedback.response}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              {selectedFeedback.status === 'pending' && (
                <Button onClick={() => {
                  setIsViewOpen(false);
                  openResponse(selectedFeedback);
                }}>
                  Trả lời
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Response Modal */}
      <Modal isOpen={isResponseOpen} onClose={() => setIsResponseOpen(false)} className="max-w-2xl p-6">
        {selectedFeedback && (
          <form onSubmit={handleResponseSubmit} className="space-y-4">
            <h3 className="text-xl font-semibold">Trả Lời Phản Hồi</h3>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-medium">{selectedFeedback.subject}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedFeedback.message}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phản hồi của bạn *
              </label>
              <textarea
                required
                rows={5}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="Nhập phản hồi của bạn..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsResponseOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!responseText.trim()}>
                Gửi Phản Hồi
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}