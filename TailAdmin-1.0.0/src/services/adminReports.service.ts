/**
 * Admin Reports Service
 * Xử lý báo cáo từ người dùng (user reports) cho admin
 */

import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface AdminReportResponse {
  ReportId: number;
  UserId: number;
  UserEmail?: string;
  UserFullName?: string;
  Description: string;
  Status: string;
  AttachmentPath?: string | null;
  CreatedAt: string | Date;
  UpdatedAt?: string | Date | null;
}

export interface UpdateReportStatusRequest {
  Status: 'Đang xử lý' | 'Đã xử lý';
}

export interface ParsedReportInfo {
  examId?: number;
  attemptId?: number;
  description: string;
  cloudinaryUrls: string[];
}

class AdminReportsService extends ApiService {
  /**
   * Lấy danh sách tất cả báo cáo (Admin)
   * @param status - Lọc theo trạng thái (optional)
   */
  async getAllReports(status?: string): Promise<AdminReportResponse[]> {
    try {
      const params = status ? { status } : {};
      
      // Gọi trực tiếp ChatService vì API Gateway có thể không route đúng
      const chatServiceBase = 'http://localhost:5004';
      const endpoint = `${chatServiceBase}/api/admin/reports`;
      const queryString = status ? `?status=${encodeURIComponent(status)}` : '';
      const fullUrl = `${endpoint}${queryString}`;
      
      console.log('📤 Fetching admin reports from ChatService:', fullUrl);
      
      // Lấy token từ localStorage
      const token = localStorage.getItem('accessToken') || 
                    localStorage.getItem('access_token') ||
                    localStorage.getItem('ACCESS_TOKEN') ||
                    localStorage.getItem('token');
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });
      
      console.log('📥 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('📥 Admin reports API response:', responseData);
      
      // Backend trả về: { success: true, data: AdminReportResponse[], count: number }
      if (responseData.success && Array.isArray(responseData.data)) {
        console.log('✅ Loaded reports count:', responseData.data.length);
        if (responseData.data.length > 0) {
          const firstReport = responseData.data[0];
          console.log('✅ First report sample (full):', JSON.stringify(firstReport, null, 2));
          console.log('✅ First report keys:', Object.keys(firstReport));
          console.log('✅ First report.ReportId:', firstReport.ReportId);
          console.log('✅ First report.reportId:', firstReport.reportId);
          console.log('✅ First report.UserId:', firstReport.UserId);
          console.log('✅ First report.userId:', firstReport.userId);
          console.log('✅ First report.UserFullName:', firstReport.UserFullName);
          console.log('✅ First report.userFullName:', firstReport.userFullName);
          console.log('✅ First report.Description:', firstReport.Description);
          console.log('✅ First report.description:', firstReport.description);
          console.log('✅ First report.Status:', firstReport.Status);
          console.log('✅ First report.status:', firstReport.status);
          console.log('✅ First report.CreatedAt:', firstReport.CreatedAt);
          console.log('✅ First report.createdAt:', firstReport.createdAt);
        }
        
        // Map dữ liệu để đảm bảo đúng format (hỗ trợ cả PascalCase và camelCase)
        const mappedReports = responseData.data.map((item: any) => ({
          ReportId: item.ReportId || item.reportId,
          UserId: item.UserId || item.userId,
          UserEmail: item.UserEmail || item.userEmail,
          UserFullName: item.UserFullName || item.userFullName,
          Description: item.Description || item.description,
          Status: item.Status || item.status,
          AttachmentPath: item.AttachmentPath || item.attachmentPath,
          CreatedAt: item.CreatedAt || item.createdAt,
          UpdatedAt: item.UpdatedAt || item.updatedAt,
        }));
        
        console.log('✅ Mapped reports:', mappedReports);
        return mappedReports;
      }
      
      // Fallback: nếu response.data không tồn tại, thử response trực tiếp
      if (Array.isArray(responseData)) {
        console.log('⚠️ Response is direct array, not wrapped');
        return responseData;
      }
      
      console.warn('⚠️ Unexpected response format:', responseData);
      return [];
    } catch (error) {
      console.error('❌ Error fetching admin reports:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : error);
      throw new Error('Không thể tải danh sách báo cáo');
    }
  }

  /**
   * Cập nhật trạng thái báo cáo
   * @param reportId - ID của báo cáo
   * @param status - Trạng thái mới: "Đang xử lý" hoặc "Đã xử lý"
   */
  async updateReportStatus(reportId: number, status: 'Đang xử lý' | 'Đã xử lý'): Promise<AdminReportResponse> {
    try {
      // Gọi trực tiếp ChatService
      const chatServiceBase = 'http://localhost:5004';
      const endpoint = `${chatServiceBase}/api/admin/reports/${reportId}`;
      
      console.log('📤 Updating report status:', endpoint, 'Status:', status);
      
      // Lấy token từ localStorage
      const token = localStorage.getItem('accessToken') || 
                    localStorage.getItem('access_token') ||
                    localStorage.getItem('ACCESS_TOKEN') ||
                    localStorage.getItem('token');
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ Status: status }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('✅ Update response:', responseData);
      
      if (responseData.success && responseData.data) {
        return responseData.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('❌ Error updating report status:', error);
      throw new Error('Không thể cập nhật trạng thái báo cáo');
    }
  }

  /**
   * Parse description để extract exam ID, attempt ID và Cloudinary URLs
   */
  parseReportDescription(description: string | null | undefined): ParsedReportInfo {
    const result: ParsedReportInfo = {
      description: '',
      cloudinaryUrls: [],
    };

    // Kiểm tra description có tồn tại và là string
    if (!description || typeof description !== 'string') {
      result.description = description || '';
      return result;
    }

    // Parse exam ID và attempt ID từ format: [Bài thi ID: 1067, Lần làm: 1175]
    const examIdMatch = description.match(/\[Bài thi ID:\s*(\d+)/);
    if (examIdMatch) {
      result.examId = parseInt(examIdMatch[1], 10);
    }

    const attemptIdMatch = description.match(/Lần làm:\s*(\d+)\]/);
    if (attemptIdMatch) {
      result.attemptId = parseInt(attemptIdMatch[1], 10);
    }

    // Extract Cloudinary URLs từ format: 📎 Đính kèm (Cloudinary URLs):\n1. https://...
    const cloudinarySectionMatch = description.match(/📎 Đính kèm \(Cloudinary URLs\):\s*\n((?:\d+\.\s*https?:\/\/[^\n]+\n?)+)/);
    if (cloudinarySectionMatch && cloudinarySectionMatch[1]) {
      const urlsText = cloudinarySectionMatch[1];
      try {
        const urlMatches = urlsText.matchAll(/\d+\.\s*(https?:\/\/[^\n]+)/g);
        for (const match of urlMatches) {
          if (match[1]) {
            result.cloudinaryUrls.push(match[1].trim());
          }
        }
      } catch (error) {
        console.warn('Error parsing Cloudinary URLs:', error);
      }
    }

    // Extract phần description thực tế (bỏ phần metadata)
    let cleanDescription = description;
    
    // Remove exam ID section
    cleanDescription = cleanDescription.replace(/\[Bài thi ID:[\s\S]*?\]\s*\n\n/, '');
    
    // Remove Cloudinary URLs section
    cleanDescription = cleanDescription.replace(/📎 Đính kèm \(Cloudinary URLs\):[\s\S]*/, '').trim();
    
    result.description = cleanDescription || description;

    return result;
  }
}

export const adminReportsService = new AdminReportsService();
export default adminReportsService;

