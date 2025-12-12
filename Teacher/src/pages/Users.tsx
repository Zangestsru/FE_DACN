import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";

import { Modal } from "../components/ui/modal";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  avatarUrl?: string;
  phone?: string;
};

export default function Users() {
  const users = useMemo<User[]>(
    () => [
      { id: "1", name: "Nguyễn Văn A", email: "a@example.com", role: "admin", phone: "0901000111" },
      { id: "2", name: "Trần Thị B", email: "b@example.com", role: "teacher", phone: "0902000222" },
      { id: "3", name: "Lê Văn C", email: "c@example.com", role: "student", phone: "0903000333" },
    ],
    []
  );

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

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchName = !nameQuery || u.name.toLowerCase().includes(nameQuery.toLowerCase());
      const matchEmail = !emailQuery || u.email.toLowerCase().includes(emailQuery.toLowerCase());
      const matchPhone = !phoneQuery || (u.phone || "").includes(phoneQuery);
      const matchRole = !roleQuery || u.role === roleQuery;
      return matchName && matchEmail && matchPhone && matchRole;
    });
  }, [users, nameQuery, emailQuery, phoneQuery, roleQuery]);

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
    navigate(`/TailAdmin/chat?name=${encodeURIComponent(user.name)}`);
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

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table className="">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-t border-gray-100 dark:border-gray-800">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                        <span className="text-xs text-gray-500">ID: {user.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.phone || "-"}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-gray-200 dark:ring-gray-700 text-gray-700 dark:text-gray-300">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="grid grid-flow-col auto-cols-fr gap-2 justify-items-stretch">
                      <Button size="sm" variant="outline" className="w-full whitespace-nowrap" onClick={() => openDetail(user)}>
                        Xem Chi Tiết
                      </Button>
                      <Button size="sm" variant="outline" className="w-full whitespace-nowrap" onClick={() => openRole(user)}>
                        Phân Quyền
                      </Button>
                      <Button size="sm" variant="outline" className="w-full whitespace-nowrap" onClick={() => openMessage(user)}>
                        Nhắn Tin
                      </Button>
                      <Button size="sm" className="w-full whitespace-nowrap !bg-red-500 hover:!bg-red-600" onClick={() => openDelete(user)}>
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
                <div className="font-medium">{selectedUser.name}</div>
                <div className="text-sm text-gray-500">{selectedUser.email}</div>
                <div className="text-sm text-gray-500">Vai trò: {selectedUser.role}</div>
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
            <p className="text-sm text-gray-600">Chọn vai trò cho {selectedUser.name}:</p>
            <div className="flex gap-2">
              {(["admin", "teacher", "student"] as const).map((r) => (
                <Button key={r} variant={selectedUser.role === r ? "primary" : "outline"} onClick={() => setSelectedUser({ ...selectedUser, role: r })}>
                  {r}
                </Button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRoleOpen(false)}>Hủy</Button>
              <Button onClick={() => setIsRoleOpen(false)}>Lưu</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-sm p-6">
        {selectedUser && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Xóa người dùng?</h3>
            <p className="text-sm text-gray-600">Bạn chắc chắn muốn xóa {selectedUser.name}? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
              <Button className="!bg-red-500 hover:!bg-red-600" onClick={() => setIsDeleteOpen(false)}>Xóa</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

