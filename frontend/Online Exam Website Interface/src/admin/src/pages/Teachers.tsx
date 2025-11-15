import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { usersService, type User } from "../services/users.service";

export default function Teachers() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [nameQuery, setNameQuery] = useState("");
  const [emailQuery, setEmailQuery] = useState("");

  // Load teachers from API
  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersService.getUsers();
      // Filter only teachers from all users
      const teachersOnly = data.filter(user => user.role?.toLowerCase() === 'teacher');
      setTeachers(teachersOnly);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu giáo viên');
      console.error('Error loading teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await usersService.updateUser(userId, { isActive: !currentStatus });
      await loadTeachers();
      setIsSuspendOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteTeacher = async (userId: string) => {
    try {
      await usersService.deleteUser(userId);
      await loadTeachers();
      setIsDeleteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa giáo viên');
    }
  };

  const filtered = teachers.filter((t) => {
    const matchName = !nameQuery || t.fullName.toLowerCase().includes(nameQuery.toLowerCase());
    const matchEmail = !emailQuery || t.email.toLowerCase().includes(emailQuery.toLowerCase());
    return matchName && matchEmail;
  });

  const openDetail = (t: User) => {
    setSelected(t);
    setIsDetailOpen(true);
  };
  const openSuspend = (t: User) => {
    setSelected(t);
    setIsSuspendOpen(true);
  };
  const openDelete = (t: User) => {
    setSelected(t);
    setIsDeleteOpen(true);
  };
  const openMessage = (t: User) => {
    navigate(`/TailAdmin/chat?name=${encodeURIComponent(t.fullName)}`);
  };

  return (
    <>
      <PageMeta title="Quản Lý Giáo Viên" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Giáo Viên</h1>
          <div className="flex gap-2">
            <span className="text-sm text-gray-500">
              Tổng: {teachers.length} giáo viên
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên giáo viên"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            placeholder="Tìm kiếm theo email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadTeachers} className="mt-2">
              Thử lại
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giáo viên</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {teachers.length === 0 ? "Chưa có giáo viên nào" : "Không tìm thấy kết quả nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((teacher) => (
                  <TableRow key={teacher.id} className="border-t border-gray-100 dark:border-gray-800">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {teacher.avatar ? (
                          <img src={teacher.avatar} alt={teacher.fullName} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                            {teacher.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">{teacher.fullName}</span>
                          <span className="text-xs text-gray-500">@{teacher.username}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{teacher.email}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {teacher.createdDate ? new Date(teacher.createdDate).toLocaleDateString('vi-VN') : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(teacher.id, teacher.isActive)}
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ${
                          teacher.isActive 
                            ? 'ring-green-200 dark:ring-green-700 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' 
                            : 'ring-red-200 dark:ring-red-700 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        {teacher.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </button>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openDetail(teacher)}>
                          Chi tiết
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openMessage(teacher)}>
                          Nhắn tin
                        </Button>
                        <Button 
                          size="sm" 
                          variant={teacher.isActive ? "outline" : "primary"}
                          onClick={() => openSuspend(teacher)}
                        >
                          {teacher.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                        </Button>
                        <Button size="sm" className="!bg-red-500 hover:!bg-red-600" onClick={() => openDelete(teacher)}>
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal chi tiết */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-xl p-6">
        {selected && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Thông Tin Giáo Viên</h3>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                {selected.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{selected.fullName}</div>
                <div className="text-sm text-gray-500">{selected.email}</div>
                <div className="text-sm text-gray-500">Username: @{selected.username}</div>
                <div className="text-sm text-gray-500">Vai trò: {selected.role}</div>
                <div className="text-sm text-gray-500">
                  Trạng thái: {selected.isActive ? "Đang hoạt động" : "Tạm dừng"}
                </div>
                <div className="text-sm text-gray-500">
                  Ngày tạo: {selected.createdDate ? new Date(selected.createdDate).toLocaleDateString('vi-VN') : "-"}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal đình chỉ/kích hoạt */}
      <Modal isOpen={isSuspendOpen} onClose={() => setIsSuspendOpen(false)} className="max-w-md p-6">
        {selected && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {selected.isActive ? "Tạm dừng" : "Kích hoạt"} tài khoản?
            </h3>
            <p className="text-sm text-gray-600">
              Bạn chắc chắn muốn {selected.isActive ? "tạm dừng" : "kích hoạt"} tài khoản của {selected.fullName}?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSuspendOpen(false)}>Hủy</Button>
              <Button onClick={() => handleToggleStatus(selected.id, selected.isActive)}>
                {selected.isActive ? "Tạm dừng" : "Kích hoạt"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xóa */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-sm p-6">
        {selected && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Xóa tài khoản giáo viên?</h3>
            <p className="text-sm text-gray-600">
              Bạn chắc chắn muốn xóa tài khoản của {selected.fullName}? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
              <Button className="!bg-red-500 hover:!bg-red-600" onClick={() => handleDeleteTeacher(selected.id)}>
                Xóa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}