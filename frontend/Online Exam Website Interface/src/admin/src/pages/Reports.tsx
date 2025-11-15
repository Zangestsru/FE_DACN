import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { PlusIcon, EyeIcon, DownloadIcon, ArrowUpIcon as RefreshIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { 
  reportsService, 
  type Report, 
  type ReportTemplate, 
  type GenerateReportRequest 
} from "../services/reports.service";

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  // Form data for creating reports
  const [createForm, setCreateForm] = useState<Partial<GenerateReportRequest>>({
    title: "",
    description: "",
    type: "system_overview",
    format: "pdf",
    parameters: {}
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh for generating reports
  useEffect(() => {
    if (generatingReports.size > 0) {
      const interval = setInterval(() => {
        checkGeneratingReports();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [generatingReports]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load reports and templates in parallel
      const [reportsData, templatesData] = await Promise.all([
        reportsService.getReports().catch(() => []),
        reportsService.getReportTemplates().catch(() => [])
      ]);

      setReports(reportsData);
      setTemplates(templatesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu báo cáo');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkGeneratingReports = async () => {
    const currentGenerating = new Set(generatingReports);
    
    for (const reportId of generatingReports) {
      try {
        const status = await reportsService.getReportStatus(reportId);
        
        if (status.status === 'completed' || status.status === 'failed') {
          currentGenerating.delete(reportId);
        }
      } catch (err) {
        currentGenerating.delete(reportId);
      }
    }

    setGeneratingReports(currentGenerating);
    
    if (currentGenerating.size !== generatingReports.size) {
      await loadData(); // Refresh the reports list
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const report = await reportsService.generateReport(createForm as GenerateReportRequest);
      
      if (report.status === 'generating') {
        setGeneratingReports(prev => new Set([...prev, report.id]));
      }
      
      await loadData();
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo báo cáo');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await reportsService.deleteReport(reportId);
      await loadData();
      setIsDeleteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa báo cáo');
    }
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      if (report.status !== 'completed' || !report.fileUrl) {
        setError('Báo cáo chưa sẵn sàng để tải');
        return;
      }

      await reportsService.downloadReport(report.id, `${report.title}.${report.format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải báo cáo');
    }
  };

  const handleGenerateQuickReport = async (type: 'exam_summary' | 'user_performance' | 'system_overview') => {
    try {
      let report: Report;
      
      switch (type) {
        case 'exam_summary':
          report = await reportsService.generateExamSummaryReport([]);
          break;
        case 'user_performance':
          report = await reportsService.generateUserPerformanceReport([]);
          break;
        case 'system_overview':
          report = await reportsService.generateSystemOverviewReport();
          break;
        default:
          throw new Error('Loại báo cáo không hợp lệ');
      }

      if (report.status === 'generating') {
        setGeneratingReports(prev => new Set([...prev, report.id]));
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo báo cáo nhanh');
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      type: "system_overview",
      format: "pdf",
      parameters: {}
    });
  };

  const openDetail = (report: Report) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const openDelete = (report: Report) => {
    setSelectedReport(report);
    setIsDeleteOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'generating': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'generating': return 'Đang tạo';
      case 'failed': return 'Thất bại';
      case 'draft': return 'Nháp';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'exam_summary': return 'Tổng hợp kết quả thi';
      case 'user_performance': return 'Hiệu suất học tập';
      case 'system_overview': return 'Tổng quan hệ thống';
      case 'custom': return 'Tùy chỉnh';
      default: return type;
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchType = !typeFilter || report.type === typeFilter;
    const matchStatus = !statusFilter || report.status === statusFilter;
    const matchDateFrom = !dateFromFilter || report.createdDate >= dateFromFilter;
    const matchDateTo = !dateToFilter || report.createdDate <= dateToFilter;
    
    return matchType && matchStatus && matchDateFrom && matchDateTo;
  });

  return (
    <>
      <PageMeta title="Quản Lý Báo Cáo" />
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
            <Button
              startIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Tạo Báo Cáo
            </Button>
          </div>
        </div>

        {/* Quick Report Generation */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3">Báo Cáo Nhanh</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateQuickReport('system_overview')}
            >
              Tổng quan hệ thống
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateQuickReport('exam_summary')}
            >
              Kết quả thi
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateQuickReport('user_performance')}
            >
              Hiệu suất học tập
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
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả loại báo cáo</option>
            <option value="exam_summary">Tổng hợp kết quả thi</option>
            <option value="user_performance">Hiệu suất học tập</option>
            <option value="system_overview">Tổng quan hệ thống</option>
            <option value="custom">Tùy chỉnh</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="completed">Hoàn thành</option>
            <option value="generating">Đang tạo</option>
            <option value="failed">Thất bại</option>
            <option value="draft">Nháp</option>
          </select>

          <input
            type="date"
            value={dateFromFilter}
            onChange={(e) => setDateFromFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
            placeholder="Từ ngày"
          />

          <input
            type="date"
            value={dateToFilter}
            onChange={(e) => setDateToFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
            placeholder="Đến ngày"
          />
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Định dạng</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {reports.length === 0 ? "Chưa có báo cáo nào" : "Không tìm thấy kết quả nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id} className="border-t border-gray-100 dark:border-gray-800">
                    <TableCell className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {report.title}
                        </div>
                        <div className="text-xs text-gray-500">{report.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-blue-200 text-blue-600 dark:ring-blue-900/40">
                        {getTypeText(report.type)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`font-medium ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </span>
                        {generatingReports.has(report.id) && (
                          <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {report.format.toUpperCase()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {new Date(report.createdDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" startIcon={<EyeIcon className="h-4 w-4" />} onClick={() => openDetail(report)}>
                          Chi tiết
                        </Button>
                        {report.status === 'completed' && report.fileUrl && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            startIcon={<DownloadIcon className="h-4 w-4" />}
                            onClick={() => handleDownloadReport(report)}
                          >
                            Tải
                          </Button>
                        )}
                        <Button size="sm" className="!bg-red-500 hover:!bg-red-600" startIcon={<TrashBinIcon className="h-4 w-4" />} onClick={() => openDelete(report)}>
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

      {/* Create Report Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => {setIsCreateOpen(false); resetCreateForm();}} className="max-w-2xl p-6">
        <form onSubmit={handleCreateReport} className="space-y-4">
          <h3 className="text-xl font-semibold">Tạo Báo Cáo Mới</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm(prev => ({...prev, title: e.target.value}))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({...prev, description: e.target.value}))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loại báo cáo *
              </label>
              <select
                required
                value={createForm.type}
                onChange={(e) => setCreateForm(prev => ({...prev, type: e.target.value}))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="system_overview">Tổng quan hệ thống</option>
                <option value="exam_summary">Tổng hợp kết quả thi</option>
                <option value="user_performance">Hiệu suất học tập</option>
                <option value="custom">Tùy chỉnh</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Định dạng *
              </label>
              <select
                required
                value={createForm.format}
                onChange={(e) => setCreateForm(prev => ({...prev, format: e.target.value as 'pdf' | 'excel' | 'csv'}))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => {setIsCreateOpen(false); resetCreateForm();}}>
              Hủy
            </Button>
            <Button type="submit">
              Tạo Báo Cáo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-3xl p-6">
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Chi Tiết Báo Cáo</h3>
              {selectedReport.status === 'completed' && selectedReport.fileUrl && (
                <Button 
                  variant="outline" 
                  startIcon={<DownloadIcon className="h-4 w-4" />}
                  onClick={() => handleDownloadReport(selectedReport)}
                >
                  Tải Báo Cáo
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Tiêu đề:</span>
                  <div className="font-medium">{selectedReport.title}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Mô tả:</span>
                  <div className="text-sm">{selectedReport.description}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Loại:</span>
                  <div className="font-medium">{getTypeText(selectedReport.type)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Định dạng:</span>
                  <div className="font-medium">{selectedReport.format.toUpperCase()}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Trạng thái:</span>
                  <div className={`font-medium ${getStatusColor(selectedReport.status)}`}>
                    {getStatusText(selectedReport.status)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Người tạo:</span>
                  <div className="font-medium">{selectedReport.createdBy}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Ngày tạo:</span>
                  <div className="font-medium">{new Date(selectedReport.createdDate).toLocaleString('vi-VN')}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Cập nhật lần cuối:</span>
                  <div className="font-medium">{new Date(selectedReport.lastModified).toLocaleString('vi-VN')}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-sm p-6">
        {selectedReport && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Xóa Báo Cáo?</h3>
            <p className="text-sm text-gray-600">
              Bạn chắc chắn muốn xóa báo cáo "{selectedReport.title}"? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
              <Button className="!bg-red-500 hover:!bg-red-600" onClick={() => handleDeleteReport(selectedReport.id)}>
                Xóa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}