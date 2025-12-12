import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService, userService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { FILE_UPLOAD, SUCCESS_MESSAGES, ERROR_MESSAGES, STORAGE_KEYS } from '../../constants';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState<string>(user?.dateOfBirth || '');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  useEffect(() => {
    const loadUserFromAPI = async () => {
      if (user?.id) {
        try {
          await userService.getUserById(user.id);
          refreshUser();
        } catch (error) {}
      }
    };
    loadUserFromAPI();
  }, [user?.id, refreshUser]);

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setDateOfBirth(user?.dateOfBirth || '');
    
    // Cập nhật avatar preview từ user
    const avatarUrl = user?.avatar;
    console.log('🖼️ Profile useEffect - user object:', user);
    console.log('🖼️ Profile useEffect - user?.avatar:', avatarUrl);
    console.log('🖼️ Profile useEffect - user?.avatarUrl:', (user as any)?.avatarUrl);
    console.log('🖼️ Profile useEffect - user?.AvatarUrl:', (user as any)?.AvatarUrl);
    
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
      // Đảm bảo URL là absolute URL (có http/https)
      const fullAvatarUrl = avatarUrl.startsWith('http') 
        ? avatarUrl 
        : avatarUrl.startsWith('/') 
          ? `${window.location.origin}${avatarUrl}`
          : avatarUrl;
      console.log('🖼️ Setting avatar preview to:', fullAvatarUrl);
      setAvatarPreview(fullAvatarUrl);
    } else if (!selectedFile) {
      // Chỉ reset về null nếu không có file được chọn
      console.log('🖼️ No avatar URL found, resetting preview. Avatar value:', avatarUrl);
      setAvatarPreview(null);
    }
  }, [user, selectedFile]);

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
      return await authService.changePassword(payload.oldPassword, payload.newPassword, payload.confirmPassword);
    },
    onSuccess: (res) => {
      toast.success((res && (res as any).message) || SUCCESS_MESSAGES.PASSWORD_CHANGED);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      toast.error(err?.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    }
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    changePasswordMutation.mutate({ oldPassword, newPassword, confirmPassword });
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const updated = await userService.updateProfile(data);
      return updated;
    },
    onSuccess: () => {
      toast.success(SUCCESS_MESSAGES.PROFILE_UPDATED);
      window.dispatchEvent(new CustomEvent('auth:profile-updated'));
      refreshUser();
    },
    onError: (err: any) => {
      toast.error(err?.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    }
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { fullName, phone, dateOfBirth };
    updateProfileMutation.mutate(payload);
  };

  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await userService.updateAvatar(file);
      return res;
    },
    onSuccess: async (result) => {
      console.log('✅ Avatar upload success, result:', result);
      
      // Force refresh user từ API để lấy avatar mới nhất
      try {
        if (user?.id) {
          const updatedUserData = await userService.getUserById(user.id);
          console.log('✅ Fetched updated user data:', updatedUserData);
          console.log('✅ Updated user avatar:', updatedUserData?.avatar);
          
          // Cập nhật localStorage với user mới
          const normalizedUser = userService.normalizeUser(updatedUserData);
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(normalizedUser));
          
          // Refresh user trong context
          await refreshUser();
          
          // Cập nhật avatar preview
          const avatarUrl = result.avatarUrl || updatedUserData?.avatar || normalizedUser?.avatar;
          if (avatarUrl) {
            const fullAvatarUrl = avatarUrl.startsWith('http') 
              ? avatarUrl 
              : avatarUrl.startsWith('/') 
                ? `${window.location.origin}${avatarUrl}`
                : avatarUrl;
            console.log('🖼️ Setting avatar preview to:', fullAvatarUrl);
            setAvatarPreview(fullAvatarUrl);
          }
        }
      } catch (error) {
        console.error('Error refreshing user after avatar upload:', error);
        // Fallback: dùng avatarUrl từ response
        if (result.avatarUrl) {
          const fullAvatarUrl = result.avatarUrl.startsWith('http') 
            ? result.avatarUrl 
            : result.avatarUrl.startsWith('/') 
              ? `${window.location.origin}${result.avatarUrl}`
              : result.avatarUrl;
          setAvatarPreview(fullAvatarUrl);
        }
      }
      
      toast.success(SUCCESS_MESSAGES.AVATAR_UPDATED);
      window.dispatchEvent(new CustomEvent('auth:profile-updated'));
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
      console.error('❌ Avatar upload error:', err);
      toast.error(err?.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.size > FILE_UPLOAD.MAX_SIZE.AVATAR) {
      toast.error(ERROR_MESSAGES.FILE_TOO_LARGE);
      return;
    }
    if (!(FILE_UPLOAD.ALLOWED_TYPES.AVATAR as readonly string[]).includes(file.type as (typeof FILE_UPLOAD.ALLOWED_TYPES.AVATAR)[number])) {
      toast.error(ERROR_MESSAGES.INVALID_FILE_TYPE);
      return;
    }
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleUploadAvatar = () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn ảnh đại diện');
      return;
    }
    updateAvatarMutation.mutate(selectedFile);
  };

  return (
    <div className="container py-5">
      <div className="row">
        {/* Left Sidebar - Avatar */}
        <div className="col-lg-4 mb-4 mb-lg-0">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-4">
                <div className="position-relative d-inline-block">
                  <div
                    className="rounded-circle overflow-hidden"
                    style={{
                      width: '150px',
                      height: '150px',
                      margin: '0 auto',
                      border: '4px solid #e9ecef',
                      cursor: 'pointer',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="w-100 h-100 d-flex align-items-center justify-content-center bg-primary text-white"
                        style={{ fontSize: '48px', fontWeight: 'bold' }}
                      >
                        {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div
                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      border: '3px solid white',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Thay đổi ảnh đại diện"
                  >
                    <i className="bi bi-camera"></i>
                  </div>
                </div>
              </div>
              
              <h4 className="mb-1">{user?.fullName || user?.username || 'Người dùng'}</h4>
              <p className="text-muted small mb-4">{user?.email}</p>

              <Input
                type="file"
                accept={FILE_UPLOAD.ALLOWED_EXTENSIONS.AVATAR.join(',')}
                ref={fileInputRef}
                onChange={handleFileChange}
                className="d-none"
              />

              {selectedFile && (
                <div className="alert alert-info small mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Đã chọn: {selectedFile.name}
                </div>
              )}

              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleUploadAvatar}
                  disabled={updateAvatarMutation.isPending || !selectedFile}
                >
                  {updateAvatarMutation.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>
                      Lưu ảnh
                    </>
                  )}
                </button>
                {selectedFile && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setSelectedFile(null);
                      setAvatarPreview(user?.avatar || null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Hủy
                  </button>
                )}
              </div>

              <div className="mt-4 pt-4 border-top">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  JPG, PNG, GIF • Tối đa {(FILE_UPLOAD.MAX_SIZE.AVATAR / (1024 * 1024)).toFixed(0)}MB
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Profile Info */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-0">Hồ sơ cá nhân</h5>
            </div>
            <div className="card-body">
              {/* Tabs */}
              <ul className="nav nav-tabs mb-4" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                    type="button"
                  >
                    <i className="bi bi-person me-2"></i>
                    Thông tin
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                    type="button"
                  >
                    <i className="bi bi-shield-lock me-2"></i>
                    Bảo mật
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Information Tab */}
                {activeTab === 'info' && (
                  <form onSubmit={handleUpdateProfile}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="fullName" className="form-label">
                          Họ và tên <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          value={user?.email || ''}
                          disabled
                          style={{ backgroundColor: '#f8f9fa' }}
                        />
                        <small className="text-muted">Email không thể thay đổi</small>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="phone" className="form-label">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="dateOfBirth" className="form-label">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="dateOfBirth"
                          value={dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              const date = new Date(e.target.value);
                              const day = String(date.getDate()).padStart(2, '0');
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const year = date.getFullYear();
                              setDateOfBirth(`${day}/${month}/${year}`);
                            } else {
                              setDateOfBirth('');
                            }
                          }}
                        />
                      </div>
                      <div className="col-12 mt-4 pt-3 border-top">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-2"></i>
                              Lưu thay đổi
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <form onSubmit={handleChangePassword}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="oldPassword" className="form-label">
                          Mật khẩu hiện tại <span className="text-danger">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          id="oldPassword"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Nhập mật khẩu hiện tại"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="newPassword" className="form-label">
                          Mật khẩu mới <span className="text-danger">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                          required
                          minLength={6}
                        />
                        <small className="text-muted">Tối thiểu 6 ký tự</small>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="confirmPassword" className="form-label">
                          Xác nhận mật khẩu mới <span className="text-danger">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          required
                        />
                      </div>
                      <div className="col-12 mt-4 pt-3 border-top">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Đang đổi...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-shield-check me-2"></i>
                              Đổi mật khẩu
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}