/**
 * Exam Types
 * Chứa tất cả các types liên quan đến bài thi và chứng chỉ
 */

// ==================== EXAM TYPES ====================

/**
 * Interface cho thông tin cơ bản của một bài thi
 */
export interface IExam {
  id: number | string;
  title: string;
  subject?: string;
  category: string;
  description: string;
  image: string;
  
  // Thông tin thời gian và câu hỏi
  date?: string;
  time?: string;
  duration: string;
  questions: number;
  
  // Thông tin điểm số và độ khó
  passingScore: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Cơ bản' | 'Trung bình' | 'Nâng cao' | 'Dễ' | 'Khó';
  level?: string;
  
  // Thông tin giá cả
  price: number;
  originalPrice?: number;
  
  // Thông tin đánh giá
  rating: number;
  students: number;
  
  // Thông tin bổ sung
  provider?: string;
  features?: string[];
  validPeriod?: string;
}

/**
 * Interface cho bài thi chứng chỉ quốc tế
 */
export interface ICertificationExam extends IExam {
  provider: string;
  level: string;
  validPeriod: string;
  features: string[];
}

/**
 * Interface cho câu hỏi trong bài thi
 */
export interface IQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  type?: 'multiple-choice' | 'true-false' | 'essay';
}

/**
 * Interface cho cấu trúc phần thi
 */
export interface IExamSection {
  name: string;
  questions: number;
  time: string;
}

/**
 * Interface cho kết quả bài thi
 */
export interface IExamResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  answers: { [key: number]: number };
  timeSpent: number;
}

/**
 * Interface cho trạng thái làm bài thi
 */
export interface IExamProgress {
  currentQuestion: number;
  answers: { [key: number]: number };
  timeRemaining: number;
  flaggedQuestions: Set<number>;
}

/**
 * Interface cho báo cáo sự cố
 */
export interface IExamReport {
  description: string;
  attachments: FileList | null;
  timestamp?: Date;
  examId?: string | number;
}

// ==================== EXAM CARD TYPES ====================

/**
 * Interface cho thẻ hiển thị bài thi
 */
export interface IExamCard {
  title: string;
  subject: string;
  time: number;
  questionCount: number;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  image: string;
}

// ==================== PROPS TYPES ====================

/**
 * Props cho component ExamDetail
 */
export interface IExamDetailProps {
  exam: IExam | any;
  onBackToList: () => void;
  onRegister: () => void;
}

/**
 * Props cho component ExamList
 */
export interface IExamListProps {
  exams?: IExam[];
  onExamSelect?: (exam: IExam) => void;
}

/**
 * Props cho component ExamResult
 */
export interface IExamResultProps {
  exam: IExam | any;
  result: IExamResult | any;
  onBackToHome: () => void;
}

/**
 * Props cho component ExamTaking
 */
export interface IExamTakingProps {
  exam: IExam | any;
  onSubmitExam: (result: IExamResult) => void;
}

/**
 * Props cho component PreExam
 */
export interface IPreExamProps {
  exam: IExam | any;
  onStartExam: () => void;
}

/**
 * Props cho component CertificationExams
 */
export interface ICertificationExamsProps {
  onExamSelect: (exam: ICertificationExam) => void;
}

/**
 * Props cho component ExamCard
 */
export interface IExamCardProps {
  title: string;
  subject: string;
  time: number;
  questionCount: number;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  image: string;
}

