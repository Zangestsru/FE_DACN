import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import FlyonDataTableWrapper from "../../teacher/components/ui/table/FlyonDataTableWrapper";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { questionsService, type QuestionBankResponse, type CreateQuestionBankRequest, type UpdateQuestionBankRequest } from "../services/questions.service";

export default function Questions() {
  const [questions, setQuestions] = useState<QuestionBankResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankResponse | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateQuestionBankRequest>({
    content: "",
    questionType: "MultipleChoice",
    difficulty: "Easy",
    marks: 1,
    tags: "",
    answerOptions: [
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ],
  });

  const [editForm, setEditForm] = useState<UpdateQuestionBankRequest>({
    content: "",
    questionType: "MultipleChoice",
    difficulty: "Easy",
    marks: 1,
    tags: "",
    answerOptions: [],
  });

  // Filters
  const [contentQuery, setContentQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [difficultyQuery, setDifficultyQuery] = useState<string>("");

  // Load questions from API
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await questionsService.getQuestions();
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu câu hỏi');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      await questionsService.createQuestion(createForm);
      await loadQuestions();
      setIsCreateOpen(false);
      // Reset form
      setCreateForm({
        content: "",
        questionType: "MultipleChoice",
        difficulty: "Easy",
        marks: 1,
        tags: "",
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
      await loadQuestions();
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
      await questionsService.updateQuestion(selectedQuestion.questionId, editForm);
      await loadQuestions();
      setIsEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật câu hỏi');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchContent = !contentQuery || (q.content ?? '').toLowerCase().includes(contentQuery.toLowerCase());
    const matchCategory = !categoryQuery || (q.tags ?? '').toLowerCase().includes(categoryQuery.toLowerCase());
    const matchDifficulty = !difficultyQuery || (q.difficulty ?? '').toLowerCase() === difficultyQuery.toLowerCase();
    return matchContent && matchCategory && matchDifficulty;
  });

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
      tags: question.tags ?? "",
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
      <PageMeta title="Quản Lý Câu Hỏi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Câu Hỏi</h1>
          <Button onClick={() => setIsCreateOpen(true)}>
            Tạo Câu Hỏi Mới
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
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
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={contentQuery}
            onChange={(e) => setContentQuery(e.target.value)}
            placeholder="Tìm kiếm nội dung câu hỏi"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={categoryQuery}
            onChange={(e) => setCategoryQuery(e.target.value)}
            placeholder="Lọc theo danh mục"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={difficultyQuery}
            onChange={(e) => setDifficultyQuery((e.target.value || ""))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả độ khó</option>
            <option value="Easy">Dễ</option>
            <option value="Medium">Trung bình</option>
            <option value="Hard">Khó</option>
          </select>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadQuestions} className="mt-2">
              Thử lại
            </Button>
          </div>
        )}

        <FlyonDataTableWrapper pageLength={10} selecting selectAllSelector="#adm-q-checkbox-all">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="w-4 pr-0 --exclude-from-ordering">
                  <div className="flex h-5">
                    <input id="adm-q-checkbox-all" type="checkbox" className="checkbox checkbox-sm" />
                    <label htmlFor="adm-q-checkbox-all" className="sr-only">Checkbox</label>
                  </div>
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Câu hỏi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độ khó</TableCell>
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
                  <TableRow key={question.questionId} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    <TableCell className="w-4 pr-0">
                      <div className="flex h-5 items-center">
                        <input id={`adm-q-row-${question.questionId}`} type="checkbox" className="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                        <label htmlFor={`adm-q-row-${question.questionId}`} className="sr-only">Checkbox</label>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {question.content}
                        </div>
                        <div className="text-xs text-gray-500">ID: {question.questionId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{question.tags ?? ''}</TableCell>
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
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn btn-circle btn-text" aria-label="Xem" onClick={() => openView(question)}>
                          <span className="icon-[tabler--eye] size-5"></span>
                        </button>
                        <button className="btn btn-circle btn-text" aria-label="Sửa" onClick={() => openEdit(question)}>
                          <span className="icon-[tabler--pencil] size-5"></span>
                        </button>
                        <button className="btn btn-circle btn-text" aria-label="Xóa" onClick={() => openDelete(question)}>
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
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedQuestion.tags ?? ''}</p>
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
                    {selectedQuestion.answerOptions.map((option, index) => (
                      <li key={index} className={`p-2 rounded ${option.isCorrect ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        {String.fromCharCode(65 + index)}. {option.content}
                        {option.isCorrect && " ✓"}
                      </li>
                    ))}
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
                        <Button size="sm" variant="danger" onClick={() => {
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
      {/* Modal tạo mới - Simplified */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-2xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Tạo Câu Hỏi Mới</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nội dung câu hỏi
              </label>
              <textarea
                value={createForm.content}
                onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                rows={3}
                placeholder="Nhập nội dung câu hỏi"
              />
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
                  onChange={(e) => setCreateForm({ ...createForm, marks: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                  min="1"
                />
              </div>
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
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateQuestion}>
              Tạo Câu Hỏi
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