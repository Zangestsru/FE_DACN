import { useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import FlyonDataTableWrapper from "../components/ui/table/FlyonDataTableWrapper";
import Button from "../components/ui/button/Button";
import { UserCircleIcon, EyeIcon } from "../../admin/icons";
import { Modal } from "../components/ui/modal";

type Student = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  className?: string;
  avatarUrl?: string;
};

export default function Students() {
  const students = useMemo<Student[]>(
    () => [
      { id: "s1", name: "Nguyễn Văn A", email: "a@student.edu", phone: "0901000001", className: "12A1" },
      { id: "s2", name: "Trần Thị B", email: "b@student.edu", phone: "0902000002", className: "11B2" },
      { id: "s3", name: "Lê Quốc C", email: "c@student.edu", phone: "0903000003", className: "10C3" },
    ],
    []
  );

  const [list] = useState<Student[]>(students);
  const [selected, setSelected] = useState<Student | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [nameQuery, setNameQuery] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [classQuery, setClassQuery] = useState("");

  const filtered = useMemo(() => {
    return list.filter((s) => {
      const matchName = !nameQuery || s.name.toLowerCase().includes(nameQuery.toLowerCase());
      const matchEmail = !emailQuery || s.email.toLowerCase().includes(emailQuery.toLowerCase());
      const matchClass = !classQuery || (s.className || "").toLowerCase().includes(classQuery.toLowerCase());
      return matchName && matchEmail && matchClass;
    });
  }, [list, nameQuery, emailQuery, classQuery]);

  const openDetail = (s: Student) => {
    setSelected(s);
    setIsDetailOpen(true);
  };

  return (
    <>
      <PageMeta title="Quản Lý Học Viên" />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Quản Lý Học Viên</h1>

        {/* Thanh lọc */}
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              value={classQuery}
              onChange={(e) => setClassQuery(e.target.value)}
              placeholder="Lọc theo lớp"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
            />
          </div>
        </div>

        <FlyonDataTableWrapper pageLength={10} selecting selectAllSelector="#st-checkbox-all">
          <Table className="min-w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="w-4 pr-0">
                  <div className="flex h-5">
                    <input id="st-checkbox-all" type="checkbox" className="checkbox checkbox-sm" />
                    <label htmlFor="st-checkbox-all" className="sr-only">Checkbox</label>
                  </div>
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Học viên</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Số điện thoại</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Lớp</TableCell>
                <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-40">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                  <TableCell className="w-4 pr-0">
                    <div className="flex h-5 items-center">
                      <input id={`st-row-${s.id}`} type="checkbox" className="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                      <label htmlFor={`st-row-${s.id}`} className="sr-only">Checkbox</label>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {s.avatarUrl ? (
                        <img src={s.avatarUrl} alt={s.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                          <UserCircleIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{s.name}</span>
                        <span className="text-xs text-gray-500">ID: {s.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{s.email}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{s.phone || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{s.className || "-"}</TableCell>
                  <TableCell className="px-4 py-3 w-40">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn btn-circle btn-text" aria-label="Chi tiết" onClick={() => openDetail(s)}>
                        <EyeIcon className="size-5" />
                      </button>
                    </div>
                  </TableCell>
              </TableRow>
              ))}
            </TableBody>
          </Table>
        </FlyonDataTableWrapper>

        {/* Modal chi tiết */}
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-md p-6">
          {selected && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Thông Tin Học Viên</h3>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <UserCircleIcon className="h-7 w-7" />
                </div>
                <div>
                  <div className="font-medium">{selected.name}</div>
                  <div className="text-sm text-gray-500">{selected.email}</div>
                  <div className="text-sm text-gray-500">SĐT: {selected.phone || "-"}</div>
                  <div className="text-sm text-gray-500">Lớp: {selected.className || "-"}</div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}