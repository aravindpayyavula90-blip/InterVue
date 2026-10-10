import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import mammoth from 'mammoth';

import { db, User, ResumeData, ExtractedTopic, InterviewSession, InterviewQuestion } from './server/db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  requireAuth,
  optionalAuth,
  rateLimiter,
  AuthenticatedRequest
} from './server/auth.js';
import {
  analyzeResumeWithGemini,
  analyzeJobDescriptionWithGemini,
  generateInterviewQuestionsWithGemini,
  evaluateAnswerWithGemini,
  generateSpeechAudioWithGemini
} from './server/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Multer memory storage for uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.includes('text')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are accepted.'));
    }
  },
});

// Helper: Extract text from PDF buffer safely
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfModule: any = await import('pdf-parse');
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: new Uint8Array(buffer) });
      await parser.load();
      const text = await parser.getText();
      if (typeof parser.destroy === 'function') {
        try { await parser.destroy(); } catch {}
      }
      const result = typeof text === 'string' ? text : (text?.text || '');
      if (result && result.trim().length > 0) return result;
    }
    const fn = pdfModule.default || pdfModule;
    if (typeof fn === 'function') {
      const data = await fn(buffer);
      if (data?.text) return data.text;
    }
  } catch (err: any) {
    console.warn('PDF text extraction notice:', err?.message || err);
  }
  return '';
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------
app.post('/api/auth/register', rateLimiter(30, 60000), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, confirmPassword, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const existing = db.getUserByEmail(emailTrimmed);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      email: emailTrimmed,
      passwordHash,
      name: name?.trim() || emailTrimmed.split('@')[0],
      role: 'student',
      createdAt: new Date().toISOString(),
    };

    db.createUser(newUser);
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', rateLimiter(40, 60000), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response): void => {
  res.clearCookie('intervue_token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/update-password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user!;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    db.updateUser(user.id, { passwordHash: newHash });

    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

app.get('/api/auth/export-data', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const user = req.user!;
  const resumes = db.getResumesByUserId(userId);
  const jds = db.getJobDescriptionsByUserId(userId);
  const sessions = db.getSessionsByUserId(userId);
  const questions = db.getQuestionsBySessionId(userId);

  res.setHeader('Content-Disposition', `attachment; filename=intervue_data_${user.id}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, name: user.name },
    resumes,
    jobDescriptions: jds,
    sessions,
  });
});

app.delete('/api/auth/delete-account', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  db.deleteUserData(userId);
  res.clearCookie('intervue_token', { path: '/' });
  res.json({ message: 'Account and all associated interview data permanently deleted.' });
});

// ----------------------------------------------------
// RESUME PROCESSING & MANAGEMENT ROUTES
// ----------------------------------------------------
// Sync Firebase User
app.post('/api/auth/firebase-sync', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

app.post('/api/resumes/upload', requireAuth, upload.single('resumeFile'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    let extractedText = '';
    let fileName = 'pasted_resume.txt';
    let fileSize = 0;
    let base64Doc: string | undefined = undefined;
    let mimeType: string | undefined = undefined;

    if (req.file) {
      fileName = req.file.originalname;
      fileSize = req.file.size;
      const ext = path.extname(fileName).toLowerCase();

      if (ext === '.pdf') {
        mimeType = 'application/pdf';
        base64Doc = req.file.buffer.toString('base64');
        extractedText = await extractTextFromPdfBuffer(req.file.buffer);
      } else if (ext === '.docx' || ext === '.doc') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        base64Doc = req.file.buffer.toString('base64');
        try {
          const docxResult = await mammoth.extractRawText({ buffer: req.file.buffer });
          extractedText = docxResult.value || '';
        } catch (e) {
          console.warn('DOCX parse notice:', e);
        }
      } else {
        extractedText = req.file.buffer.toString('utf-8');
      }
    } else if (req.body.text) {
      extractedText = req.body.text;
      fileName = req.body.fileName || 'Pasted Resume';
      fileSize = Buffer.byteLength(extractedText, 'utf-8');
    } else {
      res.status(400).json({ error: 'Please upload a PDF/DOCX file or paste resume text.' });
      return;
    }

    if (!base64Doc && (!extractedText || extractedText.trim().length < 20)) {
      res.status(400).json({ error: 'The uploaded resume contains insufficient readable text.' });
      return;
    }

    // Call Gemini to analyze resume (passing base64 for PDF/DOCX or text)
    const parsed = await analyzeResumeWithGemini({
      text: extractedText,
      base64Data: base64Doc,
      mimeType,
    });

    // Format topics
    const topics: ExtractedTopic[] = parsed.topics.map((t, idx) => ({
      id: 'top_' + (idx + 1) + '_' + Math.random().toString(36).substring(2, 6),
      name: t.name,
      category: t.category,
      description: t.description,
      evidence: t.evidence,
      selected: true, // Default all selected, user can toggle
    }));

    const newResume: ResumeData = {
      id: 'res_' + Math.random().toString(36).substring(2, 11),
      userId,
      fileName,
      fileSize,
      extractedText,
      parsedSummary: {
        fullName: parsed.fullName,
        email: parsed.email,
        phone: parsed.phone,
        summary: parsed.summary,
        education: parsed.education,
        technicalSkills: parsed.technicalSkills,
        programmingLanguages: parsed.programmingLanguages,
        frameworksAndTools: parsed.frameworksAndTools,
        projects: parsed.projects,
        experience: parsed.experience,
        certifications: parsed.certifications,
        relevantCoursework: parsed.relevantCoursework,
        achievements: parsed.achievements,
      },
      topics,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createResume(newResume);
    res.status(201).json({ resume: newResume });
  } catch (err: any) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process and analyze resume.' });
  }
});

app.get('/api/resumes', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const resumes = db.getResumesByUserId(req.user!.id);
  res.json({ resumes });
});

app.get('/api/resumes/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const resume = db.getResumeById(req.params.id, req.user!.id);
  if (!resume) {
    res.status(404).json({ error: 'Resume not found.' });
    return;
  }
  res.json({ resume });
});

app.post('/api/resumes/:id/select-topics', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { selectedTopicIds } = req.body;
  const resume = db.getResumeById(req.params.id, req.user!.id);
  if (!resume) {
    res.status(404).json({ error: 'Resume not found.' });
    return;
  }

  const selectedSet = new Set(Array.isArray(selectedTopicIds) ? selectedTopicIds : []);
  const updatedTopics = resume.topics.map(t => ({
    ...t,
    selected: selectedSet.has(t.id),
  }));

  const updated = db.updateResume(resume.id, req.user!.id, { topics: updatedTopics });
  res.json({ resume: updated });
});

app.post('/api/resumes/:id/regenerate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const resume = db.getResumeById(req.params.id, req.user!.id);
    if (!resume) {
      res.status(404).json({ error: 'Resume not found.' });
      return;
    }

    const parsed = await analyzeResumeWithGemini(resume.extractedText);
    const topics: ExtractedTopic[] = parsed.topics.map((t, idx) => ({
      id: 'top_' + (idx + 1) + '_' + Math.random().toString(36).substring(2, 6),
      name: t.name,
      category: t.category,
      description: t.description,
      evidence: t.evidence,
      selected: true,
    }));

    const updated = db.updateResume(resume.id, req.user!.id, {
      parsedSummary: {
        fullName: parsed.fullName,
        email: parsed.email,
        phone: parsed.phone,
        summary: parsed.summary,
        education: parsed.education,
        technicalSkills: parsed.technicalSkills,
        programmingLanguages: parsed.programmingLanguages,
        frameworksAndTools: parsed.frameworksAndTools,
        projects: parsed.projects,
        experience: parsed.experience,
        certifications: parsed.certifications,
        relevantCoursework: parsed.relevantCoursework,
        achievements: parsed.achievements,
      },
      topics,
    });

    res.json({ resume: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to re-analyze resume.' });
  }
});

app.delete('/api/resumes/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const success = db.deleteResume(req.params.id, req.user!.id);
  if (!success) {
    res.status(404).json({ error: 'Resume not found.' });
    return;
  }
  res.json({ message: 'Resume and associated interview sessions deleted.' });
});

// ----------------------------------------------------
// JOB DESCRIPTION (JD) ROUTES
// ----------------------------------------------------
app.post('/api/job-descriptions', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { rawText, title, company, resumeId } = req.body;
    if (!rawText || rawText.trim().length < 30) {
      res.status(400).json({ error: 'Job description text is too short (min 30 characters).' });
      return;
    }

    let resumeText = '';
    if (resumeId) {
      const resume = db.getResumeById(resumeId, req.user!.id);
      if (resume) resumeText = resume.extractedText;
    }

    const analysis = await analyzeJobDescriptionWithGemini(rawText, resumeText);

    const newJD = db.createJobDescription({
      id: 'jd_' + Math.random().toString(36).substring(2, 11),
      userId: req.user!.id,
      title: title?.trim() || analysis.title || 'Target Job Role',
      company: company?.trim() || analysis.company || '',
      rawText,
      analysis,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ jobDescription: newJD });
  } catch (err: any) {
    console.error('JD analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze job description.' });
  }
});

app.get('/api/job-descriptions', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const jds = db.getJobDescriptionsByUserId(req.user!.id);
  res.json({ jobDescriptions: jds });
});

app.delete('/api/job-descriptions/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const ok = db.deleteJobDescription(req.params.id, req.user!.id);
  if (!ok) {
    res.status(404).json({ error: 'Job description not found.' });
    return;
  }
  res.json({ message: 'Job description removed.' });
});

// ----------------------------------------------------
// INTERVIEW QUESTION GENERATION & PRACTICE ROUTES
// ----------------------------------------------------
app.post('/api/interviews/generate', requireAuth, rateLimiter(10, 60000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      resumeId,
      jobDescriptionId,
      type = 'topic_based',
      selectedTopics = [],
      targetQuestionCount = 10, // Can be 5, 10, 15, or 30
    } = req.body;

    const resume = db.getResumeById(resumeId, userId);
    if (!resume) {
      res.status(400).json({ error: 'Please select a valid resume before starting an interview.' });
      return;
    }

    if (!selectedTopics || selectedTopics.length === 0) {
      res.status(400).json({ error: 'Please select at least one topic for interview preparation.' });
      return;
    }

    let jdAnalysis = null;
    if (jobDescriptionId) {
      const jd = db.getJobDescriptionById(jobDescriptionId, userId);
      if (jd) jdAnalysis = jd.analysis;
    }

    // Determine difficulty distribution based on target count
    const totalCount = Math.max(3, Math.min(30, Number(targetQuestionCount) || 10));
    let easyCount = Math.round(totalCount / 3);
    let mediumCount = Math.round(totalCount / 3);
    let hardCount = totalCount - easyCount - mediumCount;

    if (totalCount === 30) {
      easyCount = 10;
      mediumCount = 10;
      hardCount = 10;
    }

    const distribution = { easy: easyCount, medium: mediumCount, hard: hardCount };

    // Generate questions via Gemini
    const generated = await generateInterviewQuestionsWithGemini({
      resumeSummary: resume.parsedSummary,
      selectedTopics,
      interviewType: type,
      targetCount: totalCount,
      distribution,
      jobDescriptionAnalysis: jdAnalysis,
    });

    const sessionId = 'int_' + Math.random().toString(36).substring(2, 11);

    const questions: InterviewQuestion[] = generated.map((q, idx) => ({
      id: 'q_' + (idx + 1) + '_' + Math.random().toString(36).substring(2, 6),
      sessionId,
      index: idx + 1,
      topic: q.topic || selectedTopics[idx % selectedTopics.length] || 'General',
      difficulty: q.difficulty || (idx < easyCount ? 'Easy' : idx < easyCount + mediumCount ? 'Medium' : 'Hard'),
      questionText: q.questionText,
      expectedCompetencies: q.expectedCompetencies || [],
      projectReference: q.projectReference,
    }));

    const session: InterviewSession = {
      id: sessionId,
      userId,
      resumeId,
      jobDescriptionId,
      type,
      selectedTopics,
      targetQuestionCount: questions.length,
      difficultyDistribution: distribution,
      status: 'in_progress',
      currentQuestionIndex: 0,
      startedAt: new Date().toISOString(),
    };

    db.createSession(session, questions);

    res.status(201).json({ session, questions });
  } catch (err: any) {
    console.error('Interview generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate interview session.' });
  }
});

app.get('/api/interviews', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const sessions = db.getSessionsByUserId(req.user!.id);
  res.json({ sessions });
});

app.get('/api/interviews/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const session = db.getSessionById(req.params.id, req.user!.id);
  if (!session) {
    res.status(404).json({ error: 'Interview session not found.' });
    return;
  }
  const questions = db.getQuestionsBySessionId(session.id);
  const resume = db.getResumeById(session.resumeId, req.user!.id);
  res.json({ session, questions, resume });
});

app.post('/api/interviews/:id/submit-answer', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { questionId, answer } = req.body;
    const session = db.getSessionById(req.params.id, req.user!.id);
    if (!session) {
      res.status(404).json({ error: 'Interview session not found.' });
      return;
    }

    const question = db.getQuestionById(questionId, session.id);
    if (!question) {
      res.status(404).json({ error: 'Question not found in this session.' });
      return;
    }

    const resume = db.getResumeById(session.resumeId, req.user!.id);
    const candidateContext = resume ? `Projects: ${resume.parsedSummary.projects?.map(p => p.title).join(', ')}. Skills: ${resume.parsedSummary.technicalSkills?.join(', ')}` : undefined;

    // Evaluate with Gemini
    const evaluation = await evaluateAnswerWithGemini({
      questionText: question.questionText,
      topic: question.topic,
      difficulty: question.difficulty,
      expectedCompetencies: question.expectedCompetencies,
      userAnswer: answer || '',
      candidateContext,
    });

    const updatedQuestion = db.updateQuestionAnswer(questionId, session.id, answer || '', evaluation);

    // Check if all questions have been answered to automatically compute completion report
    const allQuestions = db.getQuestionsBySessionId(session.id);
    const answeredCount = allQuestions.filter(q => q.userAnswer !== undefined && q.userAnswer.length > 0).length;

    res.json({
      question: updatedQuestion,
      session,
      answeredCount,
      totalCount: allQuestions.length,
    });
  } catch (err: any) {
    console.error('Answer submission error:', err);
    res.status(500).json({ error: err.message || 'Failed to evaluate submitted answer.' });
  }
});

app.post('/api/interviews/:id/finish', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const session = db.getSessionById(req.params.id, req.user!.id);
  if (!session) {
    res.status(404).json({ error: 'Interview session not found.' });
    return;
  }

  const questions = db.getQuestionsBySessionId(session.id);
  const answered = questions.filter(q => q.evaluation !== undefined);
  const totalAttempted = answered.length;

  const totalScoreSum = answered.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0);
  const overallScore = totalAttempted > 0 ? Math.round(totalScoreSum / totalAttempted) : 0;

  // Breakdown by difficulty
  const diffMap: Record<'Easy' | 'Medium' | 'Hard', { sum: number; count: number }> = {
    Easy: { sum: 0, count: 0 },
    Medium: { sum: 0, count: 0 },
    Hard: { sum: 0, count: 0 },
  };
  answered.forEach(q => {
    if (diffMap[q.difficulty]) {
      diffMap[q.difficulty].sum += q.evaluation?.score || 0;
      diffMap[q.difficulty].count++;
    }
  });

  const difficultyScores = {
    easy: diffMap.Easy.count ? Math.round(diffMap.Easy.sum / diffMap.Easy.count) : 0,
    medium: diffMap.Medium.count ? Math.round(diffMap.Medium.sum / diffMap.Medium.count) : 0,
    hard: diffMap.Hard.count ? Math.round(diffMap.Hard.sum / diffMap.Hard.count) : 0,
  };

  // Topic breakdown
  const topicMap: Record<string, { sum: number; count: number }> = {};
  answered.forEach(q => {
    if (!topicMap[q.topic]) topicMap[q.topic] = { sum: 0, count: 0 };
    topicMap[q.topic].sum += q.evaluation?.score || 0;
    topicMap[q.topic].count++;
  });

  const topicScores = Object.entries(topicMap).map(([topic, data]) => ({
    topic,
    score: Math.round(data.sum / data.count),
    count: data.count,
  })).sort((a, b) => b.score - a.score);

  const strongestTopics = topicScores.filter(t => t.score >= 70).map(t => t.topic);
  const topicsRequiringImprovement = topicScores.filter(t => t.score < 70).map(t => t.topic);

  // Common weaknesses collected from evaluations
  const commonMistakes: string[] = [];
  const recommendedConcepts: string[] = [];

  answered.forEach(q => {
    if (q.evaluation) {
      if (q.evaluation.weaknesses) {
        commonMistakes.push(...q.evaluation.weaknesses.slice(0, 1));
      }
      if (q.evaluation.topicSpecificSuggestions) {
        recommendedConcepts.push(...q.evaluation.topicSpecificSuggestions.slice(0, 1));
      }
    }
  });

  const uniqueMistakes = Array.from(new Set(commonMistakes)).slice(0, 4);
  const uniqueRecommendations = Array.from(new Set(recommendedConcepts)).slice(0, 4);

  const durationSec = Math.round((new Date().getTime() - new Date(session.startedAt).getTime()) / 1000);

  const updatedSession = db.updateSession(session.id, req.user!.id, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    totalDurationSeconds: durationSec,
    overallScore,
    report: {
      totalAttempted,
      totalAnswered: answered.filter(q => (q.userAnswer?.trim().length || 0) > 0).length,
      overallScore,
      difficultyScores,
      topicScores,
      strongestTopics: strongestTopics.length ? strongestTopics : (topicScores[0] ? [topicScores[0].topic] : []),
      topicsRequiringImprovement: topicsRequiringImprovement.length ? topicsRequiringImprovement : ['Keep practicing hard difficulty questions'],
      commonMistakes: uniqueMistakes.length ? uniqueMistakes : ['Add more concrete implementation details.'],
      recommendedConcepts: uniqueRecommendations.length ? uniqueRecommendations : ['Revisit core algorithmic problem solving.'],
      suggestedNextPractice: topicsRequiringImprovement[0] ? `Focus practice on ${topicsRequiringImprovement[0]} medium & hard questions.` : 'Practice overall mock interview with timed constraints.',
    },
  });

  res.json({ session: updatedSession });
});

app.delete('/api/interviews/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const success = db.deleteSession(req.params.id, req.user!.id);
  if (!success) {
    res.status(404).json({ error: 'Interview session not found.' });
    return;
  }
  res.json({ message: 'Interview session deleted.' });
});

// ----------------------------------------------------
// ANALYTICS ROUTE
// ----------------------------------------------------
app.get('/api/analytics', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { resumeId } = req.query;
  const analytics = db.getUserAnalytics(req.user!.id, resumeId as string | undefined);
  res.json({ analytics });
});

// ----------------------------------------------------
// AUDIO TTS ROUTE (Gemini Flash Lite TTS)
// ----------------------------------------------------
app.post('/api/tts', rateLimiter(30, 60000), async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    const audioBase64 = await generateSpeechAudioWithGemini(text.slice(0, 1000));
    if (audioBase64) {
      res.json({ audioBase64, mimeType: 'audio/wav' });
    } else {
      res.json({ fallback: true });
    }
  } catch (err: any) {
    console.error('TTS error:', err);
    res.json({ fallback: true });
  }
});

// ----------------------------------------------------
// FEEDBACK & ADMIN ROUTES
// ----------------------------------------------------
app.post('/api/feedback', optionalAuth, rateLimiter(10, 60000), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { rating, category, comments, featureRequest } = req.body;
    if (!comments || comments.trim().length === 0) {
      res.status(400).json({ error: 'Please provide feedback comments.' });
      return;
    }

    const feedback = db.createFeedback({
      id: 'fb_' + Math.random().toString(36).substring(2, 11),
      userId: req.user?.id,
      userEmail: req.user?.email || 'anonymous',
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      category: category || 'general',
      comments: comments.trim(),
      featureRequest: featureRequest?.trim(),
      createdAt: new Date().toISOString(),
      status: 'new',
    });

    res.status(201).json({ message: 'Thank you! Your feedback has been received.', feedback });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record feedback.' });
  }
});

// Feedback management interface
app.get('/api/feedback/admin', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Unauthorized: Administrator access required.' });
    return;
  }

  const feedbacks = db.getAllFeedbacks();
  res.json({ feedbacks });
});

app.patch('/api/feedback/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Unauthorized: Administrator access required.' });
    return;
  }

  const updated = db.updateFeedbackStatus(req.params.id, req.body.status);
  if (!updated) {
    res.status(404).json({ error: 'Feedback not found.' });
    return;
  }
  res.json({ feedback: updated });
});

// ----------------------------------------------------
// VITE DEV SERVER / STATIC ASSETS
// ----------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InterVue full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
