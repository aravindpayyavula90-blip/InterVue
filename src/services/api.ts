import {
  User,
  ResumeData,
  JobDescriptionData,
  InterviewSession,
  InterviewQuestion,
  QuestionEvaluation,
  FeedbackEntry,
  UserAnalytics,
} from '../types';

let authToken: string | null = localStorage.getItem('intervue_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('intervue_token', token);
  } else {
    localStorage.removeItem('intervue_token');
  }
};

export const getStoredAuthToken = () => authToken || localStorage.getItem('intervue_token');

export const getGuestId = () => {
  let gid = localStorage.getItem('intervue_guest_id');
  if (!gid) {
    gid = 'gst_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('intervue_guest_id', gid);
  }
  return gid;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getStoredAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('x-guest-id', getGuestId());
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = (isJson && data?.error) ? data.error : (typeof data === 'string' && data ? data : `Request failed with status ${response.status}`);
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; confirmPassword?: string; name?: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  syncFirebaseUser: (firebaseToken: string, guestId?: string) =>
    request<{ user: User }>('/api/auth/firebase-sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${firebaseToken}` },
      body: JSON.stringify({ guestId }),
    }),

  logout: async () => {
    try {
      await request<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  updatePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteAccount: () =>
    request<{ message: string }>('/api/auth/delete-account', {
      method: 'DELETE',
    }),

  // Resumes
  uploadResumeFile: (file: File) => {
    const formData = new FormData();
    formData.append('resumeFile', file);
    return request<{ resume: ResumeData }>('/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });
  },

  uploadResumeText: (text: string, fileName?: string) =>
    request<{ resume: ResumeData }>('/api/resumes/upload', {
      method: 'POST',
      body: JSON.stringify({ text, fileName }),
    }),

  getResumes: () => request<{ resumes: ResumeData[] }>('/api/resumes'),

  getResume: (id: string) => request<{ resume: ResumeData }>(`/api/resumes/${id}`),

  updateTopicSelection: (resumeId: string, selectedTopicIds: string[]) =>
    request<{ resume: ResumeData }>(`/api/resumes/${resumeId}/select-topics`, {
      method: 'POST',
      body: JSON.stringify({ selectedTopicIds }),
    }),

  regenerateResumeAnalysis: (resumeId: string) =>
    request<{ resume: ResumeData }>(`/api/resumes/${resumeId}/regenerate`, {
      method: 'POST',
    }),

  deleteResume: (id: string) =>
    request<{ message: string }>(`/api/resumes/${id}`, {
      method: 'DELETE',
    }),

  // Job Descriptions
  createJobDescription: (body: { rawText: string; title?: string; company?: string; resumeId?: string }) =>
    request<{ jobDescription: JobDescriptionData }>('/api/job-descriptions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getJobDescriptions: () => request<{ jobDescriptions: JobDescriptionData[] }>('/api/job-descriptions'),

  deleteJobDescription: (id: string) =>
    request<{ message: string }>(`/api/job-descriptions/${id}`, {
      method: 'DELETE',
    }),

  // Interviews
  generateInterviewSession: (body: {
    resumeId: string;
    jobDescriptionId?: string;
    type: 'topic_based' | 'overall';
    selectedTopics: string[];
    targetQuestionCount: number;
  }) =>
    request<{ session: InterviewSession; questions: InterviewQuestion[] }>('/api/interviews/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getInterviews: () => request<{ sessions: InterviewSession[] }>('/api/interviews'),

  getInterviewDetails: (sessionId: string) =>
    request<{ session: InterviewSession; questions: InterviewQuestion[]; resume: ResumeData }>(
      `/api/interviews/${sessionId}`
    ),

  submitAnswer: (sessionId: string, questionId: string, answer: string) =>
    request<{ question: InterviewQuestion; session: InterviewSession; answeredCount: number; totalCount: number }>(
      `/api/interviews/${sessionId}/submit-answer`,
      {
        method: 'POST',
        body: JSON.stringify({ questionId, answer }),
      }
    ),

  finishInterviewSession: (sessionId: string) =>
    request<{ session: InterviewSession }>(`/api/interviews/${sessionId}/finish`, {
      method: 'POST',
    }),

  deleteInterviewSession: (sessionId: string) =>
    request<{ message: string }>(`/api/interviews/${sessionId}`, {
      method: 'DELETE',
    }),

  // Analytics
  getAnalytics: (resumeId?: string) =>
    request<{ analytics: UserAnalytics }>(`/api/analytics${resumeId ? `?resumeId=${resumeId}` : ''}`),

  // Audio Speech TTS
  getTtsAudio: (text: string) =>
    request<{ audioBase64?: string; mimeType?: string; fallback?: boolean }>('/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // Feedback
  submitFeedback: (body: { rating: number; category: string; comments: string; featureRequest?: string }) =>
    request<{ message: string; feedback: FeedbackEntry }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAdminFeedbacks: () => request<{ feedbacks: FeedbackEntry[] }>('/api/feedback/admin'),

  updateFeedbackStatus: (id: string, status: 'new' | 'reviewed') =>
    request<{ feedback: FeedbackEntry }>(`/api/feedback/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
