// Questions Service cho Ngân hàng câu hỏi
// Khớp đúng endpoints /api/question-bank

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface AnswerOptionResponse {
  optionId: number;
  content: string;
  isCorrect: boolean;
  orderIndex?: number;
}

export interface QuestionBankResponse {
  questionId: number;
  content: string;
  questionType?: string;
  difficulty?: string;
  marks?: number;
  tags?: string;
  createdAt: string;
  answerOptions: AnswerOptionResponse[];
  subjectId?: number;
  subjectName?: string;
}

export interface QuestionBankFilterRequest {
  page?: number;
  pageSize?: number;
  subjectId?: number;
  questionType?: string;
  difficulty?: string;
  tags?: string;
  searchContent?: string;
}

export interface QuestionBankListResponse {
  questions: QuestionBankResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateAnswerOptionRequest {
  content: string;
  isCorrect: boolean;
  orderIndex?: number;
}

export interface CreateQuestionBankRequest {
  content: string;
  questionType: string; // ví dụ: MultipleChoice
  difficulty: string; // ví dụ: Easy/Medium/Hard
  marks: number;
  tags?: string; // chuỗi, ngăn cách dấu phẩy
  subjectId: number; // Môn học (bắt buộc)
  answerOptions: CreateAnswerOptionRequest[];
}

export interface UpdateQuestionBankRequest {
  content: string;
  questionType: string;
  difficulty: string;
  marks: number;
  tags?: string;
  subjectId: number; // Môn học (bắt buộc)
  answerOptions: CreateAnswerOptionRequest[];
}

type BackendAnswerOption = {
  OptionId?: number;
  optionId?: number;
  Content?: string;
  content?: string;
  IsCorrect?: boolean;
  isCorrect?: boolean;
  OrderIndex?: number;
  orderIndex?: number;
};

type BackendQuestion = {
  QuestionId?: number;
  questionId?: number;
  Content?: string;
  content?: string;
  QuestionType?: string;
  questionType?: string;
  Difficulty?: string;
  difficulty?: string;
  Marks?: number;
  marks?: number;
  Tags?: string;
  tags?: string;
  CreatedAt?: string | Date;
  createdAt?: string;
  SubjectId?: number;
  subjectId?: number;
  SubjectName?: string;
  subjectName?: string;
  AnswerOptions?: BackendAnswerOption[];
  answerOptions?: BackendAnswerOption[];
};

function parseAiRawToSuggestion(rawText: string, payload: { description: string; subjectId: number; questionType?: string; difficulty?: string; marks?: number; optionsCount?: number; correctCount?: number; tags?: string; }): CreateQuestionBankRequest {
  let t = String(rawText || '').trim();
  t = t.replace(/```json/g, '').replace(/```/g, '');
  if (!t.trim().startsWith('{')) {
    const s = t.indexOf('{');
    const e = t.lastIndexOf('}');
    if (s >= 0 && e > s) t = t.substring(s, e + 1);
  }
  let root: any = null;
  try {
    root = JSON.parse(t);
  } catch {
    const sanitized = t.replace(/,\s*}\s*/g, '}').replace(/,\s*]\s*/g, ']');
    try {
      root = JSON.parse(sanitized);
    } catch {
      root = null;
    }
  }
  if (root && typeof root === 'object') {
    let innerRaw: string = '';
    if (typeof root.raw === 'string') innerRaw = String(root.raw);
    else if (root.data && typeof root.data.raw === 'string') innerRaw = String(root.data.raw);
    else if (root.Data && typeof root.Data.raw === 'string') innerRaw = String(root.Data.raw);
    if (innerRaw) {
      let ti = innerRaw.trim().replace(/```json/g, '').replace(/```/g, '');
      if (!ti.trim().startsWith('{')) {
        const s2 = ti.indexOf('{');
        const e2 = ti.lastIndexOf('}');
        if (s2 >= 0 && e2 > s2) ti = ti.substring(s2, e2 + 1);
      }
      try {
        root = JSON.parse(ti);
      } catch {
        const sanitized2 = ti.replace(/,\s*}\s*/g, '}').replace(/,\s*]\s*/g, ']');
        try {
          root = JSON.parse(sanitized2);
        } catch {}
      }
    }
  }
  if (Array.isArray(root) && root.length > 0) root = root[0];
  const getString = (keys: string[]) => {
    for (const k of keys) {
      const v = root?.[k];
      if (typeof v === 'string') return v;
    }
    return '';
  };
  const getNumber = (keys: string[]) => {
    for (const k of keys) {
      const v = root?.[k];
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && !isNaN(Number(v))) return Number(v);
    }
    return 0;
  };
  let content = getString(['content', 'question', 'questionText', 'prompt']);
  const questionType = getString(['questionType', 'type']) || (payload.questionType ?? 'MultipleChoice');
  const difficulty = getString(['difficulty', 'level']) || (payload.difficulty ?? 'Medium');
  const marks = getNumber(['marks', 'score', 'point', 'points']) || Number(payload.marks ?? 1);
  const tags = getString(['tags']) || (payload.tags ?? '');
  const subjectId = Number(root?.subjectId ?? root?.SubjectId ?? payload.subjectId);
  let correctIdx = -1;
  if (typeof root?.correctIndex === 'number') correctIdx = root.correctIndex;
  if (typeof root?.correctAnswerIndex === 'number') correctIdx = root.correctAnswerIndex;
  const correctAnswerText = getString(['correctAnswer', 'correct', 'answer']);
  const correctAnswersArray = Array.isArray(root?.correctAnswers) ? root.correctAnswers.filter((x: any) => typeof x === 'string') : [];
  const optionsSrc: any = root?.answerOptions ?? root?.options ?? root?.choices ?? [];
  let parsed: CreateAnswerOptionRequest[] = [];
  if (Array.isArray(optionsSrc)) {
    let i = 0;
    for (const opt of optionsSrc) {
      let oc = '';
      let ic = false;
      if (typeof opt === 'string') {
        oc = opt;
      } else if (opt && typeof opt === 'object') {
        if (typeof opt.content === 'string') oc = opt.content;
        else if (typeof opt.Content === 'string') oc = opt.Content;
        else if (typeof opt.text === 'string') oc = opt.text;
        else if (typeof opt.option === 'string') oc = opt.option;
        else if (typeof opt.label === 'string') oc = opt.label;
        else if (typeof opt.value === 'string') oc = opt.value;
        if (typeof opt.isCorrect === 'boolean') ic = opt.isCorrect;
        else if (typeof opt.IsCorrect === 'boolean') ic = opt.IsCorrect;
      }
      if (!oc) oc = `Đáp án ${i + 1}`;
      oc = String(oc);
      const createOpt: CreateAnswerOptionRequest = { content: oc, isCorrect: ic, orderIndex: i + 1 };
      if (correctIdx >= 0 && i === correctIdx) createOpt.isCorrect = true;
      if (correctAnswerText && oc.trim().toLowerCase() === correctAnswerText.trim().toLowerCase()) createOpt.isCorrect = true;
      if (correctAnswersArray.length && correctAnswersArray.some((a: string) => a.trim().toLowerCase() === oc.trim().toLowerCase())) createOpt.isCorrect = true;
      parsed.push(createOpt);
      i++;
    }
  }
  if (parsed.length < 2) {
    const need = Math.max(2, Number(payload.optionsCount ?? 4));
    const correct = Math.max(1, Number(payload.correctCount ?? 1));
    parsed = Array.from({ length: need }).map((_, i) => ({ content: `Đáp án ${i + 1}`.trim(), isCorrect: i < correct, orderIndex: i + 1 }));
  }
  if (!parsed.some(o => o.isCorrect)) parsed[0].isCorrect = true;
  if (!content) content = payload.description || 'Câu hỏi trắc nghiệm mẫu';
  const dbg = typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true';
  if (dbg) {
    console.log('🧭 AI raw length:', (rawText || '').length);
    console.log('🧭 AI parsed question:', content);
    console.log('🧭 AI parsed options:', parsed.map(p => ({ c: p.content, correct: p.isCorrect })));
  }
  return { content, questionType, difficulty, marks: Number(marks || 1), tags, subjectId, answerOptions: parsed } as CreateQuestionBankRequest;
}

function mapBackendQuestionToFrontend(backend: BackendQuestion): QuestionBankResponse {
  const options = backend.AnswerOptions ?? backend.answerOptions ?? [];
  return {
    questionId: backend.QuestionId ?? backend.questionId ?? 0,
    content: backend.Content ?? backend.content ?? '',
    questionType: backend.QuestionType ?? backend.questionType,
    difficulty: backend.Difficulty ?? backend.difficulty,
    marks: backend.Marks ?? backend.marks,
    tags: backend.Tags ?? backend.tags,
    createdAt: backend.CreatedAt ? new Date(backend.CreatedAt).toISOString() : (backend.createdAt ?? new Date().toISOString()),
    subjectId: backend.SubjectId ?? backend.subjectId,
    subjectName: backend.SubjectName ?? backend.subjectName,
    answerOptions: options.map((opt) => ({
      optionId: opt.OptionId ?? opt.optionId ?? 0,
      content: opt.Content ?? opt.content ?? '',
      isCorrect: opt.IsCorrect ?? opt.isCorrect ?? false,
      orderIndex: opt.OrderIndex ?? opt.orderIndex,
    })),
  };
}

class QuestionsService {
  // Lấy danh sách câu hỏi từ ngân hàng với filter và pagination
  async getQuestions(filter?: QuestionBankFilterRequest): Promise<QuestionBankListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filter?.page) queryParams.append('Page', filter.page.toString());
      if (filter?.pageSize) queryParams.append('PageSize', filter.pageSize.toString());
      if (filter?.subjectId) queryParams.append('SubjectId', filter.subjectId.toString());
      if (filter?.questionType) queryParams.append('QuestionType', filter.questionType);
      if (filter?.difficulty) queryParams.append('Difficulty', filter.difficulty);
      if (filter?.tags) queryParams.append('Tags', filter.tags);
      if (filter?.searchContent) queryParams.append('SearchContent', filter.searchContent);

      const endpoint = `${API_ENDPOINTS.questions.getAll}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const debug = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production') && (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true');
      const log = (...args: unknown[]) => { if (debug) console.log(...args); };
      const warn = (...args: unknown[]) => { if (debug) console.warn(...args); };
      log('🔍 QuestionsService.getQuestions - Calling:', endpoint);
      const res = await apiService.get<any>(endpoint);
      log('📦 QuestionsService.getQuestions - Raw response:', res);
      
      // Backend trả về { message, data: QuestionBankListResponse }
      // Hoặc có thể là { message, data: { Questions, TotalCount, Page, PageSize, TotalPages } }
      let listData: any = null;
      
      // Thử nhiều cách parse response
      if (res && typeof res === 'object') {
        // Thử res.data trước (thường là format từ API Gateway)
        if (res.data) {
          log('📦 Found res.data:', res.data);
          // Nếu res.data có data property
          if (res.data.data) {
            listData = res.data.data;
            log('📦 Found res.data.data:', listData);
          } else {
            listData = res.data;
          }
        }
        // Thử res.Data (PascalCase)
        else if (res.Data) {
          log('📦 Found res.Data:', res.Data);
          if (res.Data.data) {
            listData = res.Data.data;
            log('📦 Found res.Data.data:', listData);
          } else {
            listData = res.Data;
          }
        }
        // Thử res trực tiếp
        else {
          listData = res;
        }
      }
      
      log('📦 QuestionsService.getQuestions - Parsed listData:', listData);
      log('📦 listData type:', typeof listData);
      log('📦 listData keys:', listData ? Object.keys(listData) : 'null');
      
      if (listData && typeof listData === 'object') {
        // Backend trả về QuestionBankListResponse với Questions (PascalCase)
        if ('Questions' in listData || 'questions' in listData) {
          const questions = listData.Questions ?? listData.questions ?? [];
          const totalCount = listData.TotalCount ?? listData.totalCount ?? listData.Total ?? listData.total ?? 0;
          const page = listData.Page ?? listData.page ?? 1;
          const pageSize = listData.PageSize ?? listData.pageSize ?? 10;
          const totalPages = listData.TotalPages ?? listData.totalPages ?? Math.ceil(totalCount / pageSize);
          
          log('✅ QuestionsService.getQuestions - Parsed:', {
            questionsCount: questions.length,
            totalCount,
            page,
            pageSize,
            totalPages
          });
          
          // Map questions from PascalCase to camelCase
          const mappedQuestions = Array.isArray(questions) 
            ? questions.map(mapBackendQuestionToFrontend)
            : [];
          
          log('✅ QuestionsService.getQuestions - Mapped questions:', mappedQuestions.length);
          
          return {
            questions: mappedQuestions,
            totalCount,
            page,
            pageSize,
            totalPages,
          };
        }
        // Nếu là mảng trực tiếp
        else if (Array.isArray(listData)) {
          log('✅ QuestionsService.getQuestions - Array format, count:', listData.length);
          const mappedQuestions = listData.map(mapBackendQuestionToFrontend);
          return {
            questions: mappedQuestions,
            totalCount: listData.length,
            page: filter?.page ?? 1,
            pageSize: filter?.pageSize ?? 10,
            totalPages: Math.ceil(listData.length / (filter?.pageSize ?? 10)),
          };
        }
      }
      
      warn('⚠️ QuestionsService.getQuestions - No valid data found, returning empty');
      return {
        questions: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };
    } catch (error) {
      console.error('❌ QuestionsService.getQuestions - Error:', error);
      throw error;
    }
  }

  // Lấy câu hỏi theo ID (nếu BE có)
  async getQuestionById(id: number): Promise<QuestionBankResponse> {
      const res = await apiService.get<any>(API_ENDPOINTS.questions.getById(String(id)));
      return (res.data ?? res.Data ?? res)?.data ?? res.Data;
  }

  // Tạo câu hỏi mới vào ngân hàng
  async createQuestion(questionData: CreateQuestionBankRequest): Promise<QuestionBankResponse> {
    try {
      const normalizedOptions = (() => {
        const list = Array.isArray(questionData.answerOptions) ? questionData.answerOptions : [];
        const trimmed = list.map((o, i) => ({ content: String(o.content || '').trim() || `Đáp án ${i + 1}`, isCorrect: !!o.isCorrect, orderIndex: o.orderIndex ?? i + 1 }));
        const result = trimmed.length >= 2 ? trimmed : Array.from({ length: Math.max(2, 4) }).map((_, i) => ({ content: `Đáp án ${i + 1}`, isCorrect: i === 0, orderIndex: i + 1 }));
        if (!result.some(x => x.isCorrect)) result[0].isCorrect = true;
        return result.map((o, i) => ({ ...o, orderIndex: i + 1 }));
      })();
      const payload: CreateQuestionBankRequest = {
        content: String(questionData.content || '').trim(),
        questionType: String(questionData.questionType || 'MultipleChoice'),
        difficulty: String(questionData.difficulty || 'Medium'),
        marks: Number(questionData.marks || 1),
        tags: questionData.tags || '',
        subjectId: Number(questionData.subjectId),
        answerOptions: normalizedOptions,
      };
      const res = await apiService.post<any>(API_ENDPOINTS.questions.create, payload);
      const raw = (res.data ?? res.Data ?? res);
      const dataObj = raw?.data ?? raw?.Data ?? raw;
      return mapBackendQuestionToFrontend(dataObj as any);
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  // Cập nhật câu hỏi
  async updateQuestion(id: number, questionData: UpdateQuestionBankRequest): Promise<QuestionBankResponse> {
    try {
      const res = await apiService.put<any>(API_ENDPOINTS.questions.update(String(id)), questionData);
      return (res.data ?? res.Data ?? res)?.data ?? res.Data;
    } catch (error) {
      console.error(`Error updating question ${id}:`, error);
      throw error;
    }
  }

  // Xóa câu hỏi
  async deleteQuestion(id: number): Promise<void> {
    try {
      await apiService.delete<any>(API_ENDPOINTS.questions.delete(String(id)));
    } catch (error) {
      console.error(`Error deleting question ${id}:`, error);
      throw error;
    }
  }

  async generateAIQuestion(payload: { description: string; subjectId: number; questionType?: string; difficulty?: string; marks?: number; optionsCount?: number; correctCount?: number; tags?: string; }): Promise<CreateQuestionBankRequest> {
    try {
      const envAny = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
      const envKey = ((envAny.VITE_GEMINI_API_KEY || '') as string).trim();
      const envKeys = ((envAny.VITE_GEMINI_API_KEYS || '') as string).split(/[\,\s]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
      const lsKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_key') || '').trim() : '';
      const lsKeys = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_keys') || '').split(/[\,\s]+/).map(s => s.trim()).filter(s => s.length > 20) : [];
      const key = envKeys[0] || ((envKey && envKey.length > 20) ? envKey : (lsKeys[0] || (lsKey && lsKey.length > 20 ? lsKey : '')));
      const modelEnv = ((envAny.VITE_GEMINI_MODEL || '') as string).trim();
      const modelsEnv = ((envAny.VITE_GEMINI_MODELS || '') as string).split(/[\,\s]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 3);
      const modelLS = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_model') || '').trim() : '';
      const modelsLS = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_models') || '').split(/[\,\s]+/).map(s => s.trim()).filter(s => s.length > 3) : [];
      const model = modelEnv || modelLS || modelsEnv[0] || modelsLS[0] || '';
      const headers: Record<string, string> | undefined = key ? ({ 'X-Gemini-Api-Key': key, ...(model ? { 'X-Gemini-Model': model } : {}) }) : undefined;
      const res = await apiService.post<any>(API_ENDPOINTS.questions.generateAI, payload, headers);
      const raw = (res.data ?? res.Data ?? res)?.data ?? res.Data ?? res;
      if (typeof raw === 'string') {
        return parseAiRawToSuggestion(String(raw), payload);
      }

      const content = raw.content ?? raw.Content ?? payload.description ?? '';
      const questionType = raw.questionType ?? raw.QuestionType ?? (payload.questionType ?? 'MultipleChoice');
      const difficulty = raw.difficulty ?? raw.Difficulty ?? (payload.difficulty ?? 'Medium');
      const marks = Number((raw.marks ?? raw.Marks ?? payload.marks ?? 1) || 1);
      const tags = raw.tags ?? raw.Tags ?? payload.tags ?? '';
      const subjectId = Number(raw.subjectId ?? raw.SubjectId ?? payload.subjectId);

      const list = (raw.answerOptions ?? raw.AnswerOptions ?? []) as BackendAnswerOption[];
      let parsed = list.map((opt: BackendAnswerOption, idx: number) => ({
        content: (opt.content ?? opt.Content ?? `Đáp án ${idx + 1}`),
        isCorrect: (opt.isCorrect ?? opt.IsCorrect ?? false) as boolean,
        orderIndex: (opt.orderIndex ?? opt.OrderIndex ?? (idx + 1)) as number,
      }));

      parsed = parsed.map(p => ({ ...p, content: String(p.content) }));

      if (parsed.length < 2) {
        const need = Math.max(2, Number(payload.optionsCount ?? 4));
        parsed = Array.from({ length: need }).map((_, i) => ({
          content: `Đáp án ${i + 1}`,
          isCorrect: i === 0,
          orderIndex: i + 1,
        }));
      }
      if (!parsed.some(o => o.isCorrect)) {
        parsed[0].isCorrect = true;
      }

      return {
        content,
        questionType,
        difficulty,
        marks,
        tags,
        subjectId,
        answerOptions: parsed,
      } as CreateQuestionBankRequest;
    } catch (error) {
      console.error('Error generating question by AI:', error);
      let rawText = (error as any)?.response?.data?.raw || (error as any)?.raw || '';
      if (!rawText) {
        const er = (error as any)?.raw;
        if (typeof er === 'string' && er.trim()) {
          try {
            const obj = JSON.parse(er);
            rawText = obj?.raw || obj?.data?.raw || obj?.Data?.raw || '';
          } catch {}
        }
        if (!rawText) {
          const ed = (error as any)?.response?.data;
          if (ed && typeof ed === 'object') {
            rawText = ed?.raw || ed?.data?.raw || ed?.Data?.raw || '';
          }
        }
      }
      if (rawText) {
        try {
          return parseAiRawToSuggestion(String(rawText), payload);
        } catch {}
      }
      throw error;
    }
  }

  async generateAIQuestionWithModel(payload: { description: string; subjectId: number; questionType?: string; difficulty?: string; marks?: number; optionsCount?: number; correctCount?: number; tags?: string; }, model: string, apiKey?: string): Promise<CreateQuestionBankRequest> {
    try {
      const envAny = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
      const mLow = String(model || '').toLowerCase();
      const provLS = typeof localStorage !== 'undefined' ? (localStorage.getItem('ai_provider') || '') : '';
      const prov = mLow.includes('gemini') ? 'gemini' : ((mLow.includes('llama') || mLow.includes('kimi') || mLow.includes('whisper') || mLow.includes('gpt oss') || provLS.toLowerCase().includes('groq')) ? 'groq' : 'gemini');
      const keyGemEnv = ((envAny.VITE_GEMINI_API_KEY || '') as string).trim();
      const keyGroqEnv = (((envAny.VITE_GROQ_API_KEY || envAny.VITE_OSS_API_KEY) || '') as string).trim();
      const keyGemLS = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_key') || '').trim() : '';
      const keyGroqLS = typeof localStorage !== 'undefined' ? ((localStorage.getItem('groq_api_key') || localStorage.getItem('oss_api_key') || '') as string).trim() : '';
      const key = (apiKey && apiKey.length > 20) ? apiKey : (prov === 'gemini' ? ((keyGemEnv && keyGemEnv.length > 20) ? keyGemEnv : (keyGemLS && keyGemLS.length > 20 ? keyGemLS : '')) : ((keyGroqEnv && keyGroqEnv.length > 20) ? keyGroqEnv : (keyGroqLS && keyGroqLS.length > 20 ? keyGroqLS : '')));
      
      if (prov === 'groq' && key) {
        const prompt = `Create a multiple-choice question about "${payload.description}".
Difficulty: ${payload.difficulty || 'Medium'}.
Subject ID: ${payload.subjectId}.
Marks: ${payload.marks || 1}.
Return ONLY valid JSON. Format:
{
  "content": "Question text",
  "questionType": "MultipleChoice",
  "difficulty": "${payload.difficulty || 'Medium'}",
  "marks": ${payload.marks || 1},
  "tags": "${payload.tags || ''}",
  "subjectId": ${payload.subjectId},
  "answerOptions": [
      {"content": "Option A", "isCorrect": true, "orderIndex": 1},
      {"content": "Option B", "isCorrect": false, "orderIndex": 2},
      {"content": "Option C", "isCorrect": false, "orderIndex": 3},
      {"content": "Option D", "isCorrect": false, "orderIndex": 4}
  ]
}`;
        try {
            const rawText = await this.groqGenerateRaw(prompt, model, key);
            return parseAiRawToSuggestion(rawText, payload);
        } catch (e) {
            console.warn('Groq client-side generation failed, falling back to backend', e);
            // Fallthrough to backend call
        }
      }

      const headers: Record<string, string> | undefined = key ? (prov === 'gemini' ? ({ 'X-Gemini-Api-Key': key, ...(model ? { 'X-Gemini-Model': model } : {}) }) : ({ 'X-Groq-Api-Key': key, ...(model ? { 'X-Groq-Model': model } : {}) })) : undefined;
      const res = await apiService.post<any>(API_ENDPOINTS.questions.generateAI, payload, headers);
      const raw = (res.data ?? res.Data ?? res)?.data ?? res.Data ?? res;
      if (typeof raw === 'string') {
        return parseAiRawToSuggestion(String(raw), payload);
      }
      const content = raw.content ?? raw.Content ?? payload.description ?? '';
      const questionType = raw.questionType ?? raw.QuestionType ?? (payload.questionType ?? 'MultipleChoice');
      const difficulty = raw.difficulty ?? raw.Difficulty ?? (payload.difficulty ?? 'Medium');
      const marks = Number((raw.marks ?? raw.Marks ?? payload.marks ?? 1) || 1);
      const tags = raw.tags ?? raw.Tags ?? payload.tags ?? '';
      const subjectId = Number(raw.subjectId ?? raw.SubjectId ?? payload.subjectId);
      const list = (raw.answerOptions ?? raw.AnswerOptions ?? []) as BackendAnswerOption[];
      let parsed = list.map((opt: BackendAnswerOption, idx: number) => ({
        content: (opt.content ?? opt.Content ?? `Đáp án ${idx + 1}`),
        isCorrect: (opt.isCorrect ?? opt.IsCorrect ?? false) as boolean,
        orderIndex: (opt.orderIndex ?? opt.OrderIndex ?? (idx + 1)) as number,
      }));
      parsed = parsed.map(p => ({ ...p, content: String(p.content) }));
      if (parsed.length < 2) {
        const need = Math.max(2, Number(payload.optionsCount ?? 4));
        parsed = Array.from({ length: need }).map((_, i) => ({
          content: `Đáp án ${i + 1}`,
          isCorrect: i === 0,
          orderIndex: i + 1,
        }));
      }
      if (!parsed.some(o => o.isCorrect)) parsed[0].isCorrect = true;
      return { content, questionType, difficulty, marks, tags, subjectId, answerOptions: parsed } as CreateQuestionBankRequest;
    } catch (error) {
      let rawText = (error as any)?.response?.data?.raw || (error as any)?.raw || '';
      if (!rawText) {
        const er = (error as any)?.raw;
        if (typeof er === 'string' && er.trim()) {
          try {
            const obj = JSON.parse(er);
            rawText = obj?.raw || obj?.data?.raw || obj?.Data?.raw || '';
          } catch {}
        }
        if (!rawText) {
          const ed = (error as any)?.response?.data;
          if (ed && typeof ed === 'object') {
            rawText = ed?.raw || ed?.data?.raw || ed?.Data?.raw || '';
          }
        }
      }
      if (rawText) {
        try { return parseAiRawToSuggestion(String(rawText), payload); } catch {}
      }
      throw error;
    }
  }

  private async groqGenerateRaw(prompt: string, model: string, apiKey: string): Promise<string> {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const instructions = 'You are a JSON generator. Return ONLY valid JSON matching the user request. No markdown, no explanation.';
    const body = { model, messages: [{ role: 'system', content: instructions }, { role: 'user', content: prompt }], temperature: 0.2 } as any;
    const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return String(text || '').trim();
  }

  async createQuestionsFromAI(payload: { subjectId: number; topic?: string; count?: number; rawText?: string }, model?: string, apiKey?: string): Promise<{ count: number; questionIds: number[] }> {
    const envAny = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
    const modelEnvGem = ((envAny.VITE_GEMINI_MODEL || '') as string).trim();
    const modelEnvGroq = (((envAny.VITE_GROQ_MODEL || envAny.VITE_OSS_MODEL) || '') as string).trim();
    const modelLSGem = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_model') || '').trim() : '';
    const modelLSGroq = typeof localStorage !== 'undefined' ? ((localStorage.getItem('oss_model') || localStorage.getItem('groq_model') || '') as string).trim() : '';
    const modelChosenPrim = (model && model.trim()) || modelEnvGem || modelLSGem || '';
    const isGroqModel = (() => { const ml = String(modelChosenPrim || model || '').toLowerCase(); return ml.includes('llama') || ml.includes('kimi') || ml.includes('whisper') || ml.includes('gpt oss') || ml.includes('scout'); })();
    const modelChosen = isGroqModel ? (model || modelEnvGroq || modelLSGroq || 'llama-3.3-70b-versatile') : (modelChosenPrim || 'gemini-1.5-flash');
    const total = Math.max(1, Number(payload.count || 5));
    const topicText = String(payload.topic || 'Câu hỏi trắc nghiệm mẫu').trim();
    const wantMulti = /chọn\s*nhiều|nhiều\s*đáp\s*án|multi\s*select|multiple\s*answers|chọn\s*1\s*hoặc\s*nhiều/i.test(String(payload.rawText || topicText));
    const dbg = typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true';
    if (dbg) {
      console.debug('QuestionsService.createQuestionsFromAI start', { modelChosen, count: total, topic: topicText, wantMulti });
    }
    const createdIds: number[] = [];
    for (let i = 0; i < total; i++) {
      try {
        const desc = (() => {
          const raw = String(payload.rawText || '').trim();
          if (raw && raw.startsWith('{') && raw.endsWith('}')) return topicText;
          return `${topicText} (Question ${i + 1} of ${total})`;
        })();
        const sug = await this.generateAIQuestionWithModel({ description: desc, subjectId: Number(payload.subjectId), questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1, optionsCount: 4, correctCount: wantMulti ? 2 : 1 }, modelChosen, apiKey);
        const created = await this.createQuestion(sug);
        createdIds.push(created.questionId);
      } catch (err) {
        if (dbg) {
          console.warn('QuestionsService.createQuestionsFromAI error, using fallback', err);
        }
        const baseContent = `Câu hỏi ${i + 1}: ${topicText}`;
        const opts = ['A', 'B', 'C', 'D'].map((t, idx) => ({ content: t, isCorrect: wantMulti ? idx < 2 : idx === 0, orderIndex: idx + 1 }));
        const sug = { content: baseContent, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1, tags: '', subjectId: Number(payload.subjectId), answerOptions: opts };
        const created = await this.createQuestion(sug);
        createdIds.push(created.questionId);
      }
    }
    return { count: createdIds.length, questionIds: createdIds };
  }
}

export const questionsService = new QuestionsService();
export default questionsService;
