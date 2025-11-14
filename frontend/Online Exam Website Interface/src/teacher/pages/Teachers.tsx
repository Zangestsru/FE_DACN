import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { UserCircleIcon, MailIcon, TrashBinIcon, EyeIcon, LockIcon } from "../../admin/icons";
import { Modal } from "../components/ui/modal";

type Teacher = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  suspended?: boolean;
  avatarUrl?: string;
};

export default function Teachers() {
  const teachers = useMemo<Teacher[]>(
    () => [
      { id: "t1", name: "Phạm Minh Đức", email: "duc@example.com", phone: "0911000111", department: "Toán" },
      { id: "t2", name: "Ngô Thu Hà", email: "ha@example.com", phone: "0912000222", department: "Văn" },
      { id: "t3", name: "Đặng Quốc Huy", email: "huy@example.com", phone: "0913000333", department: "Lý" },
    ],
    []
  );

  const [list, setList] = useState<Teacher[]>(teachers);
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [nameQuery, setNameQuery] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [departmentQuery, setDepartmentQuery] = useState("");
  const [statusQuery, setStatusQuery] = useState<"" | "active" | "suspended">("");

  const filtered = useMemo(() => {
    return list.filter((t) => {
      const matchName = !nameQuery || t.name.toLowerCase().includes(nameQuery.toLowerCase());
      const matchEmail = !emailQuery || t.email.toLowerCase().includes(emailQuery.toLowerCase());
      const matchPhone = !phoneQuery || (t.phone || "").includes(phoneQuery);
      const matchDept = !departmentQuery || (t.department || "").toLowerCase().includes(departmentQuery.toLowerCase());
      const matchStatus =
        !statusQuery || (statusQuery === "suspended" ? !!t.suspended : !t.suspended);
      return matchName && matchEmail && matchPhone && matchDept && matchStatus;
    });
  }, [list, nameQuery, emailQuery, phoneQuery, departmentQuery, statusQuery]);

  const openDetail = (t: Teacher) => {
    setSelected(t);
    setIsDetailOpen(true);
  };
  const openSuspend = (t: Teacher) => {
    setSelected(t);
    setIsSuspendOpen(true);
  };
  const openDelete = (t: Teacher) => {
    setSelected(t);
    setIsDeleteOpen(true);
  };
  const openMessage = (t: Teacher) => {
    navigate(`/TailAdmin/chat?name=${encodeURIComponent(t.name)}`);
  };

  const confirmSuspend = () => {
    if (!selected) return;
    setList((prev) => prev.map((t) => (t.id === selected.id ? { ...t, suspended: !t.suspended } : t)));
    setIsSuspendOpen(false);
  };

  const confirmDelete = () => {
    if (!selected) return;
    setList((prev) => prev.filter((t) => t.id !== selected.id));
    setIsDeleteOpen(false);
  };

  return (
    <>
      <PageMeta title="Quản Lý Giáo Viên" />
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Quản Lý Giáo Viên</h1>

        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Lọc theo tên"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            placeholder="Lọc theo email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            placeholder="Lọc theo số điện thoại"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={departmentQuery}
            onChange={(e) => setDepartmentQuery(e.target.value)}
            placeholder="Lọc theo bộ môn"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={statusQuery}
            onChange={(e) => setStatusQuery((e.target.value || "") as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Đình chỉ</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table className="min-w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Giáo viên</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Số điện thoại</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Bộ môn</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</TableCell>
                <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-64">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="border-t border-gray-100 dark:border-gray-800">
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                          <UserCircleIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{t.name}</span>
                        <span className="text-xs text-gray-500">ID: {t.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{t.email}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{t.phone || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{t.department || "-"}</TableCell>
                  <TableCell className="px-4 py-3">
                    {t.suspended ? (
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-red-200 text-red-600 dark:ring-red-900/40">
                        Đình chỉ
                      </span>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 w-56">
                      <div className="flex items-center justify-end gap-0.5 min-w-0">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        startIcon={<EyeIcon className="h-3 w-3" />} 
                        onClick={() => openDetail(t)}
                        className="!border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!border-gray-400 transition-all duration-200 whitespace-nowrap text-xs px-2 py-1"
                      >
                        <span className="hidden md:inline">Chi tiết</span>
                        <span className="md:hidden sr-only">Chi tiết</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        startIcon={<LockIcon className="h-3 w-3" />} 
                        onClick={() => openSuspend(t)}
                        className={`transition-all duration-200 whitespace-nowrap text-xs px-2 py-1 ${
                          t.suspended 
                            ? "!border-green-500 !text-green-600 hover:!bg-green-50 hover:!border-green-600" 
                            : "!border-orange-500 !text-orange-600 hover:!bg-orange-50 hover:!border-orange-600"
                        }`}
                      >
                        <span className="hidden lg:inline">{t.suspended ? "Gỡ ĐC" : "Đình chỉ"}</span>
                        <span className="lg:hidden sr-only">{t.suspended ? "Gỡ đình chỉ" : "Đình chỉ"}</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        startIcon={<MailIcon className="h-3 w-3" />} 
                        onClick={() => openMessage(t)} 
                        className="!border-blue-500 !text-blue-600 hover:!bg-blue-50 hover:!border-blue-600 transition-all duration-200 whitespace-nowrap text-xs px-2 py-1"
                      >
                        <span className="hidden md:inline">Tin</span>
                        <span className="md:hidden sr-only">Nhắn tin</span>
                      </Button>
                      <Button 
                        size="sm" 
                        className="!bg-red-500 hover:!bg-red-600 !text-white !border-red-500 hover:!border-red-600 transition-all duration-200 whitespace-nowrap text-xs px-2 py-1" 
                        startIcon={<TrashBinIcon className="h-3 w-3" />} 
                        onClick={() => openDelete(t)}
                      >
                        <span className="hidden md:inline">Xóa</span>
                        <span className="md:hidden sr-only">Xóa tài khoản</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
                <UserCircleIcon className="h-7 w-7" />
              </div>
              <div>
                <div className="font-medium">{selected.name}</div>
                <div className="text-sm text-gray-500">{selected.email}</div>
                <div className="text-sm text-gray-500">SĐT: {selected.phone || "-"}</div>
                <div className="text-sm text-gray-500">Bộ môn: {selected.department || "-"}</div>
                <div className="text-sm text-gray-500">Trạng thái: {selected.suspended ? "Đình chỉ" : "Đang hoạt động"}</div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal đình chỉ */}
      <Modal isOpen={isSuspendOpen} onClose={() => setIsSuspendOpen(false)} className="max-w-md p-6">
        {selected && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{selected.suspended ? "Gỡ đình chỉ" : "Đình chỉ"} tài khoản?</h3>
            <p className="text-sm text-gray-600">Thao tác áp dụng cho {selected.name}.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSuspendOpen(false)}>Hủy</Button>
              <Button onClick={confirmSuspend}>{selected.suspended ? "Gỡ đình chỉ" : "Xác nhận"}</Button>
            </div>
          </div>
        )}
      </Modal>


      {/* Modal xóa */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-sm p-6">
        {selected && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Xóa tài khoản giáo viên?</h3>
            <p className="text-sm text-gray-600">Bạn chắc chắn muốn xóa {selected.name}? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
              <Button className="!bg-red-500 hover:!bg-red-600" onClick={confirmDelete}>Xóa</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

