import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService, userService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
// Không dùng Tabs từ Radix để tránh lỗi bundle trong một số môi trường; dùng toggle đơn giản
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { FILE_UPLOAD, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [address, setAddress] = useState<string>(user?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState<string>(user?.dateOfBirth || '');
  const [idNumber, setIdNumber] = useState<string>(user?.idNumber || '');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || user?.avatarUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
    setDateOfBirth(user?.dateOfBirth || '');
    setIdNumber(user?.idNumber || '');
    setAvatarPreview(user?.avatar || user?.avatarUrl || null);
  }, [user]);

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { oldPassword: string; newPassword: string }) => {
      return await authService.changePassword(payload.oldPassword, payload.newPassword);
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
    if (!oldPassword || !newPassword) {
      toast.error('Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    changePasswordMutation.mutate({ oldPassword, newPassword });
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
    const payload = { fullName, phone, address, dateOfBirth, idNumber };
    updateProfileMutation.mutate(payload);
  };

  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await userService.updateAvatar(file);
      return res;
    },
    onSuccess: (res) => {
      const url = (res && (res as any).avatarUrl) || undefined;
      if (url) setAvatarPreview(url);
      toast.success(SUCCESS_MESSAGES.AVATAR_UPDATED);
      window.dispatchEvent(new CustomEvent('auth:profile-updated'));
      refreshUser();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
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
    if (!FILE_UPLOAD.ALLOWED_TYPES.AVATAR.includes(file.type)) {
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
    <div className="container py-4 profile-page mx-auto max-w-[1280px] 2xl:max-w-[1440px]">
      <style>
        {`
          /* Profile Page Enhancements */
          .profile-hero {
            background: linear-gradient(135deg, #1a4b8c 0%, #2a5c9c 100%);
            color: white;
            border-radius: 1rem;
          }
          .profile-hero .avatar-ring {
            border: 3px solid rgba(255,255,255,0.35);
          }
          /* Bố cục 2 cột dùng Flex để tránh xung đột và hiện tượng chồng chéo */
          .profile-layout {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
            position: relative;
            z-index: 0;
          }
          @media (min-width: 992px) {
            .profile-layout {
              flex-direction: row;
            }
          }
          .profile-col-left, .profile-col-right {
            min-width: 0;
            position: relative;
            z-index: 0;
          }
          /* Cột trái cố định độ rộng trên desktop, tránh bị thu nhỏ và gây đè */
          @media (min-width: 992px) {
            .profile-col-left {
              flex: 0 0 360px; /* chiều rộng ổn định cho khu vực avatar */
              max-width: 360px;
            }
          }
          .profile-col-right {
            flex: 1 1 auto; /* cột phải chiếm phần còn lại */
          }
          .profile-page .card {
            width: 100%;
            position: static; /* đảm bảo card không sử dụng position tuyệt đối gây chồng */
          }
          .profile-toggle {
            display: inline-flex;
            gap: 0.5rem;
          }
          .profile-toggle .toggle-btn {
            border-radius: 999px;
            padding: 6px 12px;
          }
          .upload-zone {
            border: 2px dashed #d1d5db;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: #f8fafc;
            cursor: pointer;
            transition: background-color .15s ease, border-color .15s ease;
            position: relative; /* đảm bảo vùng upload đứng yên, không đè lên bên phải */
          }
          .upload-zone:hover {
            border-color: #9ca3af;
            background: #f1f5f9;
          }
          .upload-hint {
            font-size: 12px;
            color: #6b7280;
          }
          @media (max-width: 576px) {
            .profile-hero {
              padding: 1rem !important;
            }
          }
        `}
      </style>
      {/* Hero header */}
      <div className="profile-hero p-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-20 w-20 avatar-ring">
            {avatarPreview ? (
              <AvatarImage src={avatarPreview} alt="Avatar" />
            ) : (
              <AvatarFallback style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                {(user?.fullName || user?.username || 'U').charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h2 className="h4 mb-1" style={{ color: 'white' }}>{user?.fullName || user?.username}</h2>
            <div className="small" style={{ opacity: 0.9 }}>{user?.email}</div>
          </div>
          <div>
            <Button variant="outline" size="sm" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}>
              Chỉnh sửa hồ sơ
            </Button>
          </div>
        </div>
      </div>

      {/* Bố cục 2 cột bằng Flex, tránh xung đột với Bootstrap/Tailwind */}
      <div className="profile-layout">
        {/* Cột trái: Avatar + thao tác nhanh */}
        <section className="profile-col-left">
          <Card className="mb-4">
            <CardHeader className="border-bottom py-4">
              <CardTitle className="text-lg font-semibold">Ảnh đại diện</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600 px-1">Chọn ảnh mới để thay đổi avatar của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Avatar className="h-20 w-20">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Avatar" />
                  ) : (
                    <AvatarFallback>{(user?.fullName || user?.username || 'U').charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 w-full">
                  {/* Hidden real file input */}
                  <Input
                    type="file"
                    accept={FILE_UPLOAD.ALLOWED_EXTENSIONS.AVATAR.join(',')}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {/* Pretty upload zone */}
                  <div
                    className="upload-zone w-full"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    aria-label="Chọn tệp để cập nhật ảnh đại diện"
                  >
                    <div>
                      <div className="fw-semibold">Chọn tệp</div>
                      <div className="upload-hint">Nhấn để chọn ảnh hoặc kéo thả vào đây</div>
                    </div>
                    <div className="ms-auto">
                      <Button size="sm" variant="outline">
                        Cập nhật ảnh
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    <Button onClick={handleUploadAvatar} disabled={updateAvatarMutation.isPending}>
                      {updateAvatarMutation.isPending ? 'Đang tải lên...' : 'Lưu ảnh mới'}
                    </Button>
                    {selectedFile && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setAvatarPreview(user?.avatar || user?.avatarUrl || null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                  <div className="text-muted small mt-2">
                    Định dạng: JPG, PNG, WEBP • Tối đa {(FILE_UPLOAD.MAX_SIZE.AVATAR / (1024 * 1024)).toFixed(0)}MB
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cột phải: Tabs hồ sơ + bảo mật */}
        <section className="profile-col-right">
          <Card>
            <CardHeader className="border-bottom py-4">
              <CardTitle className="text-lg font-semibold">Hồ sơ cá nhân</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600 px-1">Quản lý thông tin và bảo mật tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Toggle tự chế thay cho Tabs */}
              <div className="profile-toggle mb-3">
                <Button className="toggle-btn" variant={activeTab === 'info' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('info')}>Thông tin</Button>
                <Button className="toggle-btn" variant={activeTab === 'security' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('security')}>Bảo mật</Button>
              </div>

              {activeTab === 'info' && (
                  <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <Label htmlFor="fullName">Họ và tên</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full" />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ''} disabled className="w-full" />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full" />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                      <Input id="dateOfBirth" type="date" value={dateOfBirth || ''} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full" />
                    </div>
                    <div className="md:col-span-2 col-span-1">
                      <Label htmlFor="address">Địa chỉ</Label>
                      <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full" />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="idNumber">CMND/CCCD</Label>
                      <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="w-full" />
                    </div>
                    <div className="md:col-span-2 col-span-1 mt-2">
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </form>
              )}

              {activeTab === 'security' && (
                  <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                      <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full" />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full" />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full" />
                    </div>
                    <div className="md:col-span-2 col-span-1">
                      <div className="text-muted small">Mẹo: Dùng ít nhất 8 ký tự, bao gồm chữ hoa, số và ký tự đặc biệt.</div>
                    </div>
                    <div className="md:col-span-2 col-span-1 mt-2">
                      <Button type="submit" disabled={changePasswordMutation.isPending}>
                        {changePasswordMutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
                      </Button>
                    </div>
                  </form>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}