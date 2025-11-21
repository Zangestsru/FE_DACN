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
    setAddress(user?.address || '');
    setDateOfBirth(user?.dateOfBirth || '');
    setIdNumber(user?.idNumber || '');
    const avatarUrl = user?.avatar;
    if (avatarUrl) {
      setAvatarPreview(avatarUrl);
    } else if (!selectedFile) {
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
    const payload = { fullName, phone, address, dateOfBirth, idNumber };
    updateProfileMutation.mutate(payload);
  };

  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await userService.updateAvatar(file);
      return res;
    },
    onSuccess: async () => {
      await refreshUser();
      const updatedUser = userService.getCurrentUser();
      if (updatedUser?.avatar) setAvatarPreview(updatedUser.avatar);
      toast.success(SUCCESS_MESSAGES.AVATAR_UPDATED);
      window.dispatchEvent(new CustomEvent('auth:profile-updated'));
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
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Avatar className="h-20 w-20 ring-4 ring-white/30">
            {avatarPreview ? (
              <AvatarImage src={avatarPreview} alt="Avatar" className="object-cover" />
            ) : (
              <AvatarFallback className="bg-white/20 text-white">
                {(user?.fullName || user?.username || 'U').charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold mb-1">{user?.fullName || user?.username}</h2>
            <p className="text-blue-100">{user?.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 transition-colors"
            onClick={() => setActiveTab('info')}
          >
            Chỉnh sửa hồ sơ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="shadow-md border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Ảnh đại diện</CardTitle>
              <CardDescription className="text-sm text-gray-600">Chọn ảnh mới để thay đổi avatar của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-gray-200">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Avatar" className="object-cover" />
                  ) : (
                    <AvatarFallback>{(user?.fullName || user?.username || 'U').charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">Ảnh hiện tại</p>
                  <p className="text-xs text-gray-500">Nhấn để thay đổi</p>
                </div>
              </div>
              <Input
                type="file"
                accept={FILE_UPLOAD.ALLOWED_EXTENSIONS.AVATAR.join(',')}
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-center"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                aria-label="Chọn tệp để cập nhật ảnh đại diện"
              >
                <div className="text-gray-600">
                  <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-medium">Chọn tệp hoặc kéo thả</p>
                  <p className="text-xs">JPG, PNG, GIF • Tối đa {(FILE_UPLOAD.MAX_SIZE.AVATAR / (1024 * 1024)).toFixed(0)}MB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUploadAvatar} disabled={updateAvatarMutation.isPending || !selectedFile} className="flex-1 transition-all">
                  {updateAvatarMutation.isPending ? 'Đang tải...' : 'Lưu ảnh'}
                </Button>
                {selectedFile && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setAvatarPreview(user?.avatar || null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="transition-all"
                  >
                    Hủy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-md border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Hồ sơ cá nhân</CardTitle>
              <CardDescription className="text-sm text-gray-600">Quản lý thông tin và bảo mật tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button
                  variant={activeTab === 'info' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('info')}
                  className="rounded-full px-4 py-2 transition-all"
                >
                  Thông tin
                </Button>
                <Button
                  variant={activeTab === 'security' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('security')}
                  className="rounded-full px-4 py-2 transition-all"
                >
                  Bảo mật
                </Button>
              </div>

              {activeTab === 'info' && (
                <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Họ và tên</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled className="mt-1 bg-gray-100" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Số điện thoại</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Ngày sinh</Label>
                    <Input id="dateOfBirth" type="date" value={dateOfBirth || ''} onChange={(e) => setDateOfBirth(e.target.value)} className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">Địa chỉ</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="idNumber" className="text-sm font-medium text-gray-700">CMND/CCCD</Label>
                    <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="mt-1" />
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full sm:w-auto transition-all">
                      {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="oldPassword" className="text-sm font-medium text-gray-700">Mật khẩu hiện tại</Label>
                    <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">Mật khẩu mới</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" />
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full sm:w-auto transition-all">
                      {changePasswordMutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}