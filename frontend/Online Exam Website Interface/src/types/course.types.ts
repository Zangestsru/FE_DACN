/**
 * Course & Study Material Types
 * Chứa tất cả các types liên quan đến khóa học và tài liệu học tập
 */

// ==================== COURSE TYPES ====================

/**
 * Interface cho thông tin khóa học
 */
export interface ICourse {
  id: number | string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  
  // Thông tin danh mục
  category: string;
  
  // Thông tin bài học
  lessons: number;
  duration: string;
  level: string;
  
  // Thông tin giá cả
  price: number;
  originalPrice?: number;
  
  // Thông tin đánh giá
  rating: number;
  students: number;
  
  // Thông tin giảng viên
  instructor: string;
  instructorInfo?: IInstructor;
  
  // Tính năng khóa học
  features: string[];
  
  // Thông tin bổ sung
  requirements?: string[];
  benefits?: string[];
  syllabus?: ICourseSyllabus[];
}

/**
 * Interface cho tài liệu học tập
 */
export interface IStudyMaterial extends ICourse {
  // Kế thừa tất cả từ ICourse
}

/**
 * Interface cho giảng viên
 */
export interface IInstructor {
  name: string;
  title: string;
  experience: string;
  students: string;
  courses: string;
  rating: string;
  bio: string;
  image: string;
  email?: string;
  specialties?: string[];
}

/**
 * Interface cho chương trình học
 */
export interface ICourseSyllabus {
  module: string;
  lessons: ILesson[];
  description?: string;
}

/**
 * Interface cho bài học
 */
export interface ILesson {
  id?: number;
  title: string;
  duration: string;
  type: 'video' | 'document' | 'quiz' | 'assignment';
  completed: boolean;
  
  // Thông tin video
  videoUrl?: string;
  transcript?: string;
  
  // Thông tin tài liệu
  content?: string;
  
  // Tài liệu đính kèm
  materials?: ILessonMaterial[];
  
  // Thông tin bổ sung
  description?: string;
  order?: number;
}

/**
 * Interface cho tài liệu bài học
 */
export interface ILessonMaterial {
  name: string;
  type: 'pdf' | 'zip' | 'doc' | 'txt' | 'ppt' | 'video';
  size: string;
  url?: string;
}

/**
 * Interface cho đánh giá khóa học
 */
export interface ICourseReview {
  id?: string | number;
  name: string;
  rating: number;
  date: string;
  comment: string;
  avatar: string;
  helpful?: number;
}

/**
 * Interface cho tiến độ học tập
 */
export interface ICourseProgress {
  courseId: string | number;
  currentLesson: number;
  completedLessons: number[];
  totalLessons: number;
  progressPercentage: number;
  lastAccessedAt?: Date | string;
}

/**
 * Interface cho ghi chú bài học
 */
export interface ILessonNote {
  id?: string | number;
  lessonId: string | number;
  content: string;
  timestamp?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Interface cho danh mục khóa học
 */
export interface ICourseCategory {
  id: string;
  name: string;
  count: number;
  icon?: string;
  description?: string;
}

// ==================== PROPS TYPES ====================

/**
 * Props cho component StudyMaterials
 */
export interface IStudyMaterialsProps {
  onCourseSelect: (course: ICourse) => void;
}

/**
 * Props cho component StudyDetail
 */
export interface IStudyDetailProps {
  course: ICourse | any;
  onBackToList: () => void;
  onRegister: () => void;
  onStartLearning: () => void;
}

/**
 * Props cho component StudyLesson
 */
export interface IStudyLessonProps {
  course: ICourse | any;
  onBackToCourse: () => void;
}

// ==================== STATE TYPES ====================

/**
 * Type cho tab trong StudyDetail
 */
export type TStudyDetailTab = 'overview' | 'curriculum' | 'instructor' | 'reviews';

/**
 * Type cho tab trong StudyLesson
 */
export type TStudyLessonTab = 'video' | 'playlist' | 'notes' | 'materials';

/**
 * Type cho lesson type
 */
export type TLessonType = 'video' | 'document' | 'quiz' | 'assignment';

/**
 * Type cho course level
 */
export type TCourseLevel = 'Cơ bản' | 'Trung cấp' | 'Nâng cao' | 'Tất cả cấp độ' | 'Cơ bản đến nâng cao';

