import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
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
  const [isAddNewQuestionOpen, setIsAddNewQuestionOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<QuestionBankResponse[]>([]);
  const [bankQuestionsTotal, setBankQuestionsTotal] = useState<number>(0);
  const [bankQuestionsPage, setBankQuestionsPage] = useState<number>(1);
  const [bankQuestionsPageSize, setBankQuestionsPageSize] = useState<number>(10);
  const [bankQuestionsTotalPages, setBankQuestionsTotalPages] = useState<number>(0);
  const [selectedBankIds, setSelectedBankIds] = useState<number[]>([]);
  const [defaultMarks, setDefaultMarks] = useState<number>(1);
  const [bankFilter, setBankFilter] = useState<{ searchContent?: string; questionType?: string; difficulty?: string; subjectId?: number }>({});
  const [loadingBankQuestions, setLoadingBankQuestions] = useState(false);
  
  // Form state cho thêm câu hỏi mới
  const [newQuestionForm, setNewQuestionForm] = useState<{
    content: string;
    questionType: string;
    difficulty: string;
    marks: number;
    answerOptions: { content: string; isCorrect: boolean; orderIndex?: number }[];
  }>({
    content: "",
    questionType: "MultipleChoice",
    difficulty: "Medium",
    marks: 1,
    answerOptions: [
      { content: "", isCorrect: false, orderIndex: 1 },
      { content: "", isCorrect: false, orderIndex: 2 },
      { content: "", isCorrect: false, orderIndex: 3 },
      { content: "", isCorrect: false, orderIndex: 4 },
    ],
  });

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
    // ✅ NEW FIELDS FOR CERTIFICATION EXAMS
    subjectId: undefined,
    imageUrl: "",
    price: undefined,
    originalPrice: undefined,
    level: "",
    difficulty: "",
    provider: "",
    featuresJson: "",
    validPeriod: "",
  });
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateExamRequest>({
    title: "",
    description: "",
    durationMinutes: undefined,
    totalQuestions: undefined,
    totalMarks: undefined,
    passingMark: undefined,
    examType: undefined,
    status: undefined,
    // ✅ NEW FIELDS FOR CERTIFICATION EXAMS
    subjectId: undefined,
    imageUrl: undefined,
    price: undefined,
    originalPrice: undefined,
    level: undefined,
    difficulty: undefined,
    provider: undefined,
    featuresJson: undefined,
    validPeriod: undefined,
  });

  // Filters
  const [titleQuery, setTitleQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">("");
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(1);
  const [currentPageSize, setCurrentPageSize] = useState<number>(20);

  // Load exams from API
  useEffect(() => {
    loadExams(currentPageIndex, currentPageSize);
  }, [currentPageIndex, currentPageSize]);

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

  // ✅ Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('File không được vượt quá 20MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await examsService.uploadExamImage(formData);
      setCreateForm({ ...createForm, imageUrl: response.url });
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Lỗi khi upload ảnh');
    } finally {
      setUploadingImage(false);
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
        // ✅ Reset new fields
        subjectId: undefined,
        imageUrl: "",
        price: undefined,
        originalPrice: undefined,
        level: "",
        difficulty: "",
        provider: "",
        featuresJson: "",
        validPeriod: "",
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
      setError(null);
      await examsService.deleteExam(examId);
      await loadExams();
      setIsDeleteOpen(false);
      setSelectedExam(null);
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
    setEditForm({
      title: exam.title,
      description: exam.description || "",
      durationMinutes: exam.durationMinutes,
      totalQuestions: exam.totalQuestions,
      totalMarks: exam.totalMarks,
      passingMark: exam.passingMark,
      examType: exam.examType,
      status: exam.status,
    });
    setIsEditOpen(true);
  };

  const loadBankQuestions = async (page = 1, pageSize = 10) => {
    try {
      setLoadingBankQuestions(true);
      const result = await questionsService.getQuestions({
        page,
        pageSize,
        ...bankFilter,
      });
      setBankQuestions(result.questions);
      setBankQuestionsTotal(result.totalCount);
      setBankQuestionsPage(result.page);
      setBankQuestionsPageSize(result.pageSize);
      setBankQuestionsTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải ngân hàng câu hỏi');
    } finally {
      setLoadingBankQuestions(false);
    }
  };

  const openAddFromBank = async (exam: ExamListItemDto) => {
    setSelectedExam(exam);
    setIsAddFromBankOpen(true);
    setDefaultMarks(1);
    setSelectedBankIds([]);
    setBankFilter({});
    await loadBankQuestions(1, 10);
  };

  const toggleSelectedBankId = (id: number) => {
    setSelectedBankIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSelectedFromBank = async () => {
    if (!selectedExam) return;
    if (selectedBankIds.length === 0) {
      setError('Vui lòng chọn ít nhất một câu hỏi');
      return;
    }
    try {
      setError(null);
      await examsService.addQuestionsFromBank(selectedExam.id, { questionIds: selectedBankIds, defaultMarks });
      setIsAddFromBankOpen(false);
      setSelectedBankIds([]);
      setBankFilter({});
      await loadExams(); // Reload danh sách
      await refreshDetail(); // Refresh chi tiết nếu đang mở
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi thêm câu hỏi từ ngân hàng');
    }
  };

  const handleBankFilterChange = async () => {
    await loadBankQuestions(1, bankQuestionsPageSize);
  };

  const openAddNewQuestion = (exam: ExamListItemDto) => {
    setSelectedExam(exam);
    setIsAddNewQuestionOpen(true);
    setNewQuestionForm({
      content: "",
      questionType: "MultipleChoice",
      difficulty: "Medium",
      marks: 1,
      answerOptions: [
        { content: "", isCorrect: false, orderIndex: 1 },
        { content: "", isCorrect: false, orderIndex: 2 },
        { content: "", isCorrect: false, orderIndex: 3 },
        { content: "", isCorrect: false, orderIndex: 4 },
      ],
    });
  };

  const handleAddNewQuestion = async () => {
    if (!selectedExam) return;
    
    // Validate
    if (!newQuestionForm.content.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    
    const validOptions = newQuestionForm.answerOptions.filter(opt => opt.content.trim());
    if (validOptions.length < 2) {
      setError('Câu hỏi phải có ít nhất 2 đáp án');
      return;
    }
    
    const hasCorrectAnswer = validOptions.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      setError('Câu hỏi phải có ít nhất một đáp án đúng');
      return;
    }
    
    try {
      setError(null);
      await examsService.addQuestionToExam(selectedExam.id, {
        content: newQuestionForm.content,
        questionType: newQuestionForm.questionType,
        difficulty: newQuestionForm.difficulty,
        marks: newQuestionForm.marks,
        answerOptions: validOptions.map((opt, idx) => ({
          content: opt.content,
          isCorrect: opt.isCorrect,
          orderIndex: idx + 1,
        })),
      });
      setIsAddNewQuestionOpen(false);
      await loadExams();
      await refreshDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi thêm câu hỏi mới');
    }
  };

  const addAnswerOption = () => {
    setNewQuestionForm({
      ...newQuestionForm,
      answerOptions: [
        ...newQuestionForm.answerOptions,
        { content: "", isCorrect: false, orderIndex: newQuestionForm.answerOptions.length + 1 },
      ],
    });
  };

  const removeAnswerOption = (index: number) => {
    if (newQuestionForm.answerOptions.length <= 2) {
      setError('Câu hỏi phải có ít nhất 2 đáp án');
      return;
    }
    setNewQuestionForm({
      ...newQuestionForm,
      answerOptions: newQuestionForm.answerOptions.filter((_, i) => i !== index),
    });
  };

  const updateAnswerOption = (index: number, field: 'content' | 'isCorrect', value: string | boolean) => {
    const updated = [...newQuestionForm.answerOptions];
    updated[index] = { ...updated[index], [field]: value };
    setNewQuestionForm({ ...newQuestionForm, answerOptions: updated });
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

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài thi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số câu hỏi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm đạt</TableCell>
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
                  <TableRow key={exam.id} className="border-t border-gray-100 dark:border-gray-800">
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
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openDetail(exam)}>
                          Chi tiết
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(exam)}>
                          Sửa
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAddNewQuestion(exam)}>
                          Thêm câu hỏi mới
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAddFromBank(exam)}>
                          Thêm từ ngân hàng
                        </Button>
                        <Button size="sm" className="!bg-red-500 hover:!bg-red-600" onClick={() => openDelete(exam)}>
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

        {/* Pagination */}
        {paged && paged.totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setCurrentPageIndex(1)}
                disabled={!paged.hasPreviousPage || paged.pageIndex === 1}
              >
                « Đầu
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setCurrentPageIndex((p: number) => Math.max(1, p - 1))}
                disabled={!paged.hasPreviousPage}
              >
                ‹ Trước
              </Button>
              
              {/* Hiển thị số trang */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, paged.totalPages) }, (_, i) => {
                  let pageNum;
                  if (paged.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (paged.pageIndex <= 3) {
                    pageNum = i + 1;
                  } else if (paged.pageIndex >= paged.totalPages - 2) {
                    pageNum = paged.totalPages - 4 + i;
                  } else {
                    pageNum = paged.pageIndex - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={paged.pageIndex === pageNum ? "primary" : "outline"}
                      onClick={() => setCurrentPageIndex(pageNum)}
                      className={paged.pageIndex === pageNum ? "!bg-blue-500 !text-white" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setCurrentPageIndex((p: number) => Math.min(paged.totalPages, p + 1))}
                disabled={!paged.hasNextPage}
              >
                Sau ›
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setCurrentPageIndex(paged.totalPages)}
                disabled={!paged.hasNextPage || paged.pageIndex === paged.totalPages}
              >
                Cuối »
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>
                Trang <strong>{paged.pageIndex}</strong> / <strong>{paged.totalPages}</strong>
              </span>
              <span className="text-gray-400">|</span>
              <span>
                Tổng: <strong>{paged.total}</strong> bài thi
              </span>
              <span className="text-gray-400">|</span>
              <span>
                Hiển thị <strong>{paged.items.length}</strong> / <strong>{paged.pageSize}</strong> mỗi trang
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal tạo bài thi mới */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Tạo Bài Thi Mới (Certification Exam)</h3>
          
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

            {/* ✅ NEW: Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ảnh bìa (Cover Image)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
                {uploadingImage && <span className="text-sm text-gray-500">Đang tải...</span>}
              </div>
              {createForm.imageUrl && (
                <div className="mt-2">
                  <img src={createForm.imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded" />
                </div>
              )}
            </div>

            {/* ✅ NEW: Price & Original Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Giá (VNĐ)
                </label>
                <input
                  type="number"
                  value={createForm.price || ""}
                  onChange={(e) => setCreateForm({ ...createForm, price: parseFloat(e.target.value) || undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="Nhập giá"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Giá gốc (VNĐ)
                </label>
                <input
                  type="number"
                  value={createForm.originalPrice || ""}
                  onChange={(e) => setCreateForm({ ...createForm, originalPrice: parseFloat(e.target.value) || undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="Nhập giá gốc"
                  min="0"
                />
              </div>
            </div>

            {/* ✅ NEW: Level & Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Level
                </label>
                <select
                  value={createForm.level}
                  onChange={(e) => setCreateForm({ ...createForm, level: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="">-- Chọn Level --</option>
                  <option value="Entry">Entry</option>
                  <option value="Associate">Associate</option>
                  <option value="Professional">Professional</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Độ khó
                </label>
                <select
                  value={createForm.difficulty}
                  onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="">-- Chọn độ khó --</option>
                  <option value="Cơ bản">Cơ bản</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Nâng cao">Nâng cao</option>
                </select>
              </div>
            </div>

            {/* ✅ NEW: Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provider / Nhà cung cấp
              </label>
              <input
                type="text"
                value={createForm.provider}
                onChange={(e) => setCreateForm({ ...createForm, provider: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="Ví dụ: AWS, Microsoft, Google Cloud, CompTIA"
              />
            </div>

            {/* ✅ NEW: Valid Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thời hạn hiệu lực
              </label>
              <input
                type="text"
                value={createForm.validPeriod}
                onChange={(e) => setCreateForm({ ...createForm, validPeriod: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="Ví dụ: 3 năm, 2 years"
              />
            </div>

            {/* ✅ NEW: Features JSON */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tính năng (JSON format)
              </label>
              <textarea
                value={createForm.featuresJson}
                onChange={(e) => setCreateForm({ ...createForm, featuresJson: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700 font-mono"
                rows={3}
                placeholder='["Thi thử không giới hạn", "Câu hỏi thực tế", "Chấm điểm tự động"]'
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
                  Điểm đạt 
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
                {/* ✅ NEW: Cover Image */}
                {examDetail.imageUrl && (
                  <div>
                    <strong>Ảnh bìa:</strong>
                    <div className="mt-2">
                      <img 
                        src={examDetail.imageUrl} 
                        alt={examDetail.title} 
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  </div>
                )}
                
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
                    <strong>Điểm đạt:</strong>
                    <p className="text-gray-600 dark:text-gray-400">{examDetail.passingMark ?? 0}</p>
                  </div>
                  <div>
                    <strong>Ngày tạo:</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(examDetail.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  
                  {/* ✅ NEW: Certification Exam Fields */}
                  {examDetail.price !== null && examDetail.price !== undefined && (
                    <div>
                      <strong>Giá:</strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        {new Intl.NumberFormat('vi-VN').format(examDetail.price)} ₫
                        {examDetail.originalPrice && examDetail.originalPrice > examDetail.price && (
                          <span className="ml-2 text-gray-400 line-through">
                            {new Intl.NumberFormat('vi-VN').format(examDetail.originalPrice)} ₫
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {examDetail.level && (
                    <div>
                      <strong>Level:</strong>
                      <p className="text-gray-600 dark:text-gray-400">{examDetail.level}</p>
                    </div>
                  )}
                  {examDetail.difficulty && (
                    <div>
                      <strong>Độ khó:</strong>
                      <p className="text-gray-600 dark:text-gray-400">{examDetail.difficulty}</p>
                    </div>
                  )}
                  {examDetail.provider && (
                    <div>
                      <strong>Provider:</strong>
                      <p className="text-gray-600 dark:text-gray-400">{examDetail.provider}</p>
                    </div>
                  )}
                  {examDetail.validPeriod && (
                    <div>
                      <strong>Thời hạn hiệu lực:</strong>
                      <p className="text-gray-600 dark:text-gray-400">{examDetail.validPeriod}</p>
                    </div>
                  )}
                </div>
                <div>
                  <strong>Mô tả:</strong>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{examDetail.description ?? ''}</p>
                </div>
                {/* ✅ NEW: Features */}
                {examDetail.featuresJson && (
                  <div>
                    <strong>Tính năng:</strong>
                    <div className="mt-1">
                      {(() => {
                        try {
                          const features = JSON.parse(examDetail.featuresJson);
                          if (Array.isArray(features)) {
                            return (
                              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                                {features.map((feature: string, idx: number) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                            );
                          }
                        } catch (e) {
                          return <p className="text-gray-600 dark:text-gray-400">{examDetail.featuresJson}</p>;
                        }
                      })()}
                    </div>
                  </div>
                )}
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
      <Modal isOpen={isAddFromBankOpen} onClose={() => setIsAddFromBankOpen(false)} className="max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Thêm câu hỏi từ ngân hàng</h3>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tìm kiếm</label>
              <input
                type="text"
                value={bankFilter.searchContent || ''}
                onChange={(e) => setBankFilter({ ...bankFilter, searchContent: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleBankFilterChange()}
                placeholder="Tìm theo nội dung..."
                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại câu hỏi</label>
              <select
                value={bankFilter.questionType || ''}
                onChange={(e) => setBankFilter({ ...bankFilter, questionType: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">Tất cả</option>
                <option value="MultipleChoice">Trắc nghiệm</option>
                <option value="TrueFalse">Đúng/Sai</option>
                <option value="ShortAnswer">Tự luận</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Độ khó</label>
              <select
                value={bankFilter.difficulty || ''}
                onChange={(e) => setBankFilter({ ...bankFilter, difficulty: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">Tất cả</option>
                <option value="Easy">Dễ</option>
                <option value="Medium">Trung bình</option>
                <option value="Hard">Khó</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" onClick={handleBankFilterChange} className="flex-1">
                Tìm kiếm
              </Button>
              {(bankFilter.searchContent || bankFilter.questionType || bankFilter.difficulty) && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setBankFilter({});
                    loadBankQuestions(1, bankQuestionsPageSize);
                  }}
                  title="Xóa bộ lọc"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Đã chọn: <strong>{selectedBankIds.length}</strong> câu hỏi
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tổng: <strong>{bankQuestionsTotal}</strong> câu hỏi
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                {loadingBankQuestions ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">Đang tải...</span>
                  </div>
                ) : bankQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Không tìm thấy câu hỏi nào</div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Chọn</th>
                        <th className="px-4 py-2 text-left">Nội dung</th>
                        <th className="px-4 py-2 text-left">Loại</th>
                        <th className="px-4 py-2 text-left">Độ khó</th>
                        <th className="px-4 py-2 text-left">Điểm</th>
                        <th className="px-4 py-2 text-left">Môn học</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankQuestions.map(q => (
                        <tr key={q.questionId} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-2">
                            <input 
                              type="checkbox" 
                              checked={selectedBankIds.includes(q.questionId)} 
                              onChange={() => toggleSelectedBankId(q.questionId)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-2 max-w-xs" title={q.content}>
                            <div className="truncate">{q.content}</div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                              {q.questionType === 'MultipleChoice' ? 'Trắc nghiệm' : q.questionType === 'TrueFalse' ? 'Đúng/Sai' : q.questionType || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              q.difficulty === 'Easy' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                              q.difficulty === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                              q.difficulty === 'Hard' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                              'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
                            }`}>
                              {q.difficulty === 'Easy' ? 'Dễ' : q.difficulty === 'Medium' ? 'Trung bình' : q.difficulty === 'Hard' ? 'Khó' : q.difficulty || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-2">{q.marks ?? 0}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">{q.subjectName || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Pagination */}
              {bankQuestionsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Trang {bankQuestionsPage} / {bankQuestionsTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => loadBankQuestions(bankQuestionsPage - 1, bankQuestionsPageSize)}
                      disabled={bankQuestionsPage <= 1}
                    >
                      Trước
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => loadBankQuestions(bankQuestionsPage + 1, bankQuestionsPageSize)}
                      disabled={bankQuestionsPage >= bankQuestionsTotalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Điểm mặc định</label>
                <input 
                  type="number" 
                  value={defaultMarks} 
                  onChange={e => setDefaultMarks(parseFloat(e.target.value) || 0)} 
                  min={0.1}
                  step={0.1}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700" 
                />
                <p className="text-xs text-gray-500 mt-2">
                  Áp dụng nếu câu hỏi không có điểm riêng, hoặc để ghi đè theo mặc định.
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <Button 
                    onClick={addSelectedFromBank} 
                    disabled={selectedBankIds.length === 0}
                    className="w-full"
                  >
                    Thêm {selectedBankIds.length > 0 ? `${selectedBankIds.length} ` : ''}câu hỏi
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddFromBankOpen(false);
                      setSelectedBankIds([]);
                      setBankFilter({});
                    }}
                    className="w-full"
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal thêm câu hỏi mới */}
      <Modal isOpen={isAddNewQuestionOpen} onClose={() => setIsAddNewQuestionOpen(false)} className="max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Thêm câu hỏi mới vào bài thi</h3>
          
          <div className="space-y-4">
            {/* Nội dung câu hỏi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nội dung câu hỏi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newQuestionForm.content}
                onChange={(e) => setNewQuestionForm({ ...newQuestionForm, content: e.target.value })}
                placeholder="Nhập nội dung câu hỏi..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                required
              />
            </div>

            {/* Loại câu hỏi, Độ khó, Điểm */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại câu hỏi
                </label>
                <select
                  value={newQuestionForm.questionType}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, questionType: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="MultipleChoice">Trắc nghiệm</option>
                  <option value="TrueFalse">Đúng/Sai</option>
                  <option value="ShortAnswer">Tự luận</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Độ khó
                </label>
                <select
                  value={newQuestionForm.difficulty}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, difficulty: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="Easy">Dễ</option>
                  <option value="Medium">Trung bình</option>
                  <option value="Hard">Khó</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Điểm số
                </label>
                <input
                  type="number"
                  value={newQuestionForm.marks}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, marks: parseFloat(e.target.value) || 1 })}
                  min={0.1}
                  step={0.1}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Đáp án */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Đáp án <span className="text-red-500">*</span>
                </label>
                <Button size="sm" variant="outline" onClick={addAnswerOption}>
                  + Thêm đáp án
                </Button>
              </div>
              <div className="space-y-2">
                {newQuestionForm.answerOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => updateAnswerOption(index, 'isCorrect', e.target.checked)}
                      className="rounded"
                    />
                    <input
                      type="text"
                      value={option.content}
                      onChange={(e) => updateAnswerOption(index, 'content', e.target.value)}
                      placeholder={`Đáp án ${index + 1}...`}
                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                    />
                    {newQuestionForm.answerOptions.length > 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeAnswerOption(index)}
                        className="!text-red-500 hover:!bg-red-50"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ✓ Đánh dấu checkbox để chọn đáp án đúng. Câu hỏi phải có ít nhất 2 đáp án và ít nhất 1 đáp án đúng.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setIsAddNewQuestionOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddNewQuestion}>
              Thêm câu hỏi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal sửa bài thi */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} className="max-w-2xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Sửa Bài Thi</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề bài thi
              </label>
              <input
                type="text"
                value={editForm.title || ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="Nhập tiêu đề bài thi"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả
              </label>
              <textarea
                value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
                  value={editForm.durationMinutes || ""}
                  onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value ? parseInt(e.target.value) : undefined })}
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
                  value={editForm.totalQuestions || ""}
                  onChange={(e) => setEditForm({ ...editForm, totalQuestions: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Điểm đạt
                </label>
                <input
                  type="number"
                  value={editForm.passingMark || ""}
                  onChange={(e) => setEditForm({ ...editForm, passingMark: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại bài thi
              </label>
              <select
                value={editForm.examType || ""}
                onChange={(e) => setEditForm({ ...editForm, examType: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">-- Chọn loại --</option>
                <option value="Quiz">Quiz</option>
                <option value="Midterm">Giữa kỳ</option>
                <option value="Final">Cuối kỳ</option>
                <option value="Practice">Luyện tập</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái
              </label>
              <select
                value={editForm.status || ""}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">-- Chọn trạng thái --</option>
                <option value="Draft">Nháp</option>
                <option value="Active">Hoạt động</option>
                <option value="Inactive">Tạm dừng</option>
                <option value="Completed">Hoàn thành</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => selectedExam && handleUpdateExam(selectedExam.id, editForm)}>
              Cập nhật
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}


