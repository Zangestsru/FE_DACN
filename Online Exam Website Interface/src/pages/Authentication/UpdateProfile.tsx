import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { useAuthContext } from '../../contexts';
import { useNavigate } from 'react-router-dom';

export function UpdateProfile() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();

  const mutation = useMutation({
    mutationFn: (dob: Date) => authService.updateProfile({ email: user.email, dateOfBirth: format(dob, 'dd/MM/yyyy') }),
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công! Vui lòng đăng nhập lại.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dateOfBirth) {
      mutation.mutate(dateOfBirth);
    } else {
      toast.error('Vui lòng chọn ngày sinh của bạn.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cập nhật thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Ngày sinh</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Chọn ngày</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={setDateOfBirth}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang cập nhật...' : 'Hoàn tất'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}