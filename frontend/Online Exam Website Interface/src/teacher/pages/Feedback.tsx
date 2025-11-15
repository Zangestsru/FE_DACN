import { useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { EyeIcon, ChatIcon, CheckCircleIcon, CloseIcon } from "../../admin/icons";
import { Modal } from "../components/ui/modal";

type FeedbackStatus = "pending" | "responded" | "resolved" | "dismissed";
type FeedbackType = "bug" | "feature" | "complaint" | "suggestion" | "other";

type Feedback = {
  id: string;
  userName: string;
  userEmail: string;
  type: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
};

export default function Feedback() {
  const feedbacks = useMemo<Feedback[]>(
    () => [
      {
        id: "fb1",
        userName: "Nguyễn Văn A",
        userEmail: "nguyenvana@email.com",
        type: "bug",
        subject: "Lỗi không thể nộp bài thi",
        message: "Em gặp lỗi khi nộp bài thi Toán học. Sau khi làm xong và bấm nộp bài, hệ thống báo lỗi và không lưu được kết quả. Em đã thử nhiều lần nhưng vẫn không được.",
        status: "pending",
        priority: "high",
        createdAt: "2024-01-20 14:30:00"
      },
      {
        id: "fb2",
        userName: "Trần Thị B",
        userEmail: "tranthib@email.com",
        type: "feature",
        subject: "Đề xuất thêm tính năng ôn tập",
        message: "Em mong muốn hệ thống có thêm tính năng ôn tập với các câu hỏi đã làm sai để có thể học lại. Điều này sẽ giúp em cải thiện kết quả học tập.",
        status: "responded",
        priority: "medium",
        createdAt: "2024-01-19 10:15:00",
        response: "Cảm ơn bạn đã đóng góp ý kiến. Chúng tôi sẽ xem xét và phát triển tính năng này trong phiên bản tiếp theo.",
        respondedAt: "2024-01-19 16:20:00",
        respondedBy: "Admin"
      },
      {
        id: "fb3",
        userName: "Lê Văn C",
        userEmail: "levanc@email.com",
        type: "complaint",
        subject: "Thời gian làm bài quá ngắn",
        message: "Thời gian làm bài thi Văn học chỉ có 90 phút là quá ngắn. Em không thể hoàn thành được bài thi trong thời gian này.",
        status: "resolved",
        priority: "medium",
        createdAt: "2024-01-18 09:45:00",
        response: "Chúng tôi đã xem xét và điều chỉnh thời gian làm bài thi Văn học từ 90 phút lên 120 phút. Cảm ơn bạn đã phản hồi.",
        respondedAt: "2024-01-18 15:30:00",
        respondedBy: "Giáo viên Văn"
      },
      {
        id: "fb4",
        userName: "Phạm Minh D",
        userEmail: "phaminhd@email.com",
        type: "suggestion",
        subject: "Giao diện cần cải thiện",
        message: "Giao diện hiện tại hơi khó sử dụng trên điện thoại. Mong hệ thống có thể cải thiện để dễ sử dụng hơn trên mobile.",
        status: "pending",
        priority: "low",
        createdAt: "2024-01-17 16:20:00"
      },
      {
        id: "fb5",
        userName: "Hoàng Thị E",
        userEmail: "hoangthie@email.com",
        type: "other",
        subject: "Câu hỏi về điểm số",
        message: "Em muốn hỏi về cách tính điểm của hệ thống. Tại sao em làm đúng 8/10 câu nhưng chỉ được 7.5 điểm?",
        status: "dismissed",
        priority: "low",
        createdAt: "2024-01-16 11:10:00"
      }
    ],
    []
  );

  const [feedbackList, setFeedbackList] = useState<Feedback[]>(feedbacks);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [responseText, setResponseText] = useState("");

  // Filters
  const [subjectQuery, setSubjectQuery] = useState("");
  const [statusQuery, setStatusQuery] = useState<"" | FeedbackStatus>("");
  const [typeQuery, setTypeQuery] = useState<"" | FeedbackType>("");
  const [priorityQuery, setPriorityQuery] = useState<"" | "low" | "medium" | "high">("");

  const filteredFeedbacks = useMemo(() => {
    return feedbackList.filter((feedback) => {
      const matchSubject = !subjectQuery || feedback.subject.toLowerCase().includes(subjectQuery.toLowerCase());
      const matchStatus = !statusQuery || feedback.status === statusQuery;
      const matchType = !typeQuery || feedback.type === typeQuery;
      const matchPriority = !priorityQuery || feedback.priority === priorityQuery;
      return matchSubject && matchStatus && matchType && matchPriority;
    });
  }, [feedbackList, subjectQuery, statusQuery, typeQuery, priorityQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = feedbackList.length;
    const pending = feedbackList.filter(f => f.status === "pending").length;
    const responded = feedbackList.filter(f => f.status === "responded").length;
    const resolved = feedbackList.filter(f => f.status === "resolved").length;
    const highPriority = feedbackList.filter(f => f.priority === "high").length;

    return { total, pending, responded, resolved, highPriority };
  }, [feedbackList]);

  const getStatusLabel = (status: FeedbackStatus) => {
    switch (status) {
      case "pending": return "Chờ xử lý";
      case "responded": return "Đã phản hồi";
      case "resolved": return "Đã giải quyết";
      case "dismissed": return "Đã bỏ qua";
      default: return status;
    }
  };

  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case "pending": return "ring-yellow-200 text-yellow-600 dark:ring-yellow-900/40";
      case "responded": return "ring-blue-200 text-blue-600 dark:ring-blue-900/40";
      case "resolved": return "ring-green-200 text-green-600 dark:ring-green-900/40";
      case "dismissed": return "ring-gray-200 text-gray-600 dark:ring-gray-900/40";
      default: return "ring-gray-200 text-gray-600 dark:ring-gray-900/40";
    }
  };

  const getTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case "bug": return "Lỗi";
      case "feature": return "Tính năng";
      case "complaint": return "Khiếu nại";
      case "suggestion": return "Đề xuất";
      case "other": return "Khác";
      default: return type;
    }
  };

  const getPriorityLabel = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "low": return "Thấp";
      case "medium": return "Trung bình";
      case "high": return "Cao";
      default: return priority;
    }
  };

  const getPriorityColor = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "low": return "ring-gray-200 text-gray-600 dark:ring-gray-900/40";
      case "medium": return "ring-yellow-200 text-yellow-600 dark:ring-yellow-900/40";
      case "high": return "ring-red-200 text-red-600 dark:ring-red-900/40";
      default: return "ring-gray-200 text-gray-600 dark:ring-gray-900/40";
    }
  };

  const openView = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsViewOpen(true);
  };

  const openResponse = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.response || "");
    setIsResponseOpen(true);
  };

  const submitResponse = () => {
    if (!selectedFeedback || !responseText.trim()) return;

    setFeedbackList(prev => prev.map(f => 
      f.id === selectedFeedback.id 
        ? {
            ...f,
            status: "responded" as FeedbackStatus,
            response: responseText,
            respondedAt: new Date().toLocaleString(),
            respondedBy: "Admin"
          }
        : f
    ));

    setIsResponseOpen(false);
    setResponseText("");
  };

  const markAsResolved = (feedback: Feedback) => {
    setFeedbackList(prev => prev.map(f => 
      f.id === feedback.id 
        ? { ...f, status: "resolved" as FeedbackStatus }
        : f
    ));
  };

  const markAsDismissed = (feedback: Feedback) => {
    setFeedbackList(prev => prev.map(f => 
      f.id === feedback.id 
        ? { ...f, status: "dismissed" as FeedbackStatus }
        : f
    ));
  };

  return (
    <>
      <PageMeta title="Quản Lý Feedback" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản Lý Feedback</h1>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Tổng feedback</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Chờ xử lý</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{stats.responded}</div>
            <div className="text-sm text-gray-500">Đã phản hồi</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-500">Đã giải quyết</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
            <div className="text-sm text-gray-500">Ưu tiên cao</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            placeholder="Tìm kiếm tiêu đề"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={statusQuery}
            onChange={(e) => setStatusQuery((e.target.value || "") as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="responded">Đã phản hồi</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="dismissed">Đã bỏ qua</option>
          </select>
          <select
            value={typeQuery}
            onChange={(e) => setTypeQuery((e.target.value || "") as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả loại</option>
            <option value="bug">Lỗi</option>
            <option value="feature">Tính năng</option>
            <option value="complaint">Khiếu nại</option>
            <option value="suggestion">Đề xuất</option>
            <option value="other">Khác</option>
          </select>
          <select
            value={priorityQuery}
            onChange={(e) => setPriorityQuery((e.target.value || "") as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả mức độ</option>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người gửi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức độ</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedbacks.map((feedback) => (
                <TableRow key={feedback.id} className="border-t border-gray-100 dark:border-gray-800">
                  <TableCell className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{feedback.userName}</div>
                      <div className="text-sm text-gray-500">{feedback.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{feedback.subject}</div>
                      <div className="text-xs text-gray-500">ID: {feedback.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ring-blue-200 text-blue-600 dark:ring-blue-900/40">
                      {getTypeLabel(feedback.type)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ${getPriorityColor(feedback.priority)}`}>
                      {getPriorityLabel(feedback.priority)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ring-1 ring-inset ${getStatusColor(feedback.status)}`}>
                      {getStatusLabel(feedback.status)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{feedback.createdAt}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" startIcon={<EyeIcon className="h-4 w-4" />} onClick={() => openView(feedback)}>
                        Xem
                      </Button>
                      {feedback.status === "pending" && (
                        <Button size="sm" variant="outline" startIcon={<ChatIcon className="h-4 w-4" />} onClick={() => openResponse(feedback)}>
                          Phản hồi
                        </Button>
                      )}
                      {feedback.status === "responded" && (
                        <Button size="sm" className="bg-green-500! hover:bg-green-600!" startIcon={<CheckCircleIcon className="h-4 w-4" />} onClick={() => markAsResolved(feedback)}>
                          Giải quyết
                        </Button>
                      )}
                      {(feedback.status === "pending" || feedback.status === "responded") && (
                        <Button size="sm" className="bg-gray-500! hover:bg-gray-600!" startIcon={<CloseIcon className="h-4 w-4" />} onClick={() => markAsDismissed(feedback)}>
                          Bỏ qua
                        </Button>
                      )}
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
        {selectedFeedback && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Chi Tiết Feedback</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Người gửi:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedFeedback.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedFeedback.userEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Loại:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{getTypeLabel(selectedFeedback.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mức độ:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{getPriorityLabel(selectedFeedback.priority)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tiêu đề:</label>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedFeedback.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nội dung:</label>
                <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>
              {selectedFeedback.response && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phản hồi:</label>
                  <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedFeedback.response}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Phản hồi bởi {selectedFeedback.respondedBy} vào {selectedFeedback.respondedAt}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{getStatusLabel(selectedFeedback.status)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ngày tạo:</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedFeedback.createdAt}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsViewOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal phản hồi */}
      <Modal isOpen={isResponseOpen} onClose={() => setIsResponseOpen(false)} className="max-w-2xl p-6">
        {selectedFeedback && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Phản Hồi Feedback</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tiêu đề:</label>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedFeedback.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nội dung feedback:</label>
                <p className="mt-1 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phản hồi của bạn:</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Nhập phản hồi của bạn..."
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsResponseOpen(false)}>Hủy</Button>
              <Button onClick={submitResponse} disabled={!responseText.trim()}>Gửi phản hồi</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}


