import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { IExam, IQuestion, IExamResult } from '@/types';
import { useExamContext } from '@/contexts';
import { useExamAttempt, useSubmitExam, useSaveAnswer, useSaveProgress, useRestoreProgress } from '@/hooks';
import { examService } from '@/services/exam.service';
import { toast } from 'sonner';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number | number[];
  type?: 'multiple-choice' | 'multiple-select';
  image?: string;
}

interface ExamTakingProps {
  onSubmitExam: (result: any) => void;
}

export const ExamTaking: React.FC<ExamTakingProps> = ({ onSubmitExam }) => {
  const { attemptId } = useParams<{ slug: string; attemptId: string }>();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number | number[] }>({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMobileQuestionGrid, setShowMobileQuestionGrid] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [reportData, setReportData] = useState({
    description: '',
    attachments: null as FileList | null
  });
  const [isZoomed, setIsZoomed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const hasAutoSubmittedRef = useRef(false); // Prevent multiple auto-submissions

  // ✅ Track actual time spent (from when component mounts / user starts taking exam)
  const [actualTimeSpent, setActualTimeSpent] = useState(0); // in seconds
  const examStartTimeRef = useRef<number | null>(null);

  // Fetch exam attempt data (includes questions)
  const { data: attemptData, loading: attemptLoading, error: attemptError } = useExamAttempt(attemptId as string);

  // ✅ Start tracking time when exam data is loaded
  useEffect(() => {
    if (attemptData && !examStartTimeRef.current) {
      examStartTimeRef.current = Date.now();
      console.log('⏱️ Started tracking exam time:', new Date(examStartTimeRef.current).toISOString());
    }
  }, [attemptData]);

  // ✅ Update actual time spent every second
  useEffect(() => {
    if (!examStartTimeRef.current) return;

    const interval = setInterval(() => {
      if (examStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - examStartTimeRef.current) / 1000);
        setActualTimeSpent(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('🔍 ExamTaking - attemptId:', attemptId);
    console.log('🔍 ExamTaking - attemptData:', attemptData);
    console.log('🔍 ExamTaking - attemptData.questions:', attemptData?.questions);
    console.log('🔍 ExamTaking - attemptData.questions.length:', attemptData?.questions?.length);
    console.log('🔍 ExamTaking - attemptLoading:', attemptLoading);
    console.log('🔍 ExamTaking - attemptError:', attemptError);
  }, [attemptId, attemptData, attemptLoading, attemptError]);

  // Submit exam mutation
  const { mutate: submitExamMutation } = useSubmitExam();

  // Save answer mutation (auto-save)
  const { mutate: saveAnswer } = useSaveAnswer();

  // Save progress mutation (manual save)
  const { mutate: saveProgressMutation } = useSaveProgress();
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  // Calculate time remaining from attempt data
  const [timeRemaining, setTimeRemaining] = useState(3600); // Default 60 minutes

  useEffect(() => {
    if (attemptData) {
      let endTime: number;
      const now = Date.now();

      if (attemptData.endTime) {
        // Use endTime from API if available
        endTime = new Date(attemptData.endTime).getTime();
        console.log('⏰ Using endTime from API:', attemptData.endTime);
      } else if (attemptData.startTime && attemptData.durationMinutes && attemptData.durationMinutes > 0) {
        // Calculate endTime from startTime + durationMinutes
        const startTime = new Date(attemptData.startTime).getTime();
        endTime = startTime + (attemptData.durationMinutes * 60 * 1000);
        console.log('⏰ Calculated endTime from startTime + duration');
      } else {
        // Fallback: 60 minutes from now if no duration specified
        const defaultMinutes = 60;
        endTime = now + (defaultMinutes * 60 * 1000);
        console.log('⏰ Using fallback: 60 minutes from now');
      }

      const remaining = Math.floor((endTime - now) / 1000);

      console.log('⏰ Time calculation:');
      console.log('  - Now:', new Date(now).toLocaleString());
      console.log('  - End time:', new Date(endTime).toLocaleString());
      console.log('  - Remaining seconds:', remaining);
      console.log('  - Remaining minutes:', Math.floor(remaining / 60));

      // Check if time is valid
      if (remaining <= 0) {
        console.warn('⚠️ Time already expired! Setting to default duration');
        // Use duration from backend or default to 60 minutes
        const defaultTime = (attemptData.durationMinutes || 60) * 60;
        setTimeRemaining(defaultTime);
      } else {
        setTimeRemaining(remaining);
      }
    }
  }, [attemptData]);

  // Map backend questions to frontend format
  const questions: Question[] = React.useMemo(() => {
    if (!attemptData?.questions || attemptData.questions.length === 0) {
      console.log('⚠️ No questions in attemptData');
      return [];
    }

    console.log('📋 Mapping questions, count:', attemptData.questions.length);

    const mapped = attemptData.questions.map((q: any, index: number) => {
      console.log(`Question ${index + 1}:`, q);

      // Handle different question structures from backend
      const options = q.options || q.answerOptions || [];
      const questionText = q.content || q.questionText || q.text || '';
      const questionType = q.questionType || q.type || 'SingleChoice';

      console.log(`  - options count:`, options.length);
      console.log(`  - questionText:`, questionText);

      return {
        id: q.questionId || q.id,
        question: questionText,
        options: options.map((opt: any) => opt.content || opt.text || opt.optionText || ''),
        type: questionType === 'MultipleChoice' || questionType === 'MultipleSelect' ? 'multiple-select' : 'multiple-choice',
        image: q.imageUrl || q.image || null,
      };
    });

    console.log('✅ Mapped questions result:', mapped);
    console.log('✅ Mapped questions length:', mapped.length);

    return mapped;
  }, [attemptData]);

  const exam = React.useMemo(() => {
    const result = {
      id: attemptData?.examId,
      title: attemptData?.examTitle || 'Bài thi',
      questions: questions.length,
      duration: attemptData?.durationMinutes ? `${attemptData.durationMinutes} phút` : '60 phút',
    };
    console.log('📊 Exam object:', result);
    return result;
  }, [attemptData, questions]);

  // Handle viewport changes for better iPad/tablet support
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const isZoomedView = window.visualViewport.scale > 1;
        setIsZoomed(isZoomedView);
        document.body.classList.toggle('zoomed-view', isZoomedView);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fallback mock questions if no data
  const mockQuestions: Question[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    question: `Câu hỏi ${i + 1}: Đây là nội dung câu hỏi số ${i + 1} trong bài thi ${exam?.title}. Hãy chọn đáp án đúng nhất từ các phương án dưới đây?`,
    options: [
      `Đáp án A cho câu ${i + 1}`,
      `Đáp án B cho câu ${i + 1}`,
      `Đáp án C cho câu ${i + 1}`,
      `Đáp án D cho câu ${i + 1}`
    ],
    correctAnswer: Math.floor(Math.random() * 4),
    type: 'multiple-choice'
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Only auto-submit if we have valid data
          if (attemptData && attemptId) {
            console.log('⏰ Timer expired - auto submitting');
            handleSubmit();
          } else {
            console.warn('⚠️ Timer expired but missing data - not submitting');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptData, attemptId]); // Add dependencies

  // ✅ Auto-submit when user leaves page (tab switch, F5, close browser)
  useEffect(() => {
    if (!attemptId || !attemptData || questions.length === 0) {
      return;
    }

    const examId = attemptData.examId || attemptData.exam?.id || 1;
    const attemptIdNum = parseInt(attemptId as string);

    // Handle beforeunload (F5, close tab, close browser)
    // Note: beforeunload cannot be async, so we use current answers and send synchronously
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAutoSubmittedRef.current || submitting || isAutoSubmitting) {
        return;
      }

      console.log('🔄 beforeunload detected - auto-submitting with current answers...');
      
      hasAutoSubmittedRef.current = true;
      setIsAutoSubmitting(true);

      try {
        // Use current answers (can't await Redis restore in beforeunload)
        // Convert to submission format
        const submittedAnswers = questions.map((q, index) => {
          const userAnswer = answers[index];
          const questionId = q.id;
          const backendQuestion = attemptData.questions.find((bq: any) =>
            (bq.questionId || bq.id) === questionId
          );
          let selectedOptionIds: number[] = [];
          if (backendQuestion) {
            const options = backendQuestion.options || backendQuestion.answerOptions || [];
            if (Array.isArray(userAnswer)) {
              selectedOptionIds = userAnswer
                .map(idx => {
                  const option = options[idx];
                  return option?.optionId || option?.OptionId || option?.id;
                })
                .filter(id => id != null);
            } else if (typeof userAnswer === 'number') {
              const option = options[userAnswer];
              const optionId = option?.optionId || option?.OptionId || option?.id;
              if (optionId) selectedOptionIds = [optionId];
            }
          }
          return { questionId, selectedOptionIds, textAnswer: null };
        });

        const timeSpentSeconds = examStartTimeRef.current
          ? Math.floor((Date.now() - examStartTimeRef.current) / 1000)
          : actualTimeSpent;

        // Format request body to match backend API: { examAttemptId, answers, timeSpentSeconds }
        const requestBody = {
          examAttemptId: attemptIdNum,
          answers: submittedAnswers,
          timeSpentSeconds: timeSpentSeconds,
        };

        // Get auth token for fetch request
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Use fetch with keepalive for reliable submission during page unload
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
        const apiUrl = `${apiBaseUrl}/api/Exams/${examId}/submit`;
        
        fetch(apiUrl, {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers,
          keepalive: true, // Critical: ensures request completes even if page unloads
        }).catch(err => {
          console.error('❌ Fetch auto-submit failed:', err);
        });
        
        console.log('✅ Sent auto-submit via fetch with keepalive');
      } catch (error) {
        console.error('❌ Error in beforeunload auto-submit:', error);
      }

      // Show confirmation dialog
      e.preventDefault();
      e.returnValue = 'Bạn có chắc muốn rời khỏi trang? Bài thi sẽ được tự động nộp.';
      return e.returnValue;
    };

    // Handle visibility change (tab switch, minimize window)
    const handleVisibilityChange = () => {
      if (document.hidden && !hasAutoSubmittedRef.current && !submitting && !isAutoSubmitting) {
        console.log('🔄 Tab hidden detected - auto-submitting...');
        autoSubmit(true).catch(err => {
          console.error('❌ Error in visibilitychange auto-submit:', err);
        });
      }
    };

    // Handle page unload (navigation away)
    const handleUnload = () => {
      if (!hasAutoSubmittedRef.current && !submitting && !isAutoSubmitting) {
        console.log('🔄 page unload detected - auto-submitting...');
        autoSubmit(true).catch(err => {
          console.error('❌ Error in unload auto-submit:', err);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('unload', handleUnload);
    };
  }, [attemptId, attemptData, questions.length, submitting, isAutoSubmitting, submitExamMutation]);

  // Detect visual viewport changes (zoom / UI bars) and toggle class to avoid fixed nav blocking content
  useEffect(() => {
    const rootEl = document.querySelector('.exam-taking-root');
    if (!rootEl) return;

    const onViewportChange = () => {
      try {
        const vv = (window as any).visualViewport;
        let small = false;
        if (vv) {
          // If scale > 1 (zoom) or visual viewport height is much smaller than layout height
          small = (vv.scale && vv.scale > 1) || (vv.height && vv.height < 700);
        } else {
          // Fallback: if innerHeight is small (mobile UI) compared to outerHeight
          small = !!(window.innerHeight && window.innerHeight < 700);
        }

        if (small) rootEl.classList.add('vp-small'); else rootEl.classList.remove('vp-small');
      } catch (e) {
        // ignore
      }
    };

    // initial check
    onViewportChange();

    if ((window as any).visualViewport) {
      (window as any).visualViewport.addEventListener('resize', onViewportChange);
      (window as any).visualViewport.addEventListener('scroll', onViewportChange);
    } else {
      window.addEventListener('resize', onViewportChange);
    }

    return () => {
      if ((window as any).visualViewport) {
        (window as any).visualViewport.removeEventListener('resize', onViewportChange);
        (window as any).visualViewport.removeEventListener('scroll', onViewportChange);
      } else {
        window.removeEventListener('resize', onViewportChange);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestionData = questions[currentQuestion];

    if (currentQuestionData?.type === 'multiple-select') {
      // Handle multiple selection
      setAnswers(prev => {
        const currentAnswers = prev[currentQuestion] as number[] || [];
        const newAnswers = currentAnswers.includes(answerIndex)
          ? currentAnswers.filter(idx => idx !== answerIndex)
          : [...currentAnswers, answerIndex];

        return {
          ...prev,
          [currentQuestion]: newAnswers
        };
      });
    } else {
      // Handle single selection
      setAnswers(prev => ({
        ...prev,
        [currentQuestion]: answerIndex
      }));
    }
  };

  const handleQuestionNavigation = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
  };

  const toggleQuestionFlag = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  // ✅ Auto-submit function - gets answers from Redis or current state
  const autoSubmit = async (useSavedProgress = true) => {
    // Prevent multiple auto-submissions
    if (hasAutoSubmittedRef.current || submitting || isAutoSubmitting) {
      console.log('⚠️ Auto-submit already in progress or completed, skipping...');
      return;
    }

    if (!attemptId || !attemptData || !attemptData.examId || questions.length === 0) {
      console.warn('⚠️ Missing data for auto-submit, skipping...');
      return;
    }

    console.log('🔄 Auto-submit triggered (useSavedProgress:', useSavedProgress, ')');
    setIsAutoSubmitting(true);
    hasAutoSubmittedRef.current = true;

    try {
      const examId = attemptData.examId || attemptData.exam?.id || 1;
      const attemptIdNum = parseInt(attemptId as string);

      let answersToSubmit = answers; // Default: use current state

      // Try to get saved progress from Redis if requested
      if (useSavedProgress) {
        try {
          console.log('📥 Attempting to restore progress from Redis...');
          const savedProgress = await examService.restoreProgress(examId, attemptIdNum);
          console.log('📥 Saved progress from Redis:', savedProgress);

          if (savedProgress && savedProgress.data && Array.isArray(savedProgress.data.Answers)) {
            const savedAnswers = savedProgress.data.Answers;
            console.log('✅ Found', savedAnswers.length, 'saved answers in Redis');

            // Convert saved answers to state format
            const restoredAnswers: { [key: number]: number | number[] } = {};
            
            questions.forEach((q, index) => {
              const savedAnswer = savedAnswers.find((sa: any) => 
                sa.QuestionId === q.id || sa.questionId === q.id
              );

              if (savedAnswer) {
                const backendQuestion = attemptData.questions.find((bq: any) =>
                  (bq.questionId || bq.id) === q.id
                );

                if (backendQuestion) {
                  const options = backendQuestion.options || backendQuestion.answerOptions || [];
                  const selectedOptionIds = savedAnswer.SelectedOptionIds || savedAnswer.selectedOptionIds || [];

                  // Map optionIds back to indices
                  if (selectedOptionIds.length > 0) {
                    const indices = selectedOptionIds
                      .map((optionId: number) => {
                        const optionIndex = options.findIndex((opt: any) =>
                          (opt.optionId || opt.OptionId || opt.id) === optionId
                        );
                        return optionIndex >= 0 ? optionIndex : null;
                      })
                      .filter((idx: number | null) => idx !== null) as number[];

                    if (indices.length > 0) {
                      restoredAnswers[index] = indices.length === 1 ? indices[0] : indices;
                    }
                  }
                }
              }
            });

            // Merge: saved answers take priority, but keep current answers if no saved answer exists
            answersToSubmit = { ...answersToSubmit, ...restoredAnswers };
            console.log('✅ Merged answers (saved + current):', answersToSubmit);
          } else {
            console.log('ℹ️ No saved progress found, using current answers');
          }
        } catch (error) {
          console.warn('⚠️ Failed to restore progress, using current answers:', error);
        }
      }

      // Use the merged answers for submission
      const submittedAnswers = questions.map((q, index) => {
        const userAnswer = answersToSubmit[index];
        const questionId = q.id;

        const backendQuestion = attemptData.questions.find((bq: any) =>
          (bq.questionId || bq.id) === questionId
        );

        let selectedOptionIds: number[] = [];

        if (backendQuestion) {
          const options = backendQuestion.options || backendQuestion.answerOptions || [];

          if (Array.isArray(userAnswer)) {
            selectedOptionIds = userAnswer
              .map(idx => {
                const option = options[idx];
                return option?.optionId || option?.OptionId || option?.id;
              })
              .filter(id => id != null);
          } else if (typeof userAnswer === 'number') {
            const option = options[userAnswer];
            const optionId = option?.optionId || option?.OptionId || option?.id;
            if (optionId) {
              selectedOptionIds = [optionId];
            }
          }
        }

        return {
          questionId,
          selectedOptionIds,
          textAnswer: null,
        };
      });

      // Calculate time spent
      const timeSpentSeconds = examStartTimeRef.current
        ? Math.floor((Date.now() - examStartTimeRef.current) / 1000)
        : actualTimeSpent;

      console.log('📤 Auto-submitting with', submittedAnswers.length, 'answers');
      const result = await submitExamMutation({
        examId,
        attemptId: attemptIdNum,
        answers: submittedAnswers,
        timeSpent: timeSpentSeconds,
      });

      if (result) {
        const resultKey = `exam_result_${attemptIdNum}`;
        sessionStorage.setItem(resultKey, JSON.stringify({
          ...result,
          examAttemptId: attemptIdNum,
          attemptId: attemptIdNum,
          examId: examId,
          timestamp: Date.now()
        }));

        console.log('✅ Auto-submit successful');
        // Note: Don't call onSubmitExam here as user is leaving the page
        // The result is stored in sessionStorage for later retrieval
      }
    } catch (error: any) {
      console.error('❌ Error in auto-submit:', error);
      // Don't show toast as user is leaving
    } finally {
      setIsAutoSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    console.log('🎯 handleSubmit called');
    console.log('🎯 attemptId:', attemptId);
    console.log('🎯 attemptData:', attemptData);
    console.log('🎯 questions:', questions);
    console.log('🎯 answers:', answers);

    if (!attemptId) {
      console.error('❌ Missing attemptId in handleSubmit');
      toast.error('Không tìm thấy ID bài làm');
      return;
    }

    if (!attemptData || !attemptData.examId) {
      console.error('❌ Missing attemptData in handleSubmit');
      toast.error('Không tìm thấy thông tin bài thi');
      return;
    }

    if (questions.length === 0) {
      console.error('❌ No questions to submit');
      toast.error('Không có câu hỏi để nộp bài');
      return;
    }

    // Prevent auto-submit if manual submit is triggered
    hasAutoSubmittedRef.current = true;
    setSubmitting(true);
    setShowSubmitConfirm(false);

    try {
      console.log('📤 Submitting exam...');
      console.log('📋 attemptData:', attemptData);
      console.log('📝 answers:', answers);
      console.log('❓ questions:', questions);

      // Get exam ID from attemptData or use a default
      const examId = attemptData.examId || attemptData.exam?.id || 1;
      const attemptIdNum = parseInt(attemptId as string);

      // Convert answers to backend format - include ALL questions
      const submittedAnswers = questions.map((q, index) => {
        const userAnswer = answers[index];
        const questionId = q.id;

        console.log(`Question ${index + 1} (ID: ${questionId}): userAnswer =`, userAnswer);
        console.log(`Question ${index + 1} full data:`, q);

        // Get the actual question data from attemptData to get real optionIds
        const backendQuestion = attemptData.questions.find((bq: any) =>
          (bq.questionId || bq.id) === questionId
        );

        console.log(`🔍 Backend question ${index + 1}:`, backendQuestion);

        // Get selected option IDs from backend options
        let selectedOptionIds: number[] = [];

        if (backendQuestion) {
          const options = backendQuestion.options || backendQuestion.answerOptions || [];
          console.log(`  📋 All options for question ${index + 1}:`, options);
          console.log(`  👆 User selected index:`, userAnswer);

          if (Array.isArray(userAnswer)) {
            // Multiple select - map indices to real optionIds
            selectedOptionIds = userAnswer
              .map(idx => {
                const option = options[idx];
                const optionId = option?.optionId || option?.OptionId || option?.id;
                console.log(`    - Index ${idx} → optionId:`, optionId, 'option:', option);
                return optionId;
              })
              .filter(id => id != null);
          } else if (typeof userAnswer === 'number') {
            // Single choice - map index to real optionId
            const option = options[userAnswer];
            const optionId = option?.optionId || option?.OptionId || option?.id;
            console.log(`    - Selected option at index ${userAnswer}:`, option);
            console.log(`    - Extracted optionId:`, optionId);
            if (optionId) {
              selectedOptionIds = [optionId];
            }
          }
        } else {
          console.error(`❌ Could not find backend question for ID ${questionId}`);
        }

        const answerObj = {
          questionId,
          selectedOptionIds,
          textAnswer: null,
        };

        console.log(`Question ${index + 1} result:`, answerObj);
        console.log(`  - Selected optionIds:`, selectedOptionIds);
        return answerObj;
      }); // Include ALL questions, even unanswered ones

      console.log('📤 Final submittedAnswers:', submittedAnswers);
      console.log('📊 Summary:', {
        totalQuestions: questions.length,
        answeredQuestions: submittedAnswers.filter(a => a.selectedOptionIds.length > 0).length,
        unansweredQuestions: submittedAnswers.filter(a => a.selectedOptionIds.length === 0).length
      });

      // ✅ Calculate actual time spent (in seconds)
      const timeSpentSeconds = examStartTimeRef.current
        ? Math.floor((Date.now() - examStartTimeRef.current) / 1000)
        : actualTimeSpent;

      console.log('⏱️ Actual time spent:', {
        seconds: timeSpentSeconds,
        minutes: Math.floor(timeSpentSeconds / 60),
        formatted: `${Math.floor(timeSpentSeconds / 60)}m ${timeSpentSeconds % 60}s`,
        examStartTime: examStartTimeRef.current ? new Date(examStartTimeRef.current).toISOString() : 'null',
        currentTime: new Date().toISOString()
      });

      // Call API to submit exam - use the correct format
      console.log('📤 Submitting with timeSpent:', timeSpentSeconds, 'seconds');
      const result = await submitExamMutation({
        examId,
        attemptId: attemptIdNum,
        answers: submittedAnswers,
        timeSpent: timeSpentSeconds, // ✅ Send actual time spent to backend (in seconds)
      });

      console.log('📥 Submit response - TimeSpentMinutes:', result?.timeSpentMinutes || result?.TimeSpentMinutes);

      console.log('✅ Exam submitted:', result);
      console.log('📊 Submit response contains:', {
        score: result?.score,
        maxScore: result?.maxScore,
        percentage: result?.percentage,
        isPassed: result?.isPassed
      });

      if (result) {
        // Store result in sessionStorage so the result page can use it
        const resultKey = `exam_result_${attemptIdNum}`;
        sessionStorage.setItem(resultKey, JSON.stringify({
          ...result,
          examAttemptId: attemptIdNum,
          attemptId: attemptIdNum,
          examId: examId,
          timestamp: Date.now()
        }));
        console.log('💾 Stored result in sessionStorage:', resultKey);

        toast.success('Nộp bài thành công!');
        onSubmitExam(result);
      } else {
        toast.error('Có lỗi khi nộp bài, vui lòng thử lại');
        setSubmitting(false);
      }
    } catch (error: any) {
      console.error('❌ Error submitting exam:', error);
      toast.error(error.message || 'Không thể nộp bài');
      setSubmitting(false);
    }
  };

  const handleReport = () => {
    console.log('Report submitted:', reportData);
    setShowReportModal(false);
  };

  const handleSaveProgress = async () => {
    if (!attemptId || !attemptData) {
      toast.error('Không tìm thấy thông tin bài thi');
      return;
    }

    if (Object.keys(answers).length === 0) {
      toast.info('Chưa có câu trả lời nào để lưu');
      return;
    }

    try {
      const examId = attemptData.examId || attemptData.exam?.id || 1;
      const attemptIdNum = parseInt(attemptId as string);

      // Convert answers to backend format - chỉ lấy những câu đã trả lời
      const answersToSave = questions
        .map((q, index) => {
          const userAnswer = answers[index];
          
          // Bỏ qua nếu chưa trả lời
          if (userAnswer === undefined) {
            return null;
          }

          // Kiểm tra nếu là mảng rỗng (multiple select nhưng chưa chọn gì)
          if (Array.isArray(userAnswer) && userAnswer.length === 0) {
            return null;
          }

          const questionId = q.id;

          // Get the actual question data from attemptData to get real optionIds
          const backendQuestion = attemptData.questions.find((bq: any) =>
            (bq.questionId || bq.id) === questionId
          );

          // Get selected option IDs from backend options
          let selectedOptionIds: number[] = [];

          if (backendQuestion) {
            const options = backendQuestion.options || backendQuestion.answerOptions || [];

            if (Array.isArray(userAnswer)) {
              // Multiple select - map indices to real optionIds
              selectedOptionIds = userAnswer
                .map(idx => {
                  const option = options[idx];
                  return option?.optionId || option?.OptionId || option?.id;
                })
                .filter(id => id != null);
            } else if (typeof userAnswer === 'number') {
              // Single choice - map index to real optionId
              const option = options[userAnswer];
              const optionId = option?.optionId || option?.OptionId || option?.id;
              if (optionId) {
                selectedOptionIds = [optionId];
              }
            }
          }

          return {
            questionId,
            selectedOptionIds,
            textAnswer: null,
          };
        })
        .filter((answer): answer is { questionId: number; selectedOptionIds: number[]; textAnswer: null } => answer !== null);

      // Kiểm tra lại sau khi filter
      if (answersToSave.length === 0) {
        toast.info('Chưa có câu trả lời nào để lưu');
        return;
      }

      console.log('💾 Saving progress:', {
        examId,
        attemptId: attemptIdNum,
        answersCount: answersToSave.length,
        totalQuestions: questions.length,
      });

      setIsSavingProgress(true);
      await saveProgressMutation({
        examId,
        attemptId: attemptIdNum,
        answers: answersToSave,
      });

      toast.success(`Đã lưu tiến trình thành công! (${answersToSave.length}/${questions.length} câu hỏi)`);
    } catch (error: any) {
      console.error('❌ Error saving progress:', error);
      toast.error(error.message || 'Không thể lưu tiến trình');
    } finally {
      setIsSavingProgress(false);
    }
  };

  const getQuestionStatus = (index: number) => {
    const answer = answers[index];
    const hasAnswer = answer !== undefined &&
      (Array.isArray(answer) ? answer.length > 0 : true);

    if (hasAnswer) return 'answered';
    if (flaggedQuestions.has(index)) return 'flagged';
    return 'unanswered';
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'success';
      case 'flagged': return 'danger';
      default: return 'outline-secondary';
    }
  };

  // Loading state
  if (attemptLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3">Đang tải bài thi...</p>
          <small className="text-muted d-block mt-2">Attempt ID: {attemptId}</small>
        </div>
      </div>
    );
  }

  // Error state - only show if not loading AND no data
  if (!attemptLoading && !attemptData) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h5>❌ Không tìm thấy thông tin bài thi</h5>
          <p>Không thể tải thông tin bài làm (Attempt ID: {attemptId})</p>
          <p className="mb-0">Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => window.location.href = '/certification-exams'}
          >
            Quay lại danh sách bài thi
          </button>
        </div>
      </div>
    );
  }

  // Check if we have valid questions data
  const hasValidQuestions = attemptData?.questions && Array.isArray(attemptData.questions) && attemptData.questions.length > 0;
  const hasMappedQuestions = questions && questions.length > 0;

  console.log('🔍 hasValidQuestions:', hasValidQuestions);
  console.log('🔍 hasMappedQuestions:', hasMappedQuestions);
  console.log('🔍 questions:', questions);

  // Show loading if still loading OR if no data yet
  if (attemptLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center p-4">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Đang tải bài thi...</h5>
          <p className="text-muted mb-0">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  // If has backend data but no mapped questions, show warning
  if (hasValidQuestions && !hasMappedQuestions) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center p-4">
          <div className="spinner-border text-warning mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Đang xử lý câu hỏi...</h5>
          <p className="text-muted mb-0">Đang xử lý {attemptData.questions.length} câu hỏi...</p>
        </div>
      </div>
    );
  }

  // If no questions at all, show error
  if (!hasValidQuestions) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          <h5>⚠️ Bài thi chưa có câu hỏi</h5>
          <p>Bài thi này chưa có câu hỏi nào. Vui lòng liên hệ giáo viên để thêm câu hỏi.</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => window.location.href = '/certification-exams'}
          >
            Quay lại danh sách bài thi
          </button>
        </div>
      </div>
    );
  }

  // Final render log
  console.log('🎨 RENDERING EXAM - questions count:', questions.length);
  console.log('🎨 Current question index:', currentQuestion);
  console.log('🎨 Exam title:', exam.title);

  return (
    <div className="exam-taking-container d-flex exam-taking-root" style={{ minHeight: '100vh', height: 'auto', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="exam-sidebar bg-light border-end exam-taking-sidebar d-none d-lg-block" style={{ width: '300px', position: 'sticky', top: 0, height: '100vh', overflow: 'auto', zIndex: 1040 }}>
        <div className="p-3 border-bottom">
          <h6 className="mb-0 text-center">THÔNG TIN BÀI THI</h6>
        </div>

        {/* Timer */}
        <div className="p-3 text-center border-bottom">
          <div className="h5 text-danger mb-0">{formatTime(timeRemaining)}</div>
          <small className="text-muted">Thời gian còn lại</small>
        </div>

        {/* Progress */}
        <div className="p-3 border-bottom">
          <div className="d-flex justify-content-between mb-2">
            <small>Tiến độ:</small>
            <small>{Object.keys(answers).length}/{questions.length}</small>
          </div>
          <div className="progress" style={{ height: '6px' }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-3">
          <h6 className="mb-3">DANH SÁCH CÂU HỎI</h6>
          <div className="row g-2">
            {questions.map((_, index) => {
              const status = getQuestionStatus(index);
              return (
                <div key={index} className="col-3">
                  <button
                    className={`btn btn-sm w-100 btn-${getQuestionStatusColor(status)} ${currentQuestion === index ? 'border-primary border-2' : ''
                      }`}
                    onClick={() => handleQuestionNavigation(index)}
                  >
                    {index + 1}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-top" style={{ position: 'sticky', bottom: 0, background: '#f8f9fa' }}>
          <div className="d-grid gap-2">
            <button
              className="btn btn-danger"
              onClick={() => setShowReportModal(true)}
            >
              Báo cáo sự cố
            </button>
            <button
              className="btn btn-success"
              onClick={handleSaveProgress}
              disabled={isSavingProgress || Object.keys(answers).length === 0}
            >
              {isSavingProgress ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang lưu...
                </>
              ) : (
                'Lưu tiến trình'
              )}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowSubmitConfirm(true)}
            >
              Nộp bài
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="d-lg-none bg-white border-bottom p-3 position-sticky" style={{ top: 0, zIndex: 1020 }}>
        <div className="row align-items-center">
          <div className="col-4">
            <div className="text-center">
              <div className="fw-bold text-danger" style={{ fontSize: '1.1rem' }}>{formatTime(timeRemaining)}</div>
              <small className="text-muted">Thời gian</small>
            </div>
          </div>
          <div className="col-4">
            <div className="text-center">
              <div className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>
                {currentQuestion + 1}/{questions.length}
              </div>
              <small className="text-muted">Câu hỏi</small>
            </div>
          </div>
          <div className="col-4">
            <div className="text-center">
              <div className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                {Object.keys(answers).length}/{questions.length}
              </div>
              <small className="text-muted">Đã làm</small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="exam-content flex-grow-1 d-flex flex-column exam-taking-content" style={{ minHeight: '100vh', height: 'auto' }}>
        {/* Add responsive margin for mobile */}
        <style>{`
          @media (max-width: 991px) {
            .exam-taking-content {
              margin-left: 0 !important;
            }
          }
          .exam-taking-container {
            position: relative;
          }
          .exam-taking-sidebar {
            position: sticky !important;
            top: 0;
            z-index: 1040 !important;
            height: 100vh;
            overflow-y: auto;
          }
          .exam-taking-main {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          /* Ensure footer is below sidebar */
          footer {
            position: relative;
            z-index: 1030 !important;
          }
        `}</style>
        {/* Desktop Header */}
        <div className="p-4 border-bottom bg-white d-none d-lg-block" style={{ position: 'relative', zIndex: 1 }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{exam.title}</h5>
            <div className="d-flex align-items-center gap-3">
              <span
                className="badge"
                style={{
                  backgroundColor: '#0073e6',
                  color: 'white',
                  fontSize: '20px',
                  padding: '10px 16px',
                  fontWeight: '600'
                }}
              >
                Câu {currentQuestion + 1}/{questions.length}
              </span>
              <button
                className={`btn ${flaggedQuestions.has(currentQuestion) ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={() => toggleQuestionFlag(currentQuestion)}
                style={{
                  fontWeight: '500',
                  fontSize: '16px',
                  padding: '6px 12px'
                }}
              >
                Đánh dấu
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 p-3 p-lg-4 bg-light overflow-auto exam-taking-main">
          {/* Mobile Exam Title */}
          <div className="d-lg-none mb-3">
            <h6 className="text-primary fw-bold mb-2">{exam.title}</h6>
            <div className="d-flex justify-content-between align-items-center">
              <button
                className={`btn btn-sm ${flaggedQuestions.has(currentQuestion) ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={() => toggleQuestionFlag(currentQuestion)}
              >
                {flaggedQuestions.has(currentQuestion) ? '★ Đã đánh dấu' : '☆ Đánh dấu'}
              </button>
            </div>
          </div>

          {/* Question */}
          <div className="mb-4">
            <h4 className="mb-3 d-none d-lg-block" style={{
              fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Câu {currentQuestion + 1}:
              {questions[currentQuestion]?.type === 'multiple-select' && (
                <span className="badge bg-info ms-2" style={{ fontSize: '12px' }}>
                  Chọn nhiều đáp án
                </span>
              )}
            </h4>

            {/* Mobile Question Title */}
            <h5 className="mb-3 d-lg-none" style={{
              fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              fontWeight: '600',
              color: '#2c3e50',
              fontSize: '1.1rem'
            }}>
              Câu {currentQuestion + 1}:
              {questions[currentQuestion]?.type === 'multiple-select' && (
                <span className="badge bg-info ms-2" style={{ fontSize: '10px' }}>
                  Chọn nhiều
                </span>
              )}
            </h5>

            <p className="mb-3" style={{
              fontSize: window.innerWidth < 768 ? '16px' : '18px',
              lineHeight: '1.6',
              fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              fontWeight: '400',
              color: '#34495e'
            }}>{questions[currentQuestion]?.question}</p>

            {/* Question Image */}
            {questions[currentQuestion]?.image && (
              <div className="mt-3 mb-4">
                <img
                  src={questions[currentQuestion].image}
                  alt="Question illustration"
                  className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: window.innerWidth < 768 ? '200px' : '300px', maxWidth: '100%', height: 'auto' }}
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="mb-5">
            <div className="row g-2 g-lg-3">
              {questions[currentQuestion]?.options.map((option, index) => {
                const currentQuestionData = questions[currentQuestion];
                const isMultipleSelect = currentQuestionData?.type === 'multiple-select';
                const isSelected = isMultipleSelect
                  ? (answers[currentQuestion] as number[] || []).includes(index)
                  : answers[currentQuestion] === index;

                return (
                  <div key={index} className="col-12">
                    <div
                      className={`border rounded p-3 ${isSelected ? 'border-primary bg-light' : 'border'}`}
                      style={{
                        cursor: 'pointer',
                        minHeight: window.innerWidth < 768 ? '50px' : '60px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        backgroundColor: isSelected ? '#e3f2fd' : 'white'
                      }}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <div className="d-flex align-items-center w-100">
                        <input
                          className="form-check-input me-3"
                          type={isMultipleSelect ? "checkbox" : "radio"}
                          name={`question-${currentQuestion}`}
                          id={`option-${index}`}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(index)}
                        />
                        <label className="form-check-label w-100 m-0" htmlFor={`option-${index}`} style={{ fontSize: window.innerWidth < 768 ? '14px' : '16px' }}>
                          <span className="fw-bold me-2">{String.fromCharCode(65 + index)}.</span>
                          {option}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="d-none d-lg-flex justify-content-between mt-4 pt-3 border-top">
            <button
              className="btn btn-outline-primary"
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              style={{
                minWidth: '140px',
                fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                fontWeight: '500',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              ← Câu trước
            </button>
            <button
              className="btn btn-outline-primary"
              disabled={currentQuestion === questions.length - 1}
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              style={{
                minWidth: '140px',
                fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                fontWeight: '500',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              Câu tiếp →
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="d-lg-none bg-white border-top shadow-sm position-fixed w-100" style={{ bottom: 0, zIndex: 1020, paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        <div className="p-3">
          <div className="row g-2 mb-2">
            <div className="col-4">
              <button
                className="btn btn-outline-secondary w-100 btn-sm"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(prev => prev - 1)}
                style={{ minHeight: '36px' }}
              >
                ← Trước
              </button>
            </div>
            <div className="col-4">
              <button
                className="btn btn-outline-secondary w-100 btn-sm"
                onClick={() => setShowMobileQuestionGrid(!showMobileQuestionGrid)}
                style={{ minHeight: '36px' }}
              >
                {showMobileQuestionGrid ? 'Ẩn danh sách' : 'Danh sách câu'}
              </button>
            </div>
            <div className="col-4">
              <button
                className="btn btn-outline-secondary w-100 btn-sm"
                disabled={currentQuestion === questions.length - 1}
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                style={{ minHeight: '36px' }}
              >
                Tiếp →
              </button>
            </div>
          </div>
          <div className="row g-2">
            <div className="col-4">
              <button
                className="btn btn-outline-danger w-100 btn-sm"
                onClick={() => setShowReportModal(true)}
                style={{ minHeight: '36px' }}
              >
                Báo cáo
              </button>
            </div>
            <div className="col-4">
              <button
                className="btn btn-success w-100 btn-sm"
                onClick={handleSaveProgress}
                disabled={isSavingProgress || Object.keys(answers).length === 0}
                style={{ minHeight: '36px' }}
              >
                {isSavingProgress ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  'Lưu tiến trình'
                )}
              </button>
            </div>
            <div className="col-4">
              <button
                className="btn btn-primary w-100 btn-sm"
                onClick={() => setShowSubmitConfirm(true)}
                style={{ minHeight: '36px' }}
              >
                Nộp bài
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Question Grid (Conditional Rendering) */}
        {showMobileQuestionGrid && (
          <div className="mt-3">
            <div className="border rounded p-3 bg-light">
              <h6 className="mb-2">Danh sách câu hỏi</h6>
              <div className="row g-1">
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <div key={index} className="col-2">
                      <button
                        className={`btn btn-sm w-100 btn-${getQuestionStatusColor(status)} ${currentQuestion === index ? 'border-primary border-2' : ''
                          }`}
                        onClick={() => {
                          handleQuestionNavigation(index);
                          // Close the question grid after selection
                          setShowMobileQuestionGrid(false);
                        }}
                        style={{ fontSize: '12px', padding: '4px' }}
                      >
                        {index + 1}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Spacer for Fixed Bottom Nav */}
      <div className="d-lg-none" style={{ height: '160px', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}></div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">BÁO CÁO SỰ CỐ</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowReportModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Mô tả sự cố *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Vui lòng mô tả chi tiết sự cố bạn gặp phải..."
                    value={reportData.description}
                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Đính kèm ảnh/video (tùy chọn)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => setReportData({ ...reportData, attachments: e.target.files })}
                  />
                  <div className="form-text">Chỉ chấp nhận file ảnh (.jpg, .png) hoặc video (.mp4, .mov)</div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReportModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReport}
                >
                  Gửi báo cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              {/* Header */}
              <div className="text-white text-center py-4" style={{ backgroundColor: '#0073e6' }}>
                <div className="mb-2">
                  <i className="fas fa-clipboard-check" style={{ fontSize: '48px' }}></i>
                </div>
                <h4 className="fw-bold mb-0">XÁC NHẬN NỘP BÀI</h4>
                <p className="mb-0 opacity-90">Bạn có chắc chắn muốn nộp bài thi không?</p>
                <button
                  type="button"
                  className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                  onClick={() => setShowSubmitConfirm(false)}
                ></button>
              </div>

              {/* Body */}
              <div className="modal-body p-4" style={{ backgroundColor: '#ffffff' }}>
                {/* Statistics */}
                <div className="row g-3 mb-4">
                  <div className="col-4">
                    <div className="text-center p-4 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="fw-bold mb-2" style={{ fontSize: '32px', color: '#0073e6' }}>
                        {Object.keys(answers).length}
                      </div>
                      <div className="fw-medium" style={{ color: '#0073e6' }}>Đã trả lời</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-4 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="fw-bold mb-2" style={{ fontSize: '32px', color: '#0073e6' }}>
                        {flaggedQuestions.size}
                      </div>
                      <div className="fw-medium" style={{ color: '#0073e6' }}>Đánh dấu</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-4 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="fw-bold mb-2" style={{ fontSize: '32px', color: '#0073e6' }}>
                        {questions.length - Object.keys(answers).length}
                      </div>
                      <div className="fw-medium" style={{ color: '#0073e6' }}>Chưa trả lời</div>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="text-center p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="fw-bold mb-2" style={{ color: '#0073e6' }}>Lưu ý quan trọng</div>
                  <div style={{ color: '#6c757d' }}>Sau khi nộp bài, bạn sẽ không thể thay đổi câu trả lời</div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 p-4 d-flex gap-3 justify-content-center" style={{ backgroundColor: '#ffffff' }}>
                <button
                  type="button"
                  className="btn px-4 py-3 fw-medium"
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    border: 'none',
                    borderRadius: '12px',
                    minWidth: '160px'
                  }}
                  onClick={() => setShowSubmitConfirm(false)}
                >
                  Tiếp tục làm bài
                </button>
                <button
                  type="button"
                  className="btn text-white px-4 py-3 fw-bold"
                  style={{
                    backgroundColor: '#0073e6',
                    border: 'none',
                    borderRadius: '12px',
                    minWidth: '160px'
                  }}
                  onClick={handleSubmit}
                >
                  Nộp bài ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};