// Materials Service for TailAdmin
// Manages learning materials API calls - khớp với MaterialsService backend

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

// DTOs khớp với MaterialListItemDto từ backend
export interface Material {
  id: number;
  title: string;
  description?: string;
  mediaType?: string;
  isPaid: boolean;
  price?: number;
  externalLink?: string;
  fileUrl?: string; // URL của file đã upload (nếu backend trả về)
  durationSeconds?: number;
  courseId: number;
  orderIndex?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

// Note: Create và Update sử dụng FormData trực tiếp, không cần interface riêng
// FormData fields:
// - Create: courseId, title, description, isPaid, price, orderIndex, files (IFormFileCollection)
// - Update: CourseId, Title, Description, IsPaid, Price, OrderIndex, File (IFormFile?)

class MaterialsService {
  // Get all materials với pagination và search
  async getMaterials(params?: { 
    pageIndex?: number; 
    pageSize?: number; 
    search?: string;
  }): Promise<PagedResponse<Material>> {
    try {
      const query = new URLSearchParams();
      if (params?.pageIndex) query.append('pageIndex', String(params.pageIndex));
      if (params?.pageSize) query.append('pageSize', String(params.pageSize));
      if (params?.search) query.append('search', params.search);

      const endpoint = `${API_ENDPOINTS.materials.getAll}${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await apiService.get<any>(endpoint);
      
      // Backend trả về: { pageIndex, pageSize, totalItems, totalPages, items }
      const data = res.Data || res.data || res;
      
      // Nếu response không có cấu trúc pagination, wrap nó
      if (Array.isArray(data)) {
        return {
          items: data,
          totalItems: data.length,
          pageIndex: params?.pageIndex || 1,
          pageSize: params?.pageSize || 10,
          totalPages: Math.ceil(data.length / (params?.pageSize || 10)),
        };
      }
      
      return data as PagedResponse<Material>;
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  }

  // Get material by ID
  async getMaterialById(id: string | number): Promise<Material> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.materials.getById(String(id)));
      const data = res.Data || res.data || res;
      return data as Material;
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error);
      throw error;
    }
  }

  // Get materials by course ID
  async getMaterialsByCourseId(courseId: string | number): Promise<Material[]> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.materials.getByCourseId(courseId));
      const data = res.Data || res.data || res;
      
      // Backend trả về: { items: [...], pageIndex, pageSize, totalItems, totalPages }
      // Hoặc có thể là array trực tiếp
      if (Array.isArray(data)) {
        return data;
      }
      
      // Nếu là object có items property
      if (data && typeof data === 'object' && Array.isArray(data.items)) {
        return data.items;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching materials for course ${courseId}:`, error);
      // Return empty array if error (course might not have materials yet)
      return [];
    }
  }

  // Create new material (upload files)
  async createMaterial(formData: FormData): Promise<{ materialId: number; fileName: string; url: string }[]> {
    try {
      // Backend MaterialsService.CreateManyAsync nhận FormData với:
      // courseId, title, description, isPaid, price, orderIndex, files
      console.log('📤 Creating material with FormData:', {
        courseId: formData.get('courseId'),
        title: formData.get('title'),
        description: formData.get('description'),
        isPaid: formData.get('isPaid'),
        price: formData.get('price'),
        orderIndex: formData.get('orderIndex'),
        filesCount: formData.getAll('files').length
      });
      
      const res = await apiService.post<any>(API_ENDPOINTS.materials.create, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('✅ Material created successfully:', res);
      const data = res.Data || res.data || res;
      return Array.isArray(data) ? data : [data];
    } catch (error: any) {
      console.error('❌ Error creating material:', error);
      // Extract error message from response if available
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Lỗi hệ thống khi tạo tài liệu';
      throw new Error(errorMessage);
    }
  }

  // Update material (có thể upload file mới)
  async updateMaterial(id: string | number, formData: FormData): Promise<Material> {
    try {
      // Backend nhận FormData với: CourseId, Title, Description, IsPaid, Price, OrderIndex, File
      const res = await apiService.put<any>(API_ENDPOINTS.materials.update(String(id)), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.Data || res.data || res;
      return data as Material;
    } catch (error) {
      console.error(`Error updating material ${id}:`, error);
      throw error;
    }
  }

  // Delete material
  async deleteMaterial(id: string | number): Promise<void> {
    try {
      await apiService.delete(API_ENDPOINTS.materials.delete(String(id)));
    } catch (error) {
      console.error(`Error deleting material ${id}:`, error);
      throw error;
    }
  }

  async extractFileAndSuggest(payload: { file: File; subjectId?: number; count?: number; }): Promise<{ fileName: string; contentPreview: string; suggestions: { Question: string; Options: string[]; CorrectAnswer: string; }[] }> {
    const form = new FormData();
    form.append('file', payload.file);
    if (payload.subjectId) form.append('subjectId', String(payload.subjectId));
    if (payload.count) form.append('count', String(payload.count));
    const res = await apiService.post<any>(API_ENDPOINTS.materials.extractFile, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = res?.data ?? res ?? {};
    const fileName = data.fileName ?? '';
    const contentPreview = data.contentPreview ?? '';
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    return { fileName, contentPreview, suggestions };
  }
}

export const materialsService = new MaterialsService();
export default materialsService;
