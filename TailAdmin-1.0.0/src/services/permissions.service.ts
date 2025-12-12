// Permissions Service for TailAdmin
// Manages permission request-related API calls via Admin endpoints

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

// Permission Request interface
export interface PermissionRequest {
  id: number;
  userId: number;
  email?: string;
  fullName?: string;
  requestedRoleId: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedById?: number;
  rejectReason?: string;
  evidenceImageUrl?: string;
  reason?: string;
}

// Backend response format
interface BackendPermissionRequest {
  Id?: number;
  id?: number;
  UserId?: number;
  userId?: number;
  Email?: string;
  email?: string;
  FullName?: string;
  fullName?: string;
  RequestedRoleId?: number;
  requestedRoleId?: number;
  Status?: string;
  status?: string;
  SubmittedAt?: string;
  submittedAt?: string;
  ReviewedAt?: string;
  reviewedAt?: string;
  ReviewedById?: number;
  reviewedById?: number;
  RejectReason?: string;
  rejectReason?: string;
  EvidenceImageUrl?: string;
  evidenceImageUrl?: string;
  Reason?: string;
  reason?: string;
}

interface GetPermissionRequestsResponse {
  requests?: PermissionRequest[];
  Requests?: PermissionRequest[];
  count?: number;
  Count?: number;
}

interface RejectPermissionRequestPayload {
  Reason: string;
}

// Helper function to map backend permission request to frontend
function mapBackendPermissionRequestToFrontend(backend: any): PermissionRequest {
  const id = backend.Id ?? backend.id ?? 0;
  const userId = backend.UserId ?? backend.userId ?? 0;
  const email = backend.Email ?? backend.email;
  const fullName = backend.FullName ?? backend.fullName;
  const requestedRoleId = backend.RequestedRoleId ?? backend.requestedRoleId ?? 0;
  const status = (backend.Status ?? backend.status ?? 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected';
  const submittedAt = backend.SubmittedAt ?? backend.submittedAt ?? '';
  const reviewedAt = backend.ReviewedAt ?? backend.reviewedAt;
  const reviewedById = backend.ReviewedById ?? backend.reviewedById;
  const rejectReason = backend.RejectReason ?? backend.rejectReason;
  const evidenceImageUrl = backend.EvidenceImageUrl ?? backend.evidenceImageUrl;
  const reason = backend.Reason ?? backend.reason;

  return {
    id,
    userId,
    email,
    fullName,
    requestedRoleId,
    status,
    submittedAt,
    reviewedAt,
    reviewedById,
    rejectReason,
    evidenceImageUrl,
    reason,
  };
}

class PermissionsService {
  // Get all permission requests
  async getPermissionRequests(status?: string): Promise<{ requests: PermissionRequest[]; count: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (status && status.trim()) {
        queryParams.append('status', status.trim());
      }

      const endpoint = `${API_ENDPOINTS.admin.permissions.getRequests}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🌐 Calling endpoint:', endpoint);

      const response = await apiService.get<any>(endpoint);
      console.log('🔍 PermissionsService.getPermissionRequests - Raw response:', response);

      // Handle different response formats
      let requests: PermissionRequest[] = [];
      let count = 0;

      if (response && typeof response === 'object') {
        // Try different possible response formats
        if ('requests' in response && Array.isArray(response.requests)) {
          requests = response.requests.map(mapBackendPermissionRequestToFrontend);
          count = response.count ?? response.requests.length;
        } else if ('Requests' in response && Array.isArray(response.Requests)) {
          requests = response.Requests.map(mapBackendPermissionRequestToFrontend);
          count = response.Count ?? response.Requests.length;
        } else if (Array.isArray(response)) {
          requests = response.map(mapBackendPermissionRequestToFrontend);
          count = response.length;
        } else if ('data' in response && Array.isArray(response.data)) {
          requests = response.data.map(mapBackendPermissionRequestToFrontend);
          count = response.data.length;
        }
      }

      console.log('✅ PermissionsService.getPermissionRequests - Parsed requests:', requests);
      console.log('📊 Requests count:', count);
      
      // Debug: Log first request details
      if (requests.length > 0) {
        const firstRequest = requests[0];
        console.log('🔍 First request evidenceImageUrl:', firstRequest.evidenceImageUrl);
        console.log('🔍 First request reason:', firstRequest.reason);
        console.log('🔍 First request (full):', JSON.stringify(firstRequest, null, 2));
      }

      return { requests, count };
    } catch (error) {
      console.error('Error fetching permission requests:', error);
      throw error;
    }
  }

  // Approve permission request
  async approvePermissionRequest(id: number | string): Promise<{ message: string; userId?: number }> {
    try {
      const endpoint = API_ENDPOINTS.admin.permissions.approve(id);
      console.log('🌐 Calling endpoint:', endpoint);

      const response = await apiService.put<any>(endpoint, {});
      console.log('✅ PermissionsService.approvePermissionRequest - Response:', response);

      return response;
    } catch (error) {
      console.error(`Error approving permission request ${id}:`, error);
      throw error;
    }
  }

  // Reject permission request
  async rejectPermissionRequest(id: number | string, reason: string): Promise<{ message: string; requestId: number }> {
    try {
      const endpoint = API_ENDPOINTS.admin.permissions.reject(id);
      const payload: RejectPermissionRequestPayload = { Reason: reason };
      console.log('🌐 Calling endpoint:', endpoint);
      console.log('📤 Request payload:', payload);

      const response = await apiService.put<any>(endpoint, payload);
      console.log('✅ PermissionsService.rejectPermissionRequest - Response:', response);

      return response;
    } catch (error) {
      console.error(`Error rejecting permission request ${id}:`, error);
      throw error;
    }
  }
}

export const permissionsService = new PermissionsService();
export default permissionsService;

