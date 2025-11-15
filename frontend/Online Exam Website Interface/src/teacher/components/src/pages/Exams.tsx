import { useMemo, useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { PencilIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import Alert from "../components/ui/alert/Alert";

type Exam = {
  id: string;
  name: string;
  subject: string;
  date: string; // yyyy-MM-dd
  duration: number; // minutes
  totalMarks: number;
  questionsCount: number;
  status: "draft" | "published";
};

export default function Exams() {
  const initialExams = useMemo<Exam[]>(
    () => [
      {
        id: "e1",
        name: "Kiểm tra Giữa Kỳ Toán 12",
        subject: "Toán",
        date: "2025-12-10",
        duration: 60,
        totalMarks: 10,
        questionsCount: 30,
        status: "published",
      },
      {
        id: "e2",
        name: "Kiểm tra Cuối Kỳ Vật Lý 11",
        subject: "Vật Lý",
        date: "2025-12-20",
        duration: 90,
        totalMarks: 10,
        questionsCount: 40,
        status: "draft",
      },
      {
        id: "e3",
        name: "Kiểm tra 1 Tiếng Anh 10",
        subject: "Tiếng Anh",
        date: "2025-12-05",
        duration: 45,
        totalMarks: 10,
        questionsCount: 25,
        status: "published",
      },
    ],
    []
  );

  const [list, setList] = useState<Exam[]>(initialExams);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editForm, setEditForm] = useState<Exam>({
    id: "",
    name: "",
    subject: "",
    date: "",
    duration: 60,
    totalMarks: 10,
    questionsCount: 10,
    status: "draft",
  });
  const [createForm, setCreateForm] = useState<Exam>({
    id: "",
    name: "",
    subject: "",
    date: new Date().toISOString().split("T")[0],
    duration: 60,
    totalMarks: 10,
    questionsCount: 10,
    status: "draft",
  });

  // Alert state
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);
  const showAlert = (variant: "success" | "error" | "warning" | "info", title: string, message: string) => setAlert({ variant, title, message });
  useEffect(() => {
    if (!alert) return; const t = setTimeout(() => setAlert(null), 3000); return () => clearTimeout(t);
  }, [alert]);

  const openEdit = (exam: Exam) => {
    setSelected(exam);
    setEditForm({ ...exam });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selected) return;
    setList((prev) => prev.map((e) => (e.id === selected.id ? { ...e, ...editForm } : e)));
    setIsEditOpen(false);
    showAlert("success", "Lưu thành công", "Bài thi đã được cập nhật.");
  };

  const openDelete = (exam: Exam) => {
    setSelected(exam);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selected) return;
    setList((prev) => prev.filter((e) => e.id !== selected.id));
    setIsDeleteOpen(false);
    showAlert("success", "Đã xóa", "Bài thi đã được xóa khỏi danh sách.");
  };

  const validateExam = (e: Exam): string | null => {
    if (!e.name.trim()) return "Vui lòng nhập tên bài thi";
    if (!e.subject.trim()) return "Vui lòng nhập môn học";
    if (!e.date) return "Vui lòng chọn ngày thi";
    if (e.duration <= 0) return "Thời lượng phải > 0";
    if (e.totalMarks < 0) return "Điểm tối đa không hợp lệ";
    if (e.questionsCount < 0) return "Số câu hỏi không hợp lệ";
    return null;
  };

  const handleCreate = () => {
    const err = validateExam(createForm);
    if (err) { showAlert("warning", "Thiếu dữ liệu", err); return; }
    const newExam: Exam = { ...createForm, id: `e${Date.now()}` };
    setList((prev) => [newExam, ...prev]);
    setIsCreateOpen(false);
    showAlert("success", "Tạo thành công", "Bài thi mới đã được thêm vào danh sách.");
  };

  return (
    <>
      <PageMeta title="Quản Lý Bài Thi" />
      <div className="p-6">
        {alert && (
          <div className="mb-4">
            <Alert variant={alert.variant} title={alert.title} message={alert.message} />
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Quản Lý Bài Thi</h1>
          <Button onClick={() => { setCreateForm({ id: "", name: "", subject: "", date: new Date().toISOString().split("T")[0], duration: 60, totalMarks: 10, questionsCount: 10, status: "draft" }); setIsCreateOpen(true); }}>Tạo Bài Thi Mới</Button>
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table className="min-w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tên bài thi</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Môn học</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ngày thi</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Thời lượng</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Số câu</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Điểm</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</TableCell>
                <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-48">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((e) => (
                <TableRow key={e.id} className="border-t border-gray-100 dark:border-gray-800">
                  <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">{e.name}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{e.subject}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{e.date}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{e.duration} phút</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{e.questionsCount}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{e.totalMarks}</TableCell>
                  <TableCell className="px-4 py-3">
                    {e.status === "published" ? (
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-green-200 text-green-700 dark:ring-green-900/40">Phát hành</span>
                    ) : (
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-gray-200 text-gray-700 dark:ring-gray-800">Nháp</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 w-48">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" startIcon={<PencilIcon className="h-3 w-3" />} onClick={() => openEdit(e)} className="!border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!border-gray-400 transition-all duration-200 whitespace-nowrap text-xs px-2 py-1">
                        Sửa
                      </Button>
                      <Button size="sm" variant="outline" startIcon={<TrashBinIcon className="h-3 w-3" />} onClick={() => openDelete(e)} className="!border-red-300 !text-red-600 hover:!bg-red-50 hover:!border-red-400 transition-all duration-200 whitespace-nowrap text-xs px-2 py-1">
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Modal sửa bài thi */}
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} className="max-w-xl p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Sửa Bài Thi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Tên bài thi</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Môn học</label>
                <input
                  value={editForm.subject}
                  onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Ngày thi</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Thời lượng (phút)</label>
                <input
                  type="number"
                  min={1}
                  value={editForm.duration}
                  onChange={(e) => setEditForm((f) => ({ ...f, duration: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Điểm tối đa</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.totalMarks}
                  onChange={(e) => setEditForm((f) => ({ ...f, totalMarks: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Số câu hỏi</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.questionsCount}
                  onChange={(e) => setEditForm((f) => ({ ...f, questionsCount: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Trạng thái</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: (e.target.value as "draft" | "published") }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="draft">Nháp</option>
                  <option value="published">Phát hành</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
              <Button onClick={handleUpdate}>Lưu thay đổi</Button>
            </div>
          </div>
        </Modal>

        {/* Modal xóa */}
        <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-md p-6">
          {selected && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Xác Nhận Xóa</h3>
              <p>Bạn có chắc chắn muốn xóa bài thi "{selected.name}"?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
                <Button className="!bg-red-600 hover:!bg-red-700" onClick={confirmDelete}>Xóa</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal tạo mới */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-xl p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Tạo Bài Thi Mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Tên bài thi</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Môn học</label>
                <input
                  value={createForm.subject}
                  onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Ngày thi</label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Thời lượng (phút)</label>
                <input
                  type="number"
                  min={1}
                  value={createForm.duration}
                  onChange={(e) => setCreateForm((f) => ({ ...f, duration: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Điểm tối đa</label>
                <input
                  type="number"
                  min={0}
                  value={createForm.totalMarks}
                  onChange={(e) => setCreateForm((f) => ({ ...f, totalMarks: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Số câu hỏi</label>
                <input
                  type="number"
                  min={0}
                  value={createForm.questionsCount}
                  onChange={(e) => setCreateForm((f) => ({ ...f, questionsCount: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Trạng thái</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((f) => ({ ...f, status: (e.target.value as "draft" | "published") }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="draft">Nháp</option>
                  <option value="published">Phát hành</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
              <Button onClick={handleCreate}>Tạo</Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}


