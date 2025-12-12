import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";

import { Modal } from "../components/ui/modal";
import { questionsService, type QuestionBankResponse, type CreateQuestionBankRequest, type UpdateQuestionBankRequest } from "../services/questions.service";
import { subjectsService, type Subject } from "../services/subjects.service";
import { materialsService } from "../services/materials.service";
import { EyeIcon, PencilIcon, TrashBinIcon, PlusIcon } from "../icons";

export default function Questions() {
  const [questions, setQuestions] = useState<QuestionBankResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankResponse | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateQuestionBankRequest & { allowMultipleAnswers?: boolean }>({
    content: "",
    questionType: "MultipleChoice",
    difficulty: "Easy",
    marks: 1,
    tags: "",
    subjectId: 0,
    allowMultipleAnswers: false,
    answerOptions: [
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ],
  });

  const [editForm, setEditForm] = useState<UpdateQuestionBankRequest>({
    questionId: 0,
    content: "",
    questionType: "MultipleChoice",
    difficulty: "Easy",
    marks: 1,
    tags: "",
    subjectId: 0,
    answerOptions: []
  });
  

  

  // Filters
  const [contentQuery, setContentQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [difficultyQuery, setDifficultyQuery] = useState<string>("");

  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ Question: string; Options: string[]; CorrectAnswer: string }[]>([]);

  // Load subjects once
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load questions when pagination changes
  useEffect(() => {
    loadQuestions(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const loadSubjects = async () => {
    try {
      const subjectsList = await subjectsService.getSubjects();
      setSubjects(subjectsList);
      
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  };

  const loadQuestions = async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const filter: any = {
        page,
        pageSize: size,
      };
      
      // Apply filters if they exist
      if (contentQuery) filter.searchContent = contentQuery;
      if (categoryQuery) filter.tags = categoryQuery;
      if (difficultyQuery) filter.difficulty = difficultyQuery;
      
      const result = await questionsService.getQuestions(filter);
      // getQuestions() trả về QuestionBankListResponse với property 'questions'
      setQuestions(result.questions || []);
      setTotalCount(result.totalCount || 0);
      setTotalPages(result.totalPages || 0);
      setCurrentPage(result.page || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu câu hỏi');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  

  const handleCreateQuestion = async () => {
    if (!createForm.content.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    
    if (!createForm.subjectId || createForm.subjectId === 0) {
      setError('Vui lòng chọn môn học');
      return;
    }
    
    const validOptions = createForm.answerOptions.filter(opt => opt.content.trim());
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
      // Nếu allowMultipleAnswers = true thì set questionType = 'MultipleSelect', nếu không thì 'MultipleChoice'
      const questionType = createForm.allowMultipleAnswers ? 'MultipleSelect' : 'MultipleChoice';
      await questionsService.createQuestion({
        ...createForm,
        questionType: questionType,
        tags: serializeTags(createForm.tags ?? ''),
        answerOptions: validOptions.map((opt, idx) => ({
          content: opt.content,
          isCorrect: opt.isCorrect,
          orderIndex: idx + 1,
        })),
      });
      await loadQuestions(currentPage, pageSize);
      setIsCreateOpen(false);
      // Reset form
      setCreateForm({
        content: "",
        questionType: "MultipleChoice",
        difficulty: "Easy",
        marks: 1,
        tags: "",
        subjectId: 0,
        allowMultipleAnswers: false,
        answerOptions: [
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo câu hỏi');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await questionsService.deleteQuestion(questionId);
      await loadQuestions(currentPage, pageSize);
      setIsDeleteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa câu hỏi');
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion) return;
    try {
      if (!editForm.content?.trim()) {
        setError("Vui lòng nhập nội dung câu hỏi");
        return;
      }
      
      if (!editForm.subjectId || editForm.subjectId === 0) {
        setError('Vui lòng chọn môn học');
        return;
      }
      const payload = { ...editForm, tags: serializeTags(editForm.tags ?? '') };
      await questionsService.updateQuestion(selectedQuestion.questionId, payload);
      await loadQuestions(currentPage, pageSize);
      setIsEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật câu hỏi');
    }
  };

  // Handle filter changes - reset to page 1
  const handleFilterChange = () => {
    setCurrentPage(1);
    loadQuestions(1, pageSize);
  };
  
  // Questions are already filtered by API, no need for client-side filtering
  const filteredQuestions = questions;

  const getTypeLabel = (type?: string) => {
    const t = (type ?? '').toLowerCase();
    if (t === 'multiplechoice') return 'Trắc nghiệm';
    if (t === 'truefalse') return 'Đúng/Sai';
    if (t === 'shortanswer' || t === 'essay') return 'Tự luận';
    return type ?? '';
  };

  const getDifficultyLabel = (difficulty?: string) => {
    const d = (difficulty ?? '').toLowerCase();
    if (d === 'easy') return 'Dễ';
    if (d === 'medium') return 'Trung bình';
    if (d === 'hard') return 'Khó';
    return difficulty ?? '';
  };

  const getDifficultyColor = (difficulty?: string) => {
    const d = (difficulty ?? '').toLowerCase();
    switch (d) {
      case "easy": return "ring-green-200 text-green-600 dark:ring-green-900/40";
      case "medium": return "ring-yellow-200 text-yellow-600 dark:ring-yellow-900/40";
      case "hard": return "ring-red-200 text-red-600 dark:ring-red-900/40";
      default: return "ring-gray-200 text-gray-600 dark:ring-gray-900/40";
    }
  };

  const formatTags = (t?: string) => {
    const s = String(t || '').trim();
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map(x => String(x)).join(', ');
      } catch {}
    }
    return s;
  };

  const serializeTags = (t?: string) => {
    const s = String(t || '').trim();
    if (!s) return '';
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map(x => String(x).trim()).filter(x => x.length > 0).join(',');
      } catch {}
    }
    return s.split(',').map(x => x.trim()).filter(x => x.length > 0).join(',');
  };

  const openView = (question: QuestionBankResponse) => {
    setSelectedQuestion(question);
    setIsViewOpen(true);
  };

  const openDelete = (question: QuestionBankResponse) => {
    setSelectedQuestion(question);
    setIsDeleteOpen(true);
  };

  const openEdit = (question: QuestionBankResponse) => {
    setSelectedQuestion(question);
    setEditForm({
      content: question.content ?? "",
      questionType: question.questionType ?? "MultipleChoice",
      difficulty: question.difficulty ?? "Easy",
      marks: question.marks ?? 1,
      tags: formatTags(question.tags ?? ""),
      subjectId: question.subjectId ?? 0,
      answerOptions: (question.answerOptions ?? []).map((opt, idx) => ({
        content: opt.content ?? "",
        isCorrect: !!opt.isCorrect,
        orderIndex: opt.orderIndex ?? idx + 1,
      })),
    });
    setIsEditOpen(true);
  };

  return (
    <>
      <PageMeta title="Quản Lý Câu Hỏi" description="Quản Lý Câu Hỏi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Câu Hỏi</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsCreateOpen(true)} startIcon={<PlusIcon className="h-4 w-4" />}>
              Tạo Câu Hỏi Mới
            </Button>
            
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <div className="text-sm text-gray-500">Tổng câu hỏi</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">
              {questions.filter(q => (q.questionType ?? '').toLowerCase() === "multiplechoice").length}
            </div>
            <div className="text-sm text-gray-500">Trắc nghiệm</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600">
              {questions.filter(q => (q.questionType ?? '').toLowerCase() === "truefalse").length}
            </div>
            <div className="text-sm text-gray-500">Đúng/Sai</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600">
              {questions.filter(q => (q.questionType ?? '').toLowerCase() === "shortanswer").length}
            </div>
            <div className="text-sm text-gray-500">Tự luận</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={contentQuery}
            onChange={(e) => setContentQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
            placeholder="Tìm kiếm nội dung câu hỏi"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={categoryQuery}
            onChange={(e) => setCategoryQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
            placeholder="Lọc theo danh mục"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={difficultyQuery}
            onChange={(e) => {
              setDifficultyQuery((e.target.value || ""));
              handleFilterChange();
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả độ khó</option>
            <option value="Easy">Dễ</option>
            <option value="Medium">Trung bình</option>
            <option value="Hard">Khó</option>
          </select>
          <Button onClick={handleFilterChange} className="w-full">
            Tìm kiếm
          </Button>
        </div>

      {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={() => loadQuestions(currentPage, pageSize)} className="mt-2">
              Thử lại
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Câu hỏi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độ khó</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</TableCell>
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
              ) : filteredQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {questions.length === 0 ? "Chưa có câu hỏi nào" : "Không tìm thấy kết quả nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((question) => (
                  <TableRow key={question.questionId} className="border-t border-gray-100 dark:border-gray-800">
                    <TableCell className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {question.content}
                        </div>
                        <div className="text-xs text-gray-500">ID: {question.questionId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatTags(question.tags)}</TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-blue-200 text-blue-600 dark:ring-blue-900/40">
                        {getTypeLabel(question.questionType)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyLabel(question.difficulty)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{question.marks ?? 0}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openView(question)}
                          title="Xem"
                          className="!p-2"
                        >
                          <EyeIcon className="h-4 w-4 fill-current" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEdit(question)}
                          title="Sửa"
                          className="!p-2"
                        >
                          <PencilIcon className="h-4 w-4 fill-current" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="!bg-red-500 hover:!bg-red-600 !p-2" 
                          onClick={() => openDelete(question)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} câu hỏi
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                Trước
              </Button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Trang {currentPage} / {totalPages}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
              >
                Sau
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Số mục/trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Modal xem chi tiết */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} className="max-w-2xl p-6">
        {selectedQuestion && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Chi Tiết Câu Hỏi</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nội dung:</label>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedQuestion.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatTags(selectedQuestion.tags)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Loại:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{getTypeLabel(selectedQuestion.questionType)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Độ khó:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{getDifficultyLabel(selectedQuestion.difficulty)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Điểm:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedQuestion.marks ?? 0}</p>
                </div>
              </div>
              {selectedQuestion.answerOptions && selectedQuestion.answerOptions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Các lựa chọn:</label>
                  <ul className="mt-1 space-y-1">
                    {selectedQuestion.answerOptions.map((option, index) => {
                      const clean = String(option.content || '').replace(/^\s*([ABCDabcd])\s*[\.\)\-:]+\s+/, '').replace(/^(\d{1,2})\s*[\.\)\-:]+\s+/, '').replace(/^([ABCDabcd])\s+/, '').trim();
                      return (
                        <li key={index} className={`p-2 rounded ${option.isCorrect ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-gray-50 dark:bg-gray-800'}`}>
                          {String.fromCharCode(65 + index)}. {clean}
                          {option.isCorrect && " ✓"}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ngày tạo:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {new Date(selectedQuestion.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsViewOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      

    

      {/* Modal chỉnh sửa câu hỏi */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} className="max-w-3xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Chỉnh Sửa Câu Hỏi</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nội dung câu hỏi</label>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                rows={3}
                placeholder="Nhập nội dung câu hỏi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Môn học <span className="text-red-500">*</span>
              </label>
              <select
                value={editForm.subjectId}
                onChange={(e) => setEditForm({ ...editForm, subjectId: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                required
              >
                <option value={0}>-- Chọn môn học --</option>
                {subjects.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại câu hỏi</label>
                <select
                  value={editForm.questionType}
                  onChange={(e) => setEditForm({ ...editForm, questionType: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="MultipleChoice">Trắc nghiệm</option>
                  <option value="TrueFalse">Đúng/Sai</option>
                  <option value="ShortAnswer">Tự luận</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Độ khó</label>
                <select
                  value={editForm.difficulty}
                  onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="Easy">Dễ</option>
                  <option value="Medium">Trung bình</option>
                  <option value="Hard">Khó</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Điểm</label>
                <input
                  type="number"
                  value={editForm.marks}
                  onChange={(e) => setEditForm({ ...editForm, marks: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                value={editForm.tags ?? ''}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="ví dụ: Toán, Đại số"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phương án trả lời</label>
                <Button size="sm" onClick={() => setEditForm({
                  ...editForm,
                  answerOptions: [
                    ...(editForm.answerOptions ?? []),
                    { content: "", isCorrect: false, orderIndex: (editForm.answerOptions?.length ?? 0) + 1 }
                  ]
                })}>Thêm phương án</Button>
              </div>
              {(editForm.answerOptions ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có phương án, hãy thêm mới.</p>
              ) : (
                <div className="space-y-2">
                  {(editForm.answerOptions ?? []).map((opt, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <input
                          type="text"
                          value={opt.content}
                          onChange={(e) => {
                            const copy = [...(editForm.answerOptions ?? [])];
                            copy[idx] = { ...copy[idx], content: e.target.value };
                            setEditForm({ ...editForm, answerOptions: copy });
                          }}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                          placeholder={`Phương án ${idx + 1}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={opt.orderIndex ?? idx + 1}
                          min={1}
                          onChange={(e) => {
                            const copy = [...(editForm.answerOptions ?? [])];
                            copy[idx] = { ...copy[idx], orderIndex: parseInt(e.target.value) || idx + 1 };
                            setEditForm({ ...editForm, answerOptions: copy });
                          }}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <label className="text-sm">Đúng</label>
                        <input
                          type="checkbox"
                          checked={!!opt.isCorrect}
                          onChange={(e) => {
                            const copy = [...(editForm.answerOptions ?? [])];
                            copy[idx] = { ...copy[idx], isCorrect: e.target.checked };
                            setEditForm({ ...editForm, answerOptions: copy });
                          }}
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <Button size="sm" variant="outline" onClick={() => {
                          const copy = [...(editForm.answerOptions ?? [])];
                          copy.splice(idx, 1);
                          setEditForm({ ...editForm, answerOptions: copy.map((o, i) => ({ ...o, orderIndex: i + 1 })) });
                        }}>Xóa</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleUpdateQuestion}>Lưu thay đổi</Button>
          </div>
        </div>
      </Modal>
      {/* Modal tạo mới */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Tạo Câu Hỏi Mới</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nội dung câu hỏi <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 mb-2">
                <Button size="sm" variant="outline" onClick={() => {
                  const input = document.getElementById('attach-file-input') as HTMLInputElement | null;
                  input?.click();
                }}>Đính kèm file</Button>
                {attachedFileName && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">{attachedFileName}</span>
                )}
              </div>
              <input id="attach-file-input" type="file" accept=".txt,.pdf,.docx,.xlsx" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setAttachError(null);
                setAiSuggestions([]);
                setAttachedFileName(null);
                const ext = f.name.split('.').pop()?.toLowerCase();
                const allowed = ['txt','pdf','docx','xlsx'];
                if (!ext || !allowed.includes(ext)) {
                  setAttachError('File không đúng định dạng (.txt, .pdf, .docx, .xlsx)');
                  return;
                }
                if (f.size > 5 * 1024 * 1024) {
                  setAttachError('Kích thước file vượt quá 5MB');
                  return;
                }
                setAttachLoading(true);
                try {
                  const res = await materialsService.extractFileAndSuggest({ file: f, subjectId: createForm.subjectId, count: 5 });
                  setAttachedFileName(res.fileName);
                  setAiSuggestions(res.suggestions || []);
                } catch (err: any) {
                  const msg = err?.response?.data?.message || err?.message || 'Không thể đọc nội dung file hoặc tạo câu hỏi tự động. File sẽ chỉ lưu tạm thời không được lưu vĩnh viễn';
                  setAttachError(msg);
                } finally {
                  setAttachLoading(false);
                }
              }} />
              <textarea
                value={createForm.content}
                onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                rows={3}
                placeholder="Nhập nội dung câu hỏi"
                required
              />
              {attachLoading && (
                <div className="mt-2 text-xs text-gray-500">Đang đọc nội dung và tạo gợi ý...</div>
              )}
              {attachError && (
                <div className="mt-2 p-2 text-xs rounded border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 text-red-700 dark:text-red-300">{attachError}</div>
              )}
              {aiSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Gợi ý từ file</div>
                  {aiSuggestions.map((sug, idx) => (
                    <div key={idx} className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="text-sm text-gray-900 dark:text-white">{sug.Question}</div>
                      <ul className="mt-1 text-xs text-gray-700 dark:text-gray-300 list-disc ml-5">
                        {sug.Options.map((opt, i) => (
                          <li key={i}>{opt}{opt.trim().toLowerCase() === (sug.CorrectAnswer ?? '').trim().toLowerCase() ? ' ✓' : ''}</li>
                        ))}
                      </ul>
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => {
                          const options = (sug.Options ?? []).map((o) => ({ content: o, isCorrect: o.trim().toLowerCase() === (sug.CorrectAnswer ?? '').trim().toLowerCase() }));
                          const ensure = options.length >= 2 ? options : [ { content: 'A', isCorrect: true }, { content: 'B', isCorrect: false } ];
                          setCreateForm({
                            ...createForm,
                            content: sug.Question ?? '',
                            questionType: 'MultipleChoice',
                            allowMultipleAnswers: false,
                            answerOptions: ensure,
                          });
                        }}>Áp dụng</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Môn học <span className="text-red-500">*</span>
              </label>
              <select
                value={createForm.subjectId}
                onChange={(e) => setCreateForm({ ...createForm, subjectId: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                required
              >
                <option value={0}>-- Chọn môn học --</option>
                {subjects.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại câu hỏi
                </label>
                <select
                  value={createForm.questionType}
                  onChange={(e) => setCreateForm({ ...createForm, questionType: e.target.value })}
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
                  value={createForm.difficulty}
                  onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="Easy">Dễ</option>
                  <option value="Medium">Trung bình</option>
                  <option value="Hard">Khó</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Điểm
                </label>
                <input
                  type="number"
                  value={createForm.marks}
                  onChange={(e) => setCreateForm({ ...createForm, marks: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  min="1"
                />
              </div>
            </div>

            {/* Checkbox cho phép chọn nhiều đáp án */}
            <div className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <input
                type="checkbox"
                id="allowMultipleAnswers"
                checked={createForm.allowMultipleAnswers || false}
                onChange={(e) => setCreateForm({ ...createForm, allowMultipleAnswers: e.target.checked })}
                className="rounded w-4 h-4"
              />
              <label htmlFor="allowMultipleAnswers" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Cho phép chọn nhiều đáp án
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={createForm.tags ?? ''}
                onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                placeholder="ví dụ: Toán, Đại số"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Đáp án <span className="text-red-500">*</span>
                </label>
                <Button size="sm" variant="outline" onClick={() => setCreateForm({
                  ...createForm,
                  answerOptions: [
                    ...createForm.answerOptions,
                    { content: "", isCorrect: false }
                  ]
                })}>
                  + Thêm đáp án
                </Button>
              </div>
              <div className="space-y-2">
                {createForm.answerOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <input
                      type="checkbox"
                      checked={opt.isCorrect}
                      onChange={(e) => {
                        const copy = [...createForm.answerOptions];
                        copy[idx] = { ...copy[idx], isCorrect: e.target.checked };
                        setCreateForm({ ...createForm, answerOptions: copy });
                      }}
                      className="rounded"
                    />
                    <input
                      type="text"
                      value={opt.content}
                      onChange={(e) => {
                        const copy = [...createForm.answerOptions];
                        copy[idx] = { ...copy[idx], content: e.target.value };
                        setCreateForm({ ...createForm, answerOptions: copy });
                      }}
                      placeholder={`Đáp án ${idx + 1}...`}
                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                    />
                    {createForm.answerOptions.length > 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const copy = createForm.answerOptions.filter((_, i) => i !== idx);
                          setCreateForm({ ...createForm, answerOptions: copy });
                        }}
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
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateQuestion}>
              Lưu
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-sm p-6">
        {selectedQuestion && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Xóa câu hỏi?</h3>
            <p className="text-sm text-gray-600">
              Bạn chắc chắn muốn xóa câu hỏi "{(selectedQuestion.content ?? '').substring(0, 50)}..."? 
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
              <Button className="!bg-red-500 hover:!bg-red-600" onClick={() => handleDeleteQuestion(selectedQuestion.questionId)}>
                Xóa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
