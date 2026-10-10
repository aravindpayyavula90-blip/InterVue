import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'student' | 'admin';
  createdAt: string;
}

export interface ExtractedTopic {
  id: string;
  name: string;
  category: 'programming' | 'system_design' | 'database' | 'web' | 'ml_ai' | 'cs_fundamentals' | 'project' | 'behavioral' | 'other';
  description: string;
  evidence: string;
  selected: boolean;
}

export interface ResumeData {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  extractedText: string;
  parsedSummary: {
    fullName?: string;
    email?: string;
    phone?: string;
    summary?: string;
    education: Array<{ institution: string; degree: string; year?: string; gpa?: string }>;
    technicalSkills: string[];
    programmingLanguages: string[];
    frameworksAndTools: string[];
    projects: Array<{ title: string; techStack: string[]; description: string; highlights: string[] }>;
    experience: Array<{ role: string; company: string; duration?: string; description?: string }>;
    certifications: string[];
    relevantCoursework: string[];
    achievements: string[];
  };
  topics: ExtractedTopic[];
  createdAt: string;
  updatedAt: string;
}

export interface JobDescriptionData {
  id: string;
  userId: string;
  title: string;
  company?: string;
  rawText: string;
  analysis: {
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    experienceRequirements: string[];
    relevantTechnologies: string[];
    matchingSkillsWithResume?: string[];
    missingSkillsNotOnResume?: string[];
    suggestedTopics?: string[];
  };
  createdAt: string;
}

export interface QuestionEvaluation {
  score: number; // 0 - 100
  strengths: string[];
  weaknesses: string[];
  suggestedModelAnswer: string;
  betterAnswerStructure: string;
  topicSpecificSuggestions: string[];
  rubricBreakdown: {
    technicalCorrectness: number; // 0-30
    relevanceAndCompleteness: number; // 0-30
    clarityAndStructure: number; // 0-20
    practicalApplication: number; // 0-20
  };
}

export interface InterviewQuestion {
  id: string;
  sessionId: string;
  index: number;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  expectedCompetencies: string[];
  projectReference?: string;
  userAnswer?: string;
  answeredAt?: string;
  evaluation?: QuestionEvaluation;
}

export interface InterviewSession {
  id: string;
  userId: string;
  resumeId: string;
  jobDescriptionId?: string;
  type: 'topic_based' | 'overall';
  selectedTopics: string[];
  targetQuestionCount: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  status: 'in_progress' | 'completed' | 'abandoned';
  currentQuestionIndex: number;
  startedAt: string;
  completedAt?: string;
  totalDurationSeconds?: number;
  overallScore?: number;
  report?: {
    totalAttempted: number;
    totalAnswered: number;
    overallScore: number;
    difficultyScores: {
      easy: number;
      medium: number;
      hard: number;
    };
    topicScores: Array<{ topic: string; score: number; count: number }>;
    strongestTopics: string[];
    topicsRequiringImprovement: string[];
    commonMistakes: string[];
    recommendedConcepts: string[];
    suggestedNextPractice: string;
  };
}

export interface FeedbackEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  rating: number; // 1 to 5
  category: 'general' | 'bug' | 'feature_request' | 'question_quality' | 'evaluation_feedback' | 'ui_ux';
  comments: string;
  featureRequest?: string;
  createdAt: string;
  status: 'new' | 'reviewed';
}

interface DatabaseSchema {
  users: User[];
  resumes: ResumeData[];
  jobDescriptions: JobDescriptionData[];
  sessions: InterviewSession[];
  questions: InterviewQuestion[];
  feedbacks: FeedbackEntry[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'intervue_db.json');

const defaultData: DatabaseSchema = {
  users: [],
  resumes: [],
  jobDescriptions: [],
  sessions: [],
  questions: [],
  feedbacks: [],
};

class JSONDatabase {
  private data: DatabaseSchema = defaultData;
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to initialize JSON Database, using in-memory state:', err);
      this.data = defaultData;
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Users
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  deleteUserData(userId: string) {
    this.data.users = this.data.users.filter(u => u.id !== userId);
    this.data.resumes = this.data.resumes.filter(r => r.userId !== userId);
    this.data.jobDescriptions = this.data.jobDescriptions.filter(j => j.userId !== userId);
    const userSessions = this.data.sessions.filter(s => s.userId === userId);
    const sessionIds = new Set(userSessions.map(s => s.id));
    this.data.sessions = this.data.sessions.filter(s => s.userId !== userId);
    this.data.questions = this.data.questions.filter(q => !sessionIds.has(q.sessionId));
    this.save();
  }

  // Resumes
  getResumesByUserId(userId: string): ResumeData[] {
    return this.data.resumes.filter(r => r.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getResumeById(id: string, userId: string): ResumeData | undefined {
    return this.data.resumes.find(r => r.id === id && r.userId === userId);
  }

  createResume(resume: ResumeData): ResumeData {
    this.data.resumes.push(resume);
    this.save();
    return resume;
  }

  updateResume(id: string, userId: string, updates: Partial<ResumeData>): ResumeData | undefined {
    const resume = this.getResumeById(id, userId);
    if (!resume) return undefined;
    Object.assign(resume, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return resume;
  }

  deleteResume(id: string, userId: string): boolean {
    const initialLen = this.data.resumes.length;
    this.data.resumes = this.data.resumes.filter(r => !(r.id === id && r.userId === userId));
    if (this.data.resumes.length !== initialLen) {
      // Clean up linked sessions and questions
      const sessionsToDelete = this.data.sessions.filter(s => s.resumeId === id && s.userId === userId);
      const sessionIds = new Set(sessionsToDelete.map(s => s.id));
      this.data.sessions = this.data.sessions.filter(s => !sessionIds.has(s.id));
      this.data.questions = this.data.questions.filter(q => !sessionIds.has(q.sessionId));
      this.save();
      return true;
    }
    return false;
  }

  // Job Descriptions
  getJobDescriptionsByUserId(userId: string): JobDescriptionData[] {
    return this.data.jobDescriptions.filter(j => j.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getJobDescriptionById(id: string, userId: string): JobDescriptionData | undefined {
    return this.data.jobDescriptions.find(j => j.id === id && j.userId === userId);
  }

  createJobDescription(jd: JobDescriptionData): JobDescriptionData {
    this.data.jobDescriptions.push(jd);
    this.save();
    return jd;
  }

  deleteJobDescription(id: string, userId: string): boolean {
    const initialLen = this.data.jobDescriptions.length;
    this.data.jobDescriptions = this.data.jobDescriptions.filter(j => !(j.id === id && j.userId === userId));
    if (this.data.jobDescriptions.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Interview Sessions
  getSessionsByUserId(userId: string): InterviewSession[] {
    return this.data.sessions.filter(s => s.userId === userId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  getSessionById(id: string, userId: string): InterviewSession | undefined {
    return this.data.sessions.find(s => s.id === id && s.userId === userId);
  }

  createSession(session: InterviewSession, questions: InterviewQuestion[]): InterviewSession {
    this.data.sessions.push(session);
    this.data.questions.push(...questions);
    this.save();
    return session;
  }

  updateSession(id: string, userId: string, updates: Partial<InterviewSession>): InterviewSession | undefined {
    const session = this.getSessionById(id, userId);
    if (!session) return undefined;
    Object.assign(session, updates);
    this.save();
    return session;
  }

  deleteSession(id: string, userId: string): boolean {
    const session = this.getSessionById(id, userId);
    if (!session) return false;
    this.data.sessions = this.data.sessions.filter(s => s.id !== id);
    this.data.questions = this.data.questions.filter(q => q.sessionId !== id);
    this.save();
    return true;
  }

  // Questions & Answers
  getQuestionsBySessionId(sessionId: string): InterviewQuestion[] {
    return this.data.questions.filter(q => q.sessionId === sessionId).sort((a, b) => a.index - b.index);
  }

  getQuestionById(questionId: string, sessionId: string): InterviewQuestion | undefined {
    return this.data.questions.find(q => q.id === questionId && q.sessionId === sessionId);
  }

  updateQuestionAnswer(questionId: string, sessionId: string, userAnswer: string, evaluation: QuestionEvaluation): InterviewQuestion | undefined {
    const question = this.getQuestionById(questionId, sessionId);
    if (!question) return undefined;
    question.userAnswer = userAnswer;
    question.answeredAt = new Date().toISOString();
    question.evaluation = evaluation;
    this.save();
    return question;
  }

  // Feedbacks
  createFeedback(feedback: FeedbackEntry): FeedbackEntry {
    this.data.feedbacks.push(feedback);
    this.save();
    return feedback;
  }

  getAllFeedbacks(): FeedbackEntry[] {
    return [...this.data.feedbacks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateFeedbackStatus(id: string, status: 'new' | 'reviewed'): FeedbackEntry | undefined {
    const fb = this.data.feedbacks.find(f => f.id === id);
    if (!fb) return undefined;
    fb.status = status;
    this.save();
    return fb;
  }

  // Analytics for a user
  getUserAnalytics(userId: string, filterResumeId?: string) {
    const userSessions = this.data.sessions.filter(s => s.userId === userId && (!filterResumeId || s.resumeId === filterResumeId));
    const completedSessions = userSessions.filter(s => s.status === 'completed');
    
    const sessionIds = new Set(userSessions.map(s => s.id));
    const allQuestions = this.data.questions.filter(q => sessionIds.has(q.sessionId));
    const answeredQuestions = allQuestions.filter(q => !!q.userAnswer && q.evaluation !== undefined);

    // Score trends over time
    const scoreTrends = completedSessions.map(s => ({
      sessionId: s.id,
      date: s.completedAt ? new Date(s.completedAt).toLocaleDateString() : new Date(s.startedAt).toLocaleDateString(),
      type: s.type,
      score: s.overallScore || 0,
      topicCount: s.selectedTopics.length
    })).reverse();

    // Topic performance
    const topicMap: Record<string, { totalScore: number; count: number }> = {};
    answeredQuestions.forEach(q => {
      if (q.evaluation && q.topic) {
        if (!topicMap[q.topic]) {
          topicMap[q.topic] = { totalScore: 0, count: 0 };
        }
        topicMap[q.topic].totalScore += q.evaluation.score;
        topicMap[q.topic].count += 1;
      }
    });

    const topicStats = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      avgScore: Math.round(data.totalScore / data.count),
      attempts: data.count,
    })).sort((a, b) => b.avgScore - a.avgScore);

    // Difficulty breakdown
    const difficultyMap: Record<'Easy' | 'Medium' | 'Hard', { totalScore: number; count: number }> = {
      Easy: { totalScore: 0, count: 0 },
      Medium: { totalScore: 0, count: 0 },
      Hard: { totalScore: 0, count: 0 },
    };

    answeredQuestions.forEach(q => {
      if (q.evaluation && difficultyMap[q.difficulty]) {
        difficultyMap[q.difficulty].totalScore += q.evaluation.score;
        difficultyMap[q.difficulty].count += 1;
      }
    });

    const difficultyStats = [
      {
        difficulty: 'Easy',
        avgScore: difficultyMap.Easy.count ? Math.round(difficultyMap.Easy.totalScore / difficultyMap.Easy.count) : 0,
        count: difficultyMap.Easy.count
      },
      {
        difficulty: 'Medium',
        avgScore: difficultyMap.Medium.count ? Math.round(difficultyMap.Medium.totalScore / difficultyMap.Medium.count) : 0,
        count: difficultyMap.Medium.count
      },
      {
        difficulty: 'Hard',
        avgScore: difficultyMap.Hard.count ? Math.round(difficultyMap.Hard.totalScore / difficultyMap.Hard.count) : 0,
        count: difficultyMap.Hard.count
      },
    ];

    // Overall completion rate
    const totalQuestions = allQuestions.length;
    const answeredCount = answeredQuestions.length;
    const completionRate = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    const averageScore = completedSessions.length > 0 
      ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completedSessions.length)
      : (answeredQuestions.length > 0 ? Math.round(answeredQuestions.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / answeredQuestions.length) : 0);

    return {
      totalSessions: userSessions.length,
      completedSessionsCount: completedSessions.length,
      totalQuestionsAnswered: answeredCount,
      averageScore,
      completionRate,
      scoreTrends,
      topicStats,
      difficultyStats,
      strongestTopics: topicStats.slice(0, 3).map(t => t.topic),
      weakestTopics: topicStats.slice(-3).reverse().map(t => t.topic),
    };
  }
}

export const db = new JSONDatabase();
