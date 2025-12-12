import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { subjectsService, type Subject, type CreateSubjectRequest, type UpdateSubjectRequest } from "../services/subjects.service";
import { EyeIcon, PencilIcon, TrashBinIcon, PlusIcon } from "../icons";

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateSubjectRequest>({
    name: "",
    description: "",
  });

  const [editForm, setEditForm] = useState<UpdateSubjectRequest>({
    name: "",
    description: "",
  });

  // Load subjects from API
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const subjectsList = await subjectsService.getSubjects();
      setSubjects(subjectsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu môn học');
      console.error('Error loading subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!createForm.name.trim()) {
      setError('Vui lòng nhập tên môn học');
      return;
    }
    
    try {
      setError(null);
      await subjectsService.createSubject(createForm);
      await loadSubjects();
      setIsCreateOpen(false);
      setCreateForm({ name: "", description: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo môn học');
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    try {
      await subjectsService.deleteSubject(subjectId);
      await loadSubjects();
      setIsDeleteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa môn học');
    }
  };

  const handleUpdateSubject = async () => {
    if (!selectedSubject) return;
    try {
      if (!editForm.name?.trim()) {
        setError("Vui lòng nhập tên môn học");
        return;
      }
      await subjectsService.updateSubject(selectedSubject.subjectId, editForm);
      await loadSubjects();
      setIsEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật môn học');
    }
  };

  const openView = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsViewOpen(true);
  };

  const openDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditForm({
      name: subject.name,
      description: subject.description ?? "",
    });
    setIsEditOpen(true);
  };

  return (
    <>
      <PageMeta title="Quản Lý Môn Học" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Môn Học</h1>
          <Button onClick={() => setIsCreateOpen(true)} startIcon={<PlusIcon className="h-4 w-4" />}>
            Tạo Môn Học Mới
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{subjects.length}</div>
            <div className="text-sm text-gray-500">Tổng môn học</div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadSubjects} className="mt-2">
              Thử lại
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên môn học</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Chưa có môn học nào
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subject) => (
                  <TableRow key={subject.subjectId} className="border-t border-gray-100 dark:border-gray-800">
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {subject.name}
                      </div>
                      <div className="text-xs text-gray-500">ID: {subject.subjectId}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {subject.description || '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {new Date(subject.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openView(subject)}
                          title="Xem"
                          className="!p-2"
                        >
                          <EyeIcon className="h-4 w-4 fill-current" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEdit(subject)}
                          title="Sửa"
                          className="!p-2"
                        >
                          <PencilIcon className="h-4 w-4 fill-current" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="!bg-red-500 hover:!bg-red-600 !p-2" 
                          onClick={() => openDelete(subject)}
                          title="Xóa"
                        >
                          <TrashBinIcon className="h-4 w-4 fill-white" />
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
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} className="max-w-2xl p-6">
        {selectedSubject && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Chi Tiết Môn Học</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tên môn học:</label>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedSubject.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả:</label>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedSubject.description || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ngày tạo:</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(selectedSubject.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsViewOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal chỉnh sửa môn học */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} className="max-w-2xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Chỉnh Sửa Môn Học</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên môn học <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="Nhập tên môn học"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả</label>
              <textarea
                value={editForm.description ?? ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                rows={3}
                placeholder="Nhập mô tả môn học"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleUpdateSubject}>Lưu thay đổi</Button>
          </div>
        </div>
      </Modal>

      {/* Modal tạo mới */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-2xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Tạo Môn Học Mới</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên môn học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="Nhập tên môn học"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả
              </label>
              <textarea
                value={createForm.description ?? ''}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                rows={3}
                placeholder="Nhập mô tả môn học"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateSubject}>
              Tạo Môn Học
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-sm p-6">
        {selectedSubject && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Xóa môn học?</h3>
            <p className="text-sm text-gray-600">
              Bạn chắc chắn muốn xóa môn học "<strong>{selectedSubject.name}</strong>"? 
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
              <Button className="!bg-red-500 hover:!bg-red-600" onClick={() => handleDeleteSubject(selectedSubject.subjectId)}>
                Xóa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

