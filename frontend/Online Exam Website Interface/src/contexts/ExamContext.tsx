/**
 * Exam Context
 * Global exam state management
 * Manages current exam, progress, and timer
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { SESSION_KEYS } from '@/constants';
import type { IExam, IQuestion } from '@/types';

// ==================== TYPES ====================

/**
 * Exam session state
 */
export interface IExamSession {
  /** Session ID */
  sessionId: string;
  /** Exam ID */
  examId: string | number;
  /** Start time */
  startTime: string;
  /** Remaining time (seconds) */
  remainingTime: number;
  /** User answers */
  answers: Record<number, number>;
  /** Current question index */
  currentQuestion: number;
}

/**
 * Exam context state
 */
export interface IExamContext {
  /** Current exam */
  currentExam: IExam | null;
  /** Exam questions */
  questions: IQuestion[] | null;
  /** Exam session */
  session: IExamSession | null;
  /** Timer is running */
  isTimerRunning: boolean;
  /** Remaining time (seconds) */
  remainingTime: number;
  /** Start exam */
  startExam: (exam: IExam, questions: IQuestion[], sessionId: string) => void;
  /** End exam */
  endExam: () => void;
  /** Answer question */
  answerQuestion: (questionId: number, answerIndex: number) => void;
  /** Go to question */
  goToQuestion: (index: number) => void;
  /** Pause timer */
  pauseTimer: () => void;
  /** Resume timer */
  resumeTimer: () => void;
  /** Get time spent */
  getTimeSpent: () => number;
}

/**
 * Exam provider props
 */
interface IExamProviderProps {
  children: ReactNode;
}

// ==================== CONTEXT ====================

/**
 * Exam Context
 */
const ExamContext = createContext<IExamContext | undefined>(undefined);

// ==================== PROVIDER ====================

/**
 * Exam Provider Component
 * Wrap exam-related components với provider này
 * 
 * @example
 * ```tsx
 * <ExamProvider>
 *   <ExamTaking />
 * </ExamProvider>
 * ```
 */
export const ExamProvider: React.FC<IExamProviderProps> = ({ children }) => {
  // States
  const [currentExam, setCurrentExam] = useState<IExam | null>(null);
  const [questions, setQuestions] = useState<IQuestion[] | null>(null);
  const [session, setSession] = useState<IExamSession | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load exam session từ sessionStorage khi mount
   */
  useEffect(() => {
    const loadSession = () => {
      try {
        const storedSession = sessionStorage.getItem(SESSION_KEYS.EXAM_SESSION);
        
        if (storedSession) {
          const parsedSession: IExamSession = JSON.parse(storedSession);
          setSession(parsedSession);
          setRemainingTime(parsedSession.remainingTime);
          
          // Note: currentExam và questions không được persist
          // Cần fetch lại từ API nếu cần
        }
      } catch (error) {
        console.error('Error loading exam session:', error);
        sessionStorage.removeItem(SESSION_KEYS.EXAM_SESSION);
      }
    };

    loadSession();
  }, []);

  /**
   * Persist session to sessionStorage khi thay đổi
   */
  useEffect(() => {
    if (session) {
      try {
        const sessionToSave: IExamSession = {
          ...session,
          remainingTime,
        };
        sessionStorage.setItem(SESSION_KEYS.EXAM_SESSION, JSON.stringify(sessionToSave));
      } catch (error) {
        console.error('Error saving exam session:', error);
      }
    }
  }, [session, remainingTime]);

  /**
   * Timer effect
   */
  useEffect(() => {
    if (isTimerRunning && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            // Time's up!
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, remainingTime]);

  /**
   * Start exam
   */
  const startExam = useCallback(
    (exam: IExam, examQuestions: IQuestion[], sessionId: string): void => {
      // Parse duration (e.g., "90 phút" -> 90 * 60 seconds)
      const durationMatch = exam.duration?.match(/(\d+)/);
      const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
      const durationSeconds = durationMinutes * 60;

      const newSession: IExamSession = {
        sessionId,
        examId: exam.id,
        startTime: new Date().toISOString(),
        remainingTime: durationSeconds,
        answers: {},
        currentQuestion: 0,
      };

      setCurrentExam(exam);
      setQuestions(examQuestions);
      setSession(newSession);
      setRemainingTime(durationSeconds);
      setIsTimerRunning(true);
    },
    []
  );

  /**
   * End exam
   */
  const endExam = useCallback((): void => {
    setCurrentExam(null);
    setQuestions(null);
    setSession(null);
    setRemainingTime(0);
    setIsTimerRunning(false);
    
    // Clear session storage
    sessionStorage.removeItem(SESSION_KEYS.EXAM_SESSION);
  }, []);

  /**
   * Answer question
   */
  const answerQuestion = useCallback((questionId: number, answerIndex: number): void => {
    setSession((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: answerIndex,
        },
      };
    });
  }, []);

  /**
   * Go to question
   */
  const goToQuestion = useCallback((index: number): void => {
    setSession((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        currentQuestion: index,
      };
    });
  }, []);

  /**
   * Pause timer
   */
  const pauseTimer = useCallback((): void => {
    setIsTimerRunning(false);
  }, []);

  /**
   * Resume timer
   */
  const resumeTimer = useCallback((): void => {
    if (remainingTime > 0) {
      setIsTimerRunning(true);
    }
  }, [remainingTime]);

  /**
   * Get time spent (in seconds)
   */
  const getTimeSpent = useCallback((): number => {
    if (!session || !currentExam) return 0;

    // Parse duration
    const durationMatch = currentExam.duration?.match(/(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
    const totalSeconds = durationMinutes * 60;

    return totalSeconds - remainingTime;
  }, [session, currentExam, remainingTime]);

  // Context value
  const value: IExamContext = {
    currentExam,
    questions,
    session,
    isTimerRunning,
    remainingTime,
    startExam,
    endExam,
    answerQuestion,
    goToQuestion,
    pauseTimer,
    resumeTimer,
    getTimeSpent,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

// ==================== HOOK ====================

/**
 * Custom hook để sử dụng Exam Context
 * 
 * @example
 * ```tsx
 * const { currentExam, remainingTime, answerQuestion } = useExamContext();
 * 
 * return (
 *   <div>
 *     <h1>{currentExam?.title}</h1>
 *     <Timer time={remainingTime} />
 *     <button onClick={() => answerQuestion(1, 0)}>Answer A</button>
 *   </div>
 * );
 * ```
 * 
 * @throws Error nếu sử dụng ngoài ExamProvider
 */
export const useExamContext = (): IExamContext => {
  const context = useContext(ExamContext);
  
  if (context === undefined) {
    throw new Error('useExamContext must be used within ExamProvider');
  }
  
  return context;
};

// ==================== EXPORT ====================

export default ExamContext;

