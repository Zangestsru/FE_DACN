// Subjects Service
import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Subject {
  subjectId: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CreateSubjectRequest {
  name: string;
  description?: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  description?: string;
}

class SubjectsService {
  // Lấy danh sách tất cả môn học
  async getSubjects(): Promise<Subject[]> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.subjects.getAll);
      const debug = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production') && (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true');
      const log = (...args: unknown[]) => { if (debug) console.log(...args); };
      log('📦 SubjectsService.getSubjects - Raw response:', res);
      
      // Backend trả về: { message: "...", data: [...] }
      // Hoặc có thể là: { data: { message: "...", data: [...] } }
      let subjectsArray: any[] = [];
      
      if (res && typeof res === 'object') {
        // Trường hợp 1: res = { message: "...", data: [...] }
        if (Array.isArray(res.data)) {
          subjectsArray = res.data;
        }
        // Trường hợp 2: res = { data: { message: "...", data: [...] } }
        else if (res.data && res.data.data && Array.isArray(res.data.data)) {
          subjectsArray = res.data.data;
        }
        // Trường hợp 3: res = { Data: [...] }
        else if (Array.isArray(res.Data)) {
          subjectsArray = res.Data;
        }
        // Trường hợp 4: res = { Data: { message: "...", data: [...] } }
        else if (res.Data && res.Data.data && Array.isArray(res.Data.data)) {
          subjectsArray = res.Data.data;
        }
        // Trường hợp 5: res là array trực tiếp
        else if (Array.isArray(res)) {
          subjectsArray = res;
        }
      }
      
      log('✅ SubjectsService.getSubjects - Parsed subjects:', subjectsArray.length);
      
      return subjectsArray.map((s: any) => ({
        subjectId: s.SubjectId ?? s.subjectId ?? 0,
        name: s.Name ?? s.name ?? '',
        description: s.Description ?? s.description,
        createdAt: s.CreatedAt ?? s.createdAt ?? new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  }

  // Lấy chi tiết môn học theo ID
  async getSubjectById(id: number): Promise<Subject> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.subjects.getById(String(id)));
      const debug = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production') && (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true');
      const log = (...args: unknown[]) => { if (debug) console.log(...args); };
      log('📦 SubjectsService.getSubjectById - Raw response:', res);
      
      // Backend trả về: { message: "...", data: { SubjectId, Name, ... } }
      let subjectData: any = null;
      
      if (res && typeof res === 'object') {
        // Trường hợp 1: res = { message: "...", data: { ... } }
        if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
          subjectData = res.data;
        }
        // Trường hợp 2: res = { data: { message: "...", data: { ... } } }
        else if (res.data && res.data.data && typeof res.data.data === 'object') {
          subjectData = res.data.data;
        }
        // Trường hợp 3: res = { Data: { ... } }
        else if (res.Data && typeof res.Data === 'object' && !Array.isArray(res.Data)) {
          subjectData = res.Data;
        }
        // Trường hợp 4: res = { Data: { data: { ... } } }
        else if (res.Data && res.Data.data && typeof res.Data.data === 'object') {
          subjectData = res.Data.data;
        }
        // Trường hợp 5: res là object trực tiếp (không có wrapper)
        else if (!res.message && !res.data && !res.Data) {
          subjectData = res;
        }
      }
      
      if (subjectData) {
        return {
          subjectId: subjectData.SubjectId ?? subjectData.subjectId ?? 0,
          name: subjectData.Name ?? subjectData.name ?? '',
          description: subjectData.Description ?? subjectData.description,
          createdAt: subjectData.CreatedAt ?? subjectData.createdAt ?? new Date().toISOString(),
        };
      }
      
      throw new Error('Subject not found');
    } catch (error) {
      console.error(`Error fetching subject ${id}:`, error);
      throw error;
    }
  }

  // Tạo môn học mới
  async createSubject(request: CreateSubjectRequest): Promise<Subject> {
    try {
      const res = await apiService.post<any>(API_ENDPOINTS.subjects.create, request);
      const debug = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production') && (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true');
      const log = (...args: unknown[]) => { if (debug) console.log(...args); };
      log('📦 SubjectsService.createSubject - Raw response:', res);
      
      // Backend trả về: { message: "...", data: { SubjectId, Name, ... } }
      let subjectData: any = null;
      
      if (res && typeof res === 'object') {
        // Trường hợp 1: res = { message: "...", data: { ... } }
        if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
          subjectData = res.data;
        }
        // Trường hợp 2: res = { data: { message: "...", data: { ... } } }
        else if (res.data && res.data.data && typeof res.data.data === 'object') {
          subjectData = res.data.data;
        }
        // Trường hợp 3: res = { Data: { ... } }
        else if (res.Data && typeof res.Data === 'object' && !Array.isArray(res.Data)) {
          subjectData = res.Data;
        }
        // Trường hợp 4: res = { Data: { data: { ... } } }
        else if (res.Data && res.Data.data && typeof res.Data.data === 'object') {
          subjectData = res.Data.data;
        }
        // Trường hợp 5: res là object trực tiếp (không có wrapper)
        else if (!res.message && !res.data && !res.Data) {
          subjectData = res;
        }
      }
      
      if (subjectData) {
        return {
          subjectId: subjectData.SubjectId ?? subjectData.subjectId ?? 0,
          name: subjectData.Name ?? subjectData.name ?? '',
          description: subjectData.Description ?? subjectData.description,
          createdAt: subjectData.CreatedAt ?? subjectData.createdAt ?? new Date().toISOString(),
        };
      }
      
      console.error('❌ SubjectsService.createSubject - Invalid response format:', res);
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  }

  // Cập nhật môn học
  async updateSubject(id: number, request: UpdateSubjectRequest): Promise<Subject> {
    try {
      const res = await apiService.put<any>(API_ENDPOINTS.subjects.update(String(id)), request);
      const debug = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production') && (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true');
      const log = (...args: unknown[]) => { if (debug) console.log(...args); };
      log('📦 SubjectsService.updateSubject - Raw response:', res);
      
      // Backend trả về: { message: "...", data: { SubjectId, Name, ... } }
      let subjectData: any = null;
      
      if (res && typeof res === 'object') {
        // Trường hợp 1: res = { message: "...", data: { ... } }
        if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
          subjectData = res.data;
        }
        // Trường hợp 2: res = { data: { message: "...", data: { ... } } }
        else if (res.data && res.data.data && typeof res.data.data === 'object') {
          subjectData = res.data.data;
        }
        // Trường hợp 3: res = { Data: { ... } }
        else if (res.Data && typeof res.Data === 'object' && !Array.isArray(res.Data)) {
          subjectData = res.Data;
        }
        // Trường hợp 4: res = { Data: { data: { ... } } }
        else if (res.Data && res.Data.data && typeof res.Data.data === 'object') {
          subjectData = res.Data.data;
        }
        // Trường hợp 5: res là object trực tiếp (không có wrapper)
        else if (!res.message && !res.data && !res.Data) {
          subjectData = res;
        }
      }
      
      if (subjectData) {
        return {
          subjectId: subjectData.SubjectId ?? subjectData.subjectId ?? 0,
          name: subjectData.Name ?? subjectData.name ?? '',
          description: subjectData.Description ?? subjectData.description,
          createdAt: subjectData.CreatedAt ?? subjectData.createdAt ?? new Date().toISOString(),
        };
      }
      
      console.error('❌ SubjectsService.updateSubject - Invalid response format:', res);
      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Error updating subject ${id}:`, error);
      throw error;
    }
  }

  // Xóa môn học
  async deleteSubject(id: number): Promise<void> {
    try {
      await apiService.delete<any>(API_ENDPOINTS.subjects.delete(String(id)));
    } catch (error) {
      console.error(`Error deleting subject ${id}:`, error);
      throw error;
    }
  }
}

export const subjectsService = new SubjectsService();
export default subjectsService;

