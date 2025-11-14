import { useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "../icons";
import { Modal } from "../components/ui/modal";

type QuestionType = "multiple_choice" | "true_false" | "essay";
type DifficultyLevel = "easy" | "medium" | "hard";

type Question = {
  id: string;
  content: string;
  type: QuestionType;
  subject: string;
  difficulty: DifficultyLevel;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  createdAt: string;
  createdBy: string;
};

export default function Questions() {
  const questions = useMemo<Question[]>(
    () => [
      {
        id: "q1",
        content: "Thủ đô của Việt Nam là gì?",
        type: "multiple_choice",
        subject: "Địa lý",
        difficulty: "easy",
        options: ["Hà Nội", "TP.HCM", "Đà Nẵng", "Cần Thơ"],
        correctAnswer: 0,
        points: 1,
        createdAt: "2024-01-15",
        createdBy: "Nguyễn Văn A"
      },
      {
        id: "q2",
        content: "Việt Nam có biên giới với Trung Quốc.",
        type: "true_false",
        subject: "Địa lý",
        difficulty: "easy",
        correctAnswer: "true",
        points: 1,
        createdAt: "2024-01-16",
        createdBy: "Trần Thị B"
      },
      {
        id: "q3",
        content: "Phân tích tác động của biến đổi khí hậu đến nông nghiệp Việt Nam.",
        type: "essay",
        subject: "Địa lý",
        difficulty: "hard",
        points: 5,
        createdAt: "2024-01-17",
        createdBy: "Lê Văn C"
      },
      {
        id: "q4",
        content: "Công thức tính diện tích hình tròn là gì?",
        type: "multiple_choice",
        subject: "Toán học",
        difficulty: "medium",
        options: ["πr²", "2πr", "πd", "r²"],
        correctAnswer: 0,
        points: 2,
        createdAt: "2024-01-18",
        createdBy: "Phạm Minh D"
      }
    ],
    []
  );

  const [questionList, setQuestionList] = useState<Question[]>(questions);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Filters
  const [contentQuery, setContentQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [typeQuery, setTypeQuery] = useState<"" | QuestionType>("");
  const [difficultyQuery, setDifficultyQuery] = useState<"" | DifficultyLevel>("");

  const filteredQuestions = useMemo(() => {
    return questionList.filter((q) => {
      const matchContent = !contentQuery || q.content.toLowerCase().includes(contentQuery.toLowerCase());
      const matchSubject = !subjectQuery || q.subject.toLowerCase().includes(subjectQuery.toLowerCase());
      const matchType = !typeQuery || q.type === typeQuery;
      const matchDifficulty = !difficultyQuery || q.difficulty === difficultyQuery;
      return matchContent && matchSubject && matchType && matchDifficulty;
    });
  }, [questionList, contentQuery, subjectQuery, typeQuery, difficultyQuery]);

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "multiple_choice": return "Trắc nghiệm";
      case "true_false": return "Đúng/Sai";
      case "essay": return "Tự luận";
      default: return type;
    }
  };

  const getDifficultyLabel = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "easy": return "Dễ";
      case "medium": return "Trung bình";
      case "hard": return "Khó";
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "easy": return "ring-green-200 text-green-600 dark:ring-green-900/40";
      case "medium": return "ring-yellow-200 text-yellow-600 dark:ring-yellow-900/40";
      case "hard": return "ring-red-200 text-red-600 dark:ring-red-900/40";
      default: return "ring-gray-200 text-gray-600 dark:ring-gray-900/40";
    }
  };

  const openView = (question: Question) => {
    setSelectedQuestion(question);
    setIsViewOpen(true);
  };

  const openCreate = () => {
    setSelectedQuestion(null);
    setIsCreateOpen(true);
  };

  const openEdit = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditOpen(true);
  };

  const openDelete = (question: Question) => {
    setSelectedQuestion(question);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedQuestion) return;
    setQuestionList(prev => prev.filter(q => q.id !== selectedQuestion.id));
    setIsDeleteOpen(false);
  };

  return (
    <>
      <PageMeta title="Quản Lý Câu Hỏi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Câu Hỏi</h1>
          <Button onClick={openCreate} startIcon={<PlusIcon className="h-4 w-4" />}>
            Tạo Câu Hỏi Mới
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{questionList.length}</div>
            <div className="text-sm text-gray-500">Tổng câu hỏi</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">
              {questionList.filter(q => q.type === "multiple_choice").length}
            </div>
            <div className="text-sm text-gray-500">Trắc nghiệm</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600">
              {questionList.filter(q => q.type === "true_false").length}
            </div>
            <div className="text-sm text-gray-500">Đúng/Sai</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600">
              {questionList.filter(q => q.type === "essay").length}
            </div>
            <div className="text-sm text-gray-500">Tự luận</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={contentQuery}
            onChange={(e) => setContentQuery(e.target.value)}
            placeholder="Tìm kiếm nội dung câu hỏi"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            placeholder="Lọc theo môn học"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={typeQuery}
            onChange={(e) => setTypeQuery((e.target.value || "") as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả loại câu hỏi</option>
            <option value="multiple_choice">Trắc nghiệm</option>
            <option value="true_false">Đúng/Sai</option>
            <option value="essay">Tự luận</option>
          </select>
          <select
            value={difficultyQuery}
            onChange={(e) => setDifficultyQuery((e.target.value || "") as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả độ khó</option>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Môn học</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độ khó</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người tạo</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question) => (
                <TableRow key={question.id} className="border-t border-gray-100 dark:border-gray-800">
                  <TableCell className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {question.content}
                      </div>
                      <div className="text-xs text-gray-500">ID: {question.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{question.subject}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-blue-200 text-blue-600 dark:ring-blue-900/40">
                      {getTypeLabel(question.type)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ${getDifficultyColor(question.difficulty)}`}>
                      {getDifficultyLabel(question.difficulty)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{question.points}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{question.createdBy}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" startIcon={<EyeIcon className="h-4 w-4" />} onClick={() => openView(question)}>
                        Xem
                      </Button>
                      <Button size="sm" variant="outline" startIcon={<PencilIcon className="h-4 w-4" />} onClick={() => openEdit(question)}>
                        Sửa
                      </Button>
                      <Button size="sm" className="!bg-red-500 hover:!bg-red-600" startIcon={<TrashBinIcon className="h-4 w-4" />} onClick={() => openDelete(question)}>
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
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Môn học:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedQuestion.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Loại:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{getTypeLabel(selectedQuestion.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Độ khó:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{getDifficultyLabel(selectedQuestion.difficulty)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Điểm:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedQuestion.points}</p>
                </div>
              </div>
              {selectedQuestion.options && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Các lựa chọn:</label>
                  <ul className="mt-1 space-y-1">
                    {selectedQuestion.options.map((option, index) => (
                      <li key={index} className={`p-2 rounded ${selectedQuestion.correctAnswer === index ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        {String.fromCharCode(65 + index)}. {option}
                        {selectedQuestion.correctAnswer === index && " ✓"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedQuestion.type === "true_false" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Đáp án đúng:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedQuestion.correctAnswer === "true" ? "Đúng" : "Sai"}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ngày tạo:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedQuestion.createdAt}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Người tạo:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedQuestion.createdBy}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsViewOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal tạo mới */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-2xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Tạo Câu Hỏi Mới</h3>
          <p className="text-gray-600">Form tạo câu hỏi mới sẽ được implement ở đây.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button onClick={() => setIsCreateOpen(false)}>Tạo</Button>
          </div>
        </div>
      </Modal>

      {/* Modal chỉnh sửa */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} className="max-w-2xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Chỉnh Sửa Câu Hỏi</h3>
          <p className="text-gray-600">Form chỉnh sửa câu hỏi sẽ được implement ở đây.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={() => setIsEditOpen(false)}>Lưu</Button>
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-sm p-6">
        {selectedQuestion && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Xóa câu hỏi?</h3>
            <p className="text-sm text-gray-600">
              Bạn chắc chắn muốn xóa câu hỏi "{selectedQuestion.content.substring(0, 50)}..."? 
              Hành động này không thể hoàn tác.
            </p>
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


