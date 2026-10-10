export interface User {
  id: string;
  email: string;
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
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestedModelAnswer: string;
  betterAnswerStructure: string;
  topicSpecificSuggestions: string[];
  rubricBreakdown: {
    technicalCorrectness: number;
    relevanceAndCompleteness: number;
    clarityAndStructure: number;
    practicalApplication: number;
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
  rating: number;
  category: 'general' | 'bug' | 'feature_request' | 'question_quality' | 'evaluation_feedback' | 'ui_ux';
  comments: string;
  featureRequest?: string;
  createdAt: string;
  status: 'new' | 'reviewed';
}

export interface UserAnalytics {
  totalSessions: number;
  completedSessionsCount: number;
  totalQuestionsAnswered: number;
  averageScore: number;
  completionRate: number;
  scoreTrends: Array<{
    sessionId: string;
    date: string;
    type: string;
    score: number;
    topicCount: number;
  }>;
  topicStats: Array<{
    topic: string;
    avgScore: number;
    attempts: number;
  }>;
  difficultyStats: Array<{
    difficulty: 'Easy' | 'Medium' | 'Hard';
    avgScore: number;
    count: number;
  }>;
  strongestTopics: string[];
  weakestTopics: string[];
}
