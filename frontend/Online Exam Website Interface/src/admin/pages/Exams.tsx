import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import FlyonDataTableWrapper from "../../teacher/components/ui/table/FlyonDataTableWrapper";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { examsService, type ExamListItemDto, type CreateExamRequest, type UpdateExamRequest, type PagedResponse, type ExamDetailDto } from "../services/exams.service";
import { questionsService, type QuestionBankResponse } from "../services/questions.service";

export default function Exams() {
  const [paged, setPaged] = useState<PagedResponse<ExamListItemDto> | null>(null);
  const exams = paged?.items ?? [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedExam, setSelectedExam] = useState<ExamListItemDto | null>(null);
  const [examDetail, setExamDetail] = useState<ExamDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddFromBankOpen, setIsAddFromBankOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<QuestionBankResponse[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<number[]>([]);
  const [defaultMarks, setDefaultMarks] = useState<number>(1);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateExamRequest>({
    title: "",
    description: "",
    durationMinutes: 60,
    totalQuestions: 10,
    totalMarks: 10,
    passingMark: 7,
    examType: "Quiz",
    randomizeQuestions: false,
    allowMultipleAttempts: true,
    status: "Draft",
    questions: [],
  });

  // Filters
  const [titleQuery, setTitleQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">("");

  // Load exams from API
  useEffect(() => {
    loadExams(pageIndex, pageSize);
  }, [pageIndex, pageSize]);

  const loadExams = async (pageIndex = 1, pageSize = 20) => {
    try {
      setLoading(true);
      setError(null);
      const data = await examsService.getExams({ pageIndex, pageSize });
      setPaged(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu bài thi');
      console.error('Error loading exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    try {
      await examsService.createExam(createForm);
      await loadExams();
      setIsCreateOpen(false);
      setCreateForm({
        title: "",
        description: "",
        durationMinutes: 60,
        totalQuestions: 10,
        totalMarks: 10,
        passingMark: 7,
        examType: "Quiz",
        randomizeQuestions: false,
        allowMultipleAttempts: true,
        status: "Draft",
        questions: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo bài thi');
    }
  };

  const handleUpdateExam = async (examId: number, updateData: UpdateExamRequest) => {
    try {
      await examsService.updateExam(examId, updateData);
      await loadExams();
      setIsEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật bài thi');
    }
  };

  const handleDeleteExam = async (examId: number) => {
    try {
      await examsService.deleteExam(examId);
      await loadExams();
      setIsDeleteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa bài thi');
    }
  };

  const filteredExams = exams.filter((exam) => {
    const matchTitle = !titleQuery || exam.title.toLowerCase().includes(titleQuery.toLowerCase());
    const isActive = (exam.status ?? '').toLowerCase() === 'active';
    const matchActive = !activeFilter || 
      (activeFilter === "active" && isActive) || 
      (activeFilter === "inactive" && !isActive);
    return matchTitle && matchActive;
  });

  const openDetail = async (exam: ExamListItemDto) => {
    try {
      setSelectedExam(exam);
      setIsDetailOpen(true);
      setDetailLoading(true);
      const detail = await examsService.getExamById(exam.id);
      setExamDetail(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải chi tiết bài thi');
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!selectedExam) return;
    await openDetail(selectedExam);
  };

  const openEdit = (exam: ExamListItemDto) => {
    setSelectedExam(exam);
    setIsEditOpen(true);
  };

  const openAddFromBank = async (exam: ExamListItemDto) => {
    try {
      setSelectedExam(exam);
      setIsAddFromBankOpen(true);
      setDefaultMarks(1);
      setSelectedBankIds([]);
      const qs = await questionsService.getQuestions();
      setBankQuestions(qs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải ngân hàng câu hỏi');
    }
  };

  const toggleSelectedBankId = (id: number) => {
    setSelectedBankIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSelectedFromBank = async () => {
    if (!selectedExam) return;
    try {
      await examsService.addQuestionsFromBank(selectedExam.id, { questionIds: selectedBankIds, defaultMarks });
      setIsAddFromBankOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi thêm câu hỏi từ ngân hàng');
    }
  };

  const openDelete = (exam: ExamListItemDto) => {
    setSelectedExam(exam);
    setIsDeleteOpen(true);
  };

  const toggleExamStatus = async (examId: number, currentStatus: boolean) => {
    try {
      await examsService.updateExam(examId, { status: currentStatus ? 'Draft' : 'Active' });
      await loadExams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái bài thi');
    }
  };

  return (
    <>
      <PageMeta title="Quản Lý Bài Thi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Bài Thi</h1>
          <Button onClick={() => setIsCreateOpen(true)}>
            Tạo Bài Thi Mới
          </Button>
        </div>

        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadExams} className="mt-2">
              Thử lại
            </Button>
          </div>
        )}

        <FlyonDataTableWrapper pageLength={10} selecting selectAllSelector="#adm-ex-checkbox-all">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="w-4 pr-0 --exclude-from-ordering">
                  <div className="flex h-5">
                    <input id="adm-ex-checkbox-all" type="checkbox" className="checkbox checkbox-sm" />
                    <label htmlFor="adm-ex-checkbox-all" className="sr-only">Checkbox</label>
                  </div>
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài thi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số câu hỏi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm đậu</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {exams.length === 0 ? "Chưa có bài thi nào" : "Không tìm thấy kết quả nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExams.map((exam) => (
                  <TableRow key={exam.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    <TableCell className="w-4 pr-0">
                      <div className="flex h-5 items-center">
                        <input id={`adm-ex-row-${exam.id}`} type="checkbox" className="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                        <label htmlFor={`adm-ex-row-${exam.id}`} className="sr-only">Checkbox</label>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{exam.title}</span>
                        <span className="text-sm text-gray-500">{(exam.description ?? '').length > 50 ? (exam.description ?? '').substring(0, 50) + '...' : (exam.description ?? '')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{exam.durationMinutes ?? 0} phút</TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{exam.totalQuestions ?? 0} câu</TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{exam.passingMark ?? 0}</TableCell>
                    <TableCell className="px-6 py-4">
                      <button
                        onClick={() => toggleExamStatus(exam.id, (exam.status ?? '').toLowerCase() === 'active')}
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ${
                          (exam.status ?? '').toLowerCase() === 'active'
                            ? 'ring-green-200 dark:ring-green-700 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' 
                            : 'ring-red-200 dark:ring-red-700 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        {(exam.status ?? '').toLowerCase() === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </button>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn btn-circle btn-text" aria-label="Chi tiết" onClick={() => openDetail(exam)}>
                          <span className="icon-[tabler--eye] size-5"></span>
                        </button>
                        <button className="btn btn-circle btn-text" aria-label="Sửa" onClick={() => openEdit(exam)}>
                          <span className="icon-[tabler--pencil] size-5"></span>
                        </button>
                        <button className="btn btn-circle btn-text" aria-label="Xóa" onClick={() => openDelete(exam)}>
                          <span className="icon-[tabler--trash] size-5"></span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </FlyonDataTableWrapper>
      </div>

      {/* Modal tạo bài thi mới */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-2xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Tạo Bài Thi Mới</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề bài thi
              </label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="Nhập tiêu đề bài thi"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                rows={3}
                placeholder="Nhập mô tả bài thi"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thời gian (phút)
                </label>
                <input
                  type="number"
                  value={createForm.durationMinutes}
                  onChange={(e) => setCreateForm({ ...createForm, durationMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Số câu hỏi
                </label>
                <input
                  type="number"
                  value={createForm.totalQuestions}
                  onChange={(e) => setCreateForm({ ...createForm, totalQuestions: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Điểm đậu (%)
                </label>
                <input
                  type="number"
                  value={createForm.passingMark}
                  onChange={(e) => setCreateForm({ ...createForm, passingMark: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateExam}>
              Tạo Bài Thi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal chi tiết bài thi */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-2xl p-6">
        {selectedExam && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Chi Tiết Bài Thi</h3>
            {detailLoading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="text-gray-500">Đang tải chi tiết...</span>
              </div>
            )}
            {examDetail && !detailLoading && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Tiêu đề:</strong>
                    <p className="text-gray-600 dark:text-gray-400">{examDetail.title}</p>
                  </div>
                  <div>
                    <strong>Trạng thái:</strong>
                    <p className={`text-sm ${(examDetail.status ?? '').toLowerCase() === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {(examDetail.status ?? '').toLowerCase() === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                    </p>
                  </div>
                  <div>
                    <strong>Thời gian:</strong>
                    <p className="text-gray-600 dark:text-gray-400">{examDetail.durationMinutes ?? 0} phút</p>
                  </div>
                  <div>
                    <strong>Số câu hỏi:</strong>
                    <p className="text-gray-600 dark:text-gray-400">{examDetail.totalQuestions ?? 0} câu</p>
                  </div>
                  <div>
                    <strong>Điểm đậu:</strong>
                    <p className="text-gray-600 dark:text-gray-400">{examDetail.passingMark ?? 0}</p>
                  </div>
                  <div>
                    <strong>Ngày tạo:</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(examDetail.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div>
                  <strong>Mô tả:</strong>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{examDetail.description ?? ''}</p>
                </div>
                <div>
                  <strong>Câu hỏi trong bài thi:</strong>
                  {examDetail.questions?.length ? (
                    <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                          <tr>
                            <th className="px-4 py-2 text-left">#</th>
                            <th className="px-4 py-2 text-left">Nội dung</th>
                            <th className="px-4 py-2 text-left">Điểm</th>
                            <th className="px-4 py-2 text-left">Phương án</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examDetail.questions.map((q, idx) => (
                            <tr key={q.examQuestionId} className="border-t border-gray-100 dark:border-gray-800">
                              <td className="px-4 py-2">{idx + 1}</td>
                              <td className="px-4 py-2 max-w-xs truncate" title={q.content}>{q.content}</td>
                              <td className="px-4 py-2">{q.marks ?? 0}</td>
                              <td className="px-4 py-2">{q.options?.length ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">Chưa có câu hỏi nào trong bài thi.</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={refreshDetail}>Làm mới</Button>
                  <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-sm p-6">
        {selectedExam && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Xóa bài thi?</h3>
            <p className="text-sm text-gray-600">
              Bạn chắc chắn muốn xóa bài thi "{selectedExam.title}"? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
              <Button className="!bg-red-500 hover:!bg-red-600" onClick={() => handleDeleteExam(selectedExam.id)}>
                Xóa
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal thêm câu hỏi từ ngân hàng */}
      <Modal isOpen={isAddFromBankOpen} onClose={() => setIsAddFromBankOpen(false)} className="max-w-3xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Thêm câu hỏi từ ngân hàng</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left">Chọn</th>
                      <th className="px-4 py-2 text-left">Nội dung</th>
                      <th className="px-4 py-2 text-left">Loại</th>
                      <th className="px-4 py-2 text-left">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankQuestions.map(q => (
                      <tr key={q.questionId} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2">
                          <input type="checkbox" checked={selectedBankIds.includes(q.questionId)} onChange={() => toggleSelectedBankId(q.questionId)} />
                        </td>
                        <td className="px-4 py-2 max-w-xs truncate" title={q.content}>{q.content}</td>
                        <td className="px-4 py-2">{q.questionType}</td>
                        <td className="px-4 py-2">{q.marks ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Điểm mặc định</label>
              <input type="number" value={defaultMarks} onChange={e => setDefaultMarks(parseInt(e.target.value) || 0)} min={0} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700" />
              <p className="text-xs text-gray-500 mt-2">Áp dụng nếu câu hỏi không có điểm riêng, hoặc để ghi đè theo mặc định.</p>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsAddFromBankOpen(false)}>Hủy</Button>
                <Button onClick={addSelectedFromBank} disabled={selectedBankIds.length === 0}>Thêm vào bài thi</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}


