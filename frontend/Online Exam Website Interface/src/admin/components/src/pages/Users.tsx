import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";

import { Modal } from "../components/ui/modal";
import { usersService, type User, type CreateUserRequest, type UpdateUserRequest } from "../services/users.service";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [nameQuery, setNameQuery] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState<"" | User["role"]>("");

  // Load users from API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu người dùng');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: User["role"]) => {
    try {
      await usersService.updateUser(userId, { role: newRole });
      await loadUsers(); // Reload data
      setIsRoleOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật vai trò');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await usersService.deleteUser(userId);
      await loadUsers(); // Reload data
      setIsDeleteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa người dùng');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchName = !nameQuery || u.fullName.toLowerCase().includes(nameQuery.toLowerCase());
    const matchEmail = !emailQuery || u.email.toLowerCase().includes(emailQuery.toLowerCase());
    const matchPhone = !phoneQuery || (u.avatar || "").includes(phoneQuery); // Assuming avatar field for phone
    const matchRole = !roleQuery || u.role === roleQuery;
    return matchName && matchEmail && matchPhone && matchRole;
  });

  const openDetail = (user: User) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };
  const openRole = (user: User) => {
    setSelectedUser(user);
    setIsRoleOpen(true);
  };
  const openDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };
  const openMessage = (user: User) => {
    navigate(`/TailAdmin/chat?name=${encodeURIComponent(user.fullName)}`);
  };

  return (
    <>
      <PageMeta title="Quản Lý Người Dùng" />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Quản Lý Người Dùng</h1>

        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Lọc theo tên"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={roleQuery}
            onChange={(e) => setRoleQuery((e.target.value || "") as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">admin</option>
            <option value="teacher">teacher</option>
            <option value="student">student</option>
          </select>
          <input
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            placeholder="Lọc theo số điện thoại"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            placeholder="Lọc theo email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadUsers} className="mt-2">
              Thử lại
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table className="">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</TableCell>
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
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {users.length === 0 ? "Không có người dùng nào" : "Không tìm thấy kết quả nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-t border-gray-100 dark:border-gray-800">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.fullName} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{user.fullName}</span>
                        <span className="text-xs text-gray-500">@{user.username}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.createdDate ? new Date(user.createdDate).toLocaleDateString('vi-VN') : "-"}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-gray-200 dark:ring-gray-700 text-gray-700 dark:text-gray-300">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetail(user)}>
                        Xem Chi Tiết Người Dùng
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openRole(user)}>
                        Phân Quyền
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openMessage(user)}>
                        Nhắn Tin
                      </Button>
                      <Button size="sm" className="!bg-red-500 hover:!bg-red-600" onClick={() => openDelete(user)}>
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

      {/* Modal xem chi tiết */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-xl p-6">
        {selectedUser && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Chi Tiết Người Dùng</h3>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              </div>
              <div>
                <div className="font-medium">{selectedUser.fullName}</div>
                <div className="text-sm text-gray-500">{selectedUser.email}</div>
                <div className="text-sm text-gray-500">Vai trò: {selectedUser.role}</div>
                <div className="text-sm text-gray-500">Trạng thái: {selectedUser.isActive ? 'Hoạt động' : 'Không hoạt động'}</div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal phân quyền */}
      <Modal isOpen={isRoleOpen} onClose={() => setIsRoleOpen(false)} className="max-w-md p-6">
        {selectedUser && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Phân Quyền</h3>
            <p className="text-sm text-gray-600">Chọn vai trò cho {selectedUser.fullName}:</p>
            <div className="flex gap-2">
              {(["admin", "teacher", "student"] as const).map((r) => (
                <Button key={r} variant={selectedUser.role === r ? "primary" : "outline"} onClick={() => setSelectedUser({ ...selectedUser, role: r })}>
                  {r}
                </Button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRoleOpen(false)}>Hủy</Button>
              <Button onClick={() => handleUpdateRole(selectedUser.id, selectedUser.role)}>Lưu</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-sm p-6">
        {selectedUser && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Xóa người dùng?</h3>
            <p className="text-sm text-gray-600">Bạn chắc chắn muốn xóa {selectedUser.fullName}? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
              <Button className="!bg-red-500 hover:!bg-red-600" onClick={() => handleDeleteUser(selectedUser.id)}>Xóa</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

