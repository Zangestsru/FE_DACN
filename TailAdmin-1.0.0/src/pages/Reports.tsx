import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { EyeIcon, ArrowUpIcon as RefreshIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { 
  adminReportsService,
  type AdminReportResponse,
  type ParsedReportInfo
} from "../services/adminReports.service";

export default function Reports() {
  const [reports, setReports] = useState<AdminReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminReportResponse | null>(null);
  const [selectedParsedInfo, setSelectedParsedInfo] = useState<ParsedReportInfo | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<'Đang xử lý' | 'Đã xử lý'>('Đang xử lý');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading reports with status filter:', statusFilter || 'none');
      const reportsData = await adminReportsService.getAllReports(statusFilter || undefined);
      console.log('✅ Loaded reports:', reportsData);
      console.log('✅ Reports count:', reportsData.length);
      if (reportsData.length > 0) {
        const firstReport = reportsData[0];
        console.log('✅ First report (full):', JSON.stringify(firstReport, null, 2));
        console.log('✅ First report keys:', Object.keys(firstReport));
        console.log('✅ First report.ReportId:', firstReport.ReportId);
        console.log('✅ First report.UserId:', firstReport.UserId);
        console.log('✅ First report.UserFullName:', firstReport.UserFullName);
        console.log('✅ First report.Description:', firstReport.Description);
        console.log('✅ First report.Status:', firstReport.Status);
        console.log('✅ First report.CreatedAt:', firstReport.CreatedAt);
      }
      setReports(reportsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu báo cáo');
      console.error('❌ Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload when status filter changes
  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;
    
    try {
      setUpdatingStatus(true);
      await adminReportsService.updateReportStatus(selectedReport.ReportId, newStatus);
      await loadData();
      setIsUpdateOpen(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openDetail = (report: AdminReportResponse) => {
    setSelectedReport(report);
    const parsedInfo = adminReportsService.parseReportDescription(report.Description);
    setSelectedParsedInfo(parsedInfo);
    setIsDetailOpen(true);
  };

  const openUpdate = (report: AdminReportResponse) => {
    setSelectedReport(report);
    setNewStatus(report.Status === 'Đã xử lý' ? 'Đã xử lý' : 'Đang xử lý');
    setIsUpdateOpen(true);
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    switch (status) {
      case 'Đã xử lý': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'Đang xử lý': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'Chưa xử lý': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusText = (status: string | null | undefined) => {
    return status || 'Chưa xử lý';
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <>
      <PageMeta title="Quản Lý Báo Cáo" description="Quản lý và xử lý các báo cáo từ người dùng" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Báo Cáo</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              startIcon={<RefreshIcon className="h-4 w-4" />}
              onClick={loadData}
              disabled={loading}
            >
              Làm mới
            </Button>
          </div>
        </div>

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
        <div className="mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Chưa xử lý">Chưa xử lý</option>
            <option value="Đang xử lý">Đang xử lý</option>
            <option value="Đã xử lý">Đã xử lý</option>
          </select>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người gửi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài thi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</TableCell>
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
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Chưa có báo cáo nào
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report, index) => {
                  const parsedInfo = adminReportsService.parseReportDescription(report.Description);
                  return (
                    <TableRow key={report.ReportId || `report-${index}`} className="border-t border-gray-100 dark:border-gray-800">
                      <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        #{report.ReportId}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {report.UserFullName || `User #${report.UserId}`}
                          </div>
                          <div className="text-xs text-gray-500">{report.UserEmail || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {parsedInfo.examId ? (
                          <div>
                            <div className="font-medium text-blue-600 dark:text-blue-400">
                              Bài thi #{parsedInfo.examId}
                            </div>
                            {parsedInfo.attemptId && (
                              <div className="text-xs text-gray-500">Lần làm: #{parsedInfo.attemptId}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 dark:text-white line-clamp-2">
                            {parsedInfo.description || (report.Description ? report.Description.substring(0, 100) : 'N/A')}
                          </div>
                          {parsedInfo.cloudinaryUrls.length > 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              📎 {parsedInfo.cloudinaryUrls.length} ảnh đính kèm
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(report.Status)}`}>
                          {getStatusText(report.Status)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {formatDate(report.CreatedAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" startIcon={<EyeIcon className="h-4 w-4" />} onClick={() => openDetail(report)}>
                            Chi tiết
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openUpdate(report)}>
                            Cập nhật
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
      </div>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-4xl p-6">
        {selectedReport && selectedParsedInfo && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Chi Tiết Báo Cáo #{selectedReport.ReportId}</h3>
              <Button variant="outline" onClick={() => openUpdate(selectedReport)}>
                Cập nhật trạng thái
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm font-medium">Người gửi:</span>
                  <div className="mt-1">
                    <div className="font-medium">{selectedReport.UserFullName || `User #${selectedReport.UserId}`}</div>
                    <div className="text-sm text-gray-500">{selectedReport.UserEmail || 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm font-medium">Bài thi:</span>
                  <div className="mt-1">
                    {selectedParsedInfo.examId ? (
                      <div>
                        <div className="font-medium text-blue-600 dark:text-blue-400">
                          Bài thi #{selectedParsedInfo.examId}
                        </div>
                        {selectedParsedInfo.attemptId && (
                          <div className="text-sm text-gray-500">Lần làm: #{selectedParsedInfo.attemptId}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Không có thông tin</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm font-medium">Trạng thái:</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(selectedReport.Status)}`}>
                      {getStatusText(selectedReport.Status)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm font-medium">Ngày tạo:</span>
                  <div className="mt-1 font-medium">{formatDate(selectedReport.CreatedAt)}</div>
                </div>
                {selectedReport.UpdatedAt && (
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Cập nhật lần cuối:</span>
                    <div className="mt-1 font-medium">{formatDate(selectedReport.UpdatedAt)}</div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm font-medium">Mô tả:</span>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedParsedInfo.description || selectedReport.Description || 'N/A'}
                  </div>
                </div>
                {selectedParsedInfo.cloudinaryUrls.length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Ảnh đính kèm ({selectedParsedInfo.cloudinaryUrls.length}):</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {selectedParsedInfo.cloudinaryUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative group"
                        >
                          <img
                            src={url}
                            alt={`Attachment ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">Xem ảnh</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={isUpdateOpen} onClose={() => setIsUpdateOpen(false)} className="max-w-sm p-6">
        {selectedReport && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cập nhật trạng thái báo cáo</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái mới:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'Đang xử lý' | 'Đã xử lý')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Đã xử lý">Đã xử lý</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUpdateOpen(false)} disabled={updatingStatus}>
                Hủy
              </Button>
              <Button onClick={handleUpdateStatus} disabled={updatingStatus}>
                {updatingStatus ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}