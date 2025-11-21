import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '60vh' }} className="flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-semibold mb-4">403 - Truy cập bị từ chối</h1>
        <p className="mb-6">Bạn không có quyền truy cập vào trang này.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/')}>Về trang chủ</Button>
          <Button variant="outline" onClick={() => navigate('/login')}>Đăng nhập</Button>
        </div>
      </div>
    </div>
  );
}

