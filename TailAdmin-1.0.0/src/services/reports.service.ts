import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Report {
  id: string;
  title: string;
  description: string;
  type: 'exam_summary' | 'user_performance' | 'system_overview' | 'custom';
  status: 'draft' | 'generating' | 'completed' | 'failed';
  createdBy: string;
  createdDate: string;
  lastModified: string;
  parameters: ReportParameters;
  data: any;
  fileUrl?: string;
  format: 'pdf' | 'excel' | 'csv';
}

export interface ReportParameters {
  dateFrom?: string;
  dateTo?: string;
  examIds?: string[];
  userIds?: string[];
  subjects?: string[];
  includeCharts?: boolean;
  includeDetails?: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  parameters: ReportTemplateParameter[];
  isActive: boolean;
}

export interface ReportTemplateParameter {
  name: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
}

export interface GenerateReportRequest {
  templateId?: string;
  title: string;
  description: string;
  type: string;
  parameters: ReportParameters;
  format: 'pdf' | 'excel' | 'csv';
}

class ReportsService extends ApiService {
  // Get all reports
  async getReports(): Promise<Report[]> {
    try {
      const response = await this.get<Report[]>(API_ENDPOINTS.reports.getAll);
      return response;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Không thể tải danh sách báo cáo');
    }
  }

  // Get report by ID
  async getReport(id: string): Promise<Report> {
    try {
      const response = await this.get<Report>(API_ENDPOINTS.reports.getById(id));
      return response;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw new Error('Không thể tải báo cáo');
    }
  }

  // Create a new report
  async createReport(reportData: Omit<Report, 'id' | 'createdDate' | 'lastModified' | 'status'>): Promise<Report> {
    try {
      const response = await this.post<Report>(API_ENDPOINTS.reports.create, reportData);
      return response;
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error('Không thể tạo báo cáo');
    }
  }

  // Update report
  async updateReport(id: string, reportData: Partial<Report>): Promise<Report> {
    try {
      const response = await this.put<Report>(API_ENDPOINTS.reports.update(id), reportData);
      return response;
    } catch (error) {
      console.error('Error updating report:', error);
      throw new Error('Không thể cập nhật báo cáo');
    }
  }

  // Delete report
  async deleteReport(id: string): Promise<void> {
    try {
      await this.delete(API_ENDPOINTS.reports.delete(id));
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error('Không thể xóa báo cáo');
    }
  }

  // Generate a new report
  async generateReport(request: GenerateReportRequest): Promise<Report> {
    try {
      const response = await this.post<Report>(API_ENDPOINTS.reports.generate, request);
      return response;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Không thể tạo báo cáo');
    }
  }

  // Export report to file
  async exportReport(id: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.reports.export(id)}?format=${format}`, {
        method: 'GET',
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting report:', error);
      throw new Error('Không thể xuất báo cáo');
    }
  }

  // Get report templates
  async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const response = await this.get<ReportTemplate[]>(API_ENDPOINTS.reports.templates);
      return response;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw new Error('Không thể tải danh sách mẫu báo cáo');
    }
  }

  // Generate predefined reports
  async generateExamSummaryReport(examIds: string[], dateFrom?: string, dateTo?: string): Promise<Report> {
    return this.generateReport({
      title: 'Báo cáo tổng hợp kết quả thi',
      description: 'Báo cáo chi tiết về kết quả các bài thi đã chọn',
      type: 'exam_summary',
      format: 'pdf',
      parameters: {
        examIds,
        dateFrom,
        dateTo,
        includeCharts: true,
        includeDetails: true
      }
    });
  }

  async generateUserPerformanceReport(userIds: string[], dateFrom?: string, dateTo?: string): Promise<Report> {
    return this.generateReport({
      title: 'Báo cáo hiệu suất học tập',
      description: 'Báo cáo chi tiết về hiệu suất học tập của học sinh',
      type: 'user_performance',
      format: 'pdf',
      parameters: {
        userIds,
        dateFrom,
        dateTo,
        includeCharts: true,
        includeDetails: true
      }
    });
  }

  async generateSystemOverviewReport(dateFrom?: string, dateTo?: string): Promise<Report> {
    return this.generateReport({
      title: 'Báo cáo tổng quan hệ thống',
      description: 'Báo cáo tổng quan về hoạt động của hệ thống',
      type: 'system_overview',
      format: 'pdf',
      parameters: {
        dateFrom,
        dateTo,
        includeCharts: true,
        includeDetails: true
      }
    });
  }

  // Download report file
  async downloadReport(id: string, filename?: string): Promise<void> {
    try {
      const report = await this.getReport(id);
      
      if (!report.fileUrl) {
        throw new Error('Báo cáo chưa có file để tải');
      }

      const response = await fetch(report.fileUrl);
      if (!response.ok) {
        throw new Error('Không thể tải file báo cáo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename || `report-${report.id}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      throw new Error('Không thể tải báo cáo');
    }
  }

  // Get report status for polling
  async getReportStatus(id: string): Promise<{ status: string; progress?: number; error?: string }> {
    try {
      const response = await this.get<{ status: string; progress?: number; error?: string }>(`${API_ENDPOINTS.reports.getById(id)}/status`);
      return response;
    } catch (error) {
      console.error('Error fetching report status:', error);
      throw new Error('Không thể kiểm tra trạng thái báo cáo');
    }
  }
}

export const reportsService = new ReportsService();