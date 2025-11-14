// Materials Service for TailAdmin
// Manages learning materials API calls

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Material {
  id: string;
  title: string;
  description: string;
  contentType: 'pdf' | 'video' | 'document' | 'image' | 'audio' | 'link';
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  category: string;
  tags?: string[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  viewCount: number;
}

export interface CreateMaterialRequest {
  title: string;
  description: string;
  contentType: 'pdf' | 'video' | 'document' | 'image' | 'audio' | 'link';
  fileUrl?: string;
  category: string;
  tags?: string[];
}

export interface UpdateMaterialRequest {
  title?: string;
  description?: string;
  contentType?: 'pdf' | 'video' | 'document' | 'image' | 'audio' | 'link';
  fileUrl?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
}

class MaterialsService {
  // Get all materials
  async getMaterials(): Promise<Material[]> {
    try {
      const response = await apiService.get<Material[]>(API_ENDPOINTS.materials.getAll);
      return response;
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  }

  // Get material by ID
  async getMaterialById(id: string): Promise<Material> {
    try {
      const response = await apiService.get<Material>(API_ENDPOINTS.materials.getById(id));
      return response;
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error);
      throw error;
    }
  }

  // Create new material
  async createMaterial(materialData: CreateMaterialRequest): Promise<Material> {
    try {
      const response = await apiService.post<Material>(API_ENDPOINTS.materials.create, materialData);
      return response;
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  // Update material
  async updateMaterial(id: string, materialData: UpdateMaterialRequest): Promise<Material> {
    try {
      const response = await apiService.put<Material>(API_ENDPOINTS.materials.update(id), materialData);
      return response;
    } catch (error) {
      console.error(`Error updating material ${id}:`, error);
      throw error;
    }
  }

  // Delete material
  async deleteMaterial(id: string): Promise<void> {
    try {
      await apiService.delete(API_ENDPOINTS.materials.delete(id));
    } catch (error) {
      console.error(`Error deleting material ${id}:`, error);
      throw error;
    }
  }

  // Toggle material status
  async toggleMaterialStatus(id: string, isActive: boolean): Promise<Material> {
    try {
      const response = await apiService.put<Material>(
        API_ENDPOINTS.materials.update(id), 
        { isActive }
      );
      return response;
    } catch (error) {
      console.error(`Error toggling material ${id} status:`, error);
      throw error;
    }
  }
}

export const materialsService = new MaterialsService();
export default materialsService;