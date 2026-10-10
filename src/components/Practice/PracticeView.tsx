import React, { useState, useEffect, useRef } from 'react';
import {
  PlayCircle,
  PauseCircle,
  Square,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Loader2,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  Layers,
  FolderGit2,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  ResumeData,
  InterviewSession,
  InterviewQuestion,
  QuestionEvaluation,
} from '../../types';

interface PracticeViewProps {
  initialSessionId?: string | null;
  onViewAnalytics?: () => void;
  onGoToResume?: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  initialSessionId,
  onViewAnalytics,
  onGoToResume,
}) => {
  const { user, activeResume, showToast } = useAuth();

  // Wizard Setup state
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [setupMode, setSetupMode] = useState<boolean>(!initialSessionId);

  // Setup options
  const [interviewType, setInterviewType] = useState<'topic_based' | 'overall'>('topic_based');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedTopicNames, setSelectedTopicNames] = useState<string[]>([]);

  // Practice state
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [confirmEndModal, setConfirmEndModal] = useState<boolean>(false);
  const [showEvaluationDrawer, setShowEvaluationDrawer] = useState<boolean>(true);

  // Audio & Speech State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [recordingTimer, setRecordingTimer] = useState<number>(0);
  const recognitionRef = useRef<any>(null);
  const recordingIntervalRef = useRef<any>(null);

  // Sync selected topics from active resume on initial load
  useEffect(() => {
    if (activeResume) {
      const activeTopics = activeResume.topics.filter((t) => t.selected).map((t) => t.name);
      setSelectedTopicNames(activeTopics.length > 0 ? activeTopics : activeResume.topics.map((t) => t.name));
    }
  }, [activeResume]);

  // Load existing session if initialSessionId passed
  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
    }
  }, [initialSessionId]);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setCurrentAnswer((prev) => {
            const separator = prev.trim().length > 0 && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + transcript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'not-allowed') {
          showToast('Microphone access denied. You can continue typing your answer.', 'error');
        }
        stopRecording();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition init error', e);
      setSpeechSupported(false);
    }

    return () => {
      stopSpeaking();
      stopRecording();
    };
  }, []);

  const loadSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await api.getInterviewDetails(sessionId);
      setSession(res.session);
      setQuestions(res.questions);
      setSetupMode(false);
      // Find first unanswered question or default to 0
      const firstUnanswered = res.questions.findIndex((q) => !q.userAnswer);
      const targetIdx = firstUnanswered !== -1 ? firstUnanswered : 0;
      setCurrentIndex(targetIdx);
      setCurrentAnswer(res.questions[targetIdx]?.userAnswer || '');
    } catch (err: any) {
      showToast(err.message || 'Failed to load interview session.', 'error');
      setSetupMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!activeResume) {
      showToast('Please upload or select a resume before starting an interview.', 'error');
      return;
    }
    if (selectedTopicNames.length === 0) {
      showToast('Please select at least one topic for interview questions.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.generateInterviewSession({
        resumeId: activeResume.id,
        type: interviewType,
        selectedTopics: selectedTopicNames,
        targetQuestionCount: questionCount,
      });

      setSession(res.session);
      setQuestions(res.questions);
      setCurrentIndex(0);
      setCurrentAnswer('');
      setSetupMode(false);
      showToast(`Personalized ${res.questions.length}-question interview generated!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate interview.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech: Reads question aloud
  const handleToggleSpeak = async (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    setIsSpeaking(true);
    // Use Web Speech Synthesis API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
      showToast('Speech audio is not supported in this browser.', 'info');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Microphone Speech-To-Text
  const handleToggleRecording = () => {
    if (!speechSupported) {
      showToast('Speech recognition is not supported in this browser. Please type your answer.', 'info');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        setRecordingTimer(0);
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTimer((prev) => prev + 1);
        }, 1000);
      }
    } catch (e) {
      console.warn('Could not start recording', e);
    }
  };

  const stopRecording = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch {}
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Navigation
  const goToQuestion = (idx: number) => {
    stopSpeaking();
    stopRecording();
    setCurrentIndex(idx);
    setCurrentAnswer(questions[idx]?.userAnswer || '');
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!session || !currentQuestion) return;
    if (!currentAnswer.trim()) {
      showToast('Please type or record an answer before submitting.', 'info');
      return;
    }

    stopRecording();
    setIsSubmitting(true);
    try {
      const res = await api.submitAnswer(session.id, currentQuestion.id, currentAnswer.trim());
      // Update local questions state with answer & evaluation
      setQuestions((prev) =>
        prev.map((q) => (q.id === currentQuestion.id ? res.question : q))
      );
      showToast('Answer evaluated by InterVue AI!', 'success');
      setShowEvaluationDrawer(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit and evaluate answer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finish Interview
  const handleFinishInterview = async () => {
    if (!session) return;
    setConfirmEndModal(false);
    setLoading(true);
    try {
      const res = await api.finishInterviewSession(session.id);
      setSession(res.session);
      showToast('Interview session completed! Report generated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to finish session.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const isCompleted = session?.status === 'completed';
  const answeredCount = questions.filter((q) => q.userAnswer && q.evaluation).length;

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // ----------------------------------------------------
  // RENDER: SETUP WIZARD
  // ----------------------------------------------------
  if (setupMode || !session) {
    if (!activeResume) {
      return (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 text-center max-w-xl mx-auto shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Upload Your Resume First</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            InterVue delivers personalized interview questions crafted strictly from your resume projects and technical background.
          </p>
          <button
            onClick={onGoToResume}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            Go to Resume Upload
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xs max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <PlayCircle className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Configure Your Mock Interview
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            Tailor difficulty, topic distribution, and session format to match your interview prep goals.
          </p>
        </div>

        {/* 1. Interview Mode */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
            1. Select Interview Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setInterviewType('topic_based')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                interviewType === 'topic_based'
                  ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900">Topic-Based Interview</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4]"></span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Focus questions strictly on specific technical skills and topics selected from your resume.
              </p>
            </div>

            <div
              onClick={() => setInterviewType('overall')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                interviewType === 'overall'
                  ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900">Comprehensive Mock Interview</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]"></span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Full-scope simulation: technical questions, project deep-dives, internship challenges, and behavioral STAR questions.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Number of Questions & Progressive Difficulty */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
              2. Number of Questions & Progressive Difficulty
            </label>
            <span className="text-xs text-gray-500 font-medium">
              Progressive: Easy → Medium → Hard
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { count: 5, label: '5 Questions', sub: 'Quick Drill (2 Easy, 2 Med, 1 Hard)' },
              { count: 10, label: '10 Questions', sub: 'Standard (3 Easy, 4 Med, 3 Hard)' },
              { count: 15, label: '15 Questions', sub: 'Comprehensive (5 Easy, 5 Med, 5 Hard)' },
              { count: 30, label: '30 Questions', sub: 'Full Session (10 Easy, 10 Med, 10 Hard)' },
            ].map((option) => (
              <button
                key={option.count}
                type="button"
                onClick={() => setQuestionCount(option.count)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  questionCount === option.count
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <div className="text-sm font-bold">{option.label}</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{option.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Topics from Resume */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
              3. Include Resume Topics ({selectedTopicNames.length} selected)
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedTopicNames(activeResume.topics.map((t) => t.name))}
                className="text-blue-600 hover:underline font-semibold"
              >
                All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedTopicNames([])}
                className="text-gray-500 hover:underline font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {activeResume.topics.map((t) => {
              const isSelected = selectedTopicNames.includes(t.name);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setSelectedTopicNames((prev) =>
                      prev.includes(t.name) ? prev.filter((n) => n !== t.name) : [...prev, t.name]
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleStartInterview}
            disabled={loading || selectedTopicNames.length === 0}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Personalized Questions...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Begin Practice Session</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: FINAL REPORT (If Session Completed)
  // ----------------------------------------------------
  if (isCompleted && session.report) {
    const report = session.report;

    return (
      <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
        {/* Report Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Interview Complete</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Performance Evaluation Report
            </h2>
            <p className="text-xs text-gray-500">
              {session.type === 'topic_based' ? 'Topic-Based Session' : 'Comprehensive Mock Interview'} • {report.totalAttempted} Questions Evaluated
            </p>
          </div>

          {/* Overall Score Circle */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-3xl border border-blue-100 shadow-2xs min-w-[170px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Overall Score</span>
            <span className="text-4xl font-extrabold text-gray-900 mt-1">
              {report.overallScore}
              <span className="text-lg font-semibold text-gray-400">/100</span>
            </span>
            <span className="text-[11px] font-semibold text-gray-500 mt-1">
              {report.overallScore >= 80 ? 'Excellent Mastery' : report.overallScore >= 65 ? 'Solid Competency' : 'Needs Practice'}
            </span>
          </div>
        </div>

        {/* Difficulty & Topic Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Difficulty Scores */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Performance by Difficulty
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700">Easy (Fundamentals)</span>
                  <span>{report.difficultyScores.easy}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${report.difficultyScores.easy}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-700">Medium (Applied & Debugging)</span>
                  <span>{report.difficultyScores.medium}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${report.difficultyScores.medium}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700">Hard (Architecture & Trade-offs)</span>
                  <span>{report.difficultyScores.hard}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all"
                    style={{ width: `${report.difficultyScores.hard}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Performance */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Performance by Topic
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {report.topicScores.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                >
                  <span className="font-semibold text-gray-800">{t.topic}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      t.score >= 75
                        ? 'bg-green-100 text-green-800'
                        : t.score >= 55
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {t.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strengths & Improvement Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Demonstrated Strengths</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              {report.strongestTopics.map((top, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Strong command of {top} core concepts and execution.</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Recommended Revision & Next Steps</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              {report.recommendedConcepts.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Question Review Accordion */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-5">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
            Detailed Question & Answer Review
          </h3>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const evalData = q.evaluation;
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">Q{idx + 1}.</span>
                      <span className="text-xs font-semibold text-gray-900">{q.topic}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </div>
                    {evalData && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        Score: {evalData.score}/100
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-gray-900">{q.questionText}</p>

                  {/* Student Answer */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs">
                    <span className="font-bold text-gray-700 block mb-1">Your Answer:</span>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {q.userAnswer || <span className="italic text-gray-400">Unanswered</span>}
                    </p>
                  </div>

                  {/* Model Answer & Better Structure */}
                  {evalData && (
                    <div className="space-y-2 pt-2 border-t border-gray-200/80 text-xs">
                      <div>
                        <span className="font-bold text-emerald-800 block mb-0.5">Model Answer:</span>
                        <p className="text-gray-600 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                          {evalData.suggestedModelAnswer}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-blue-800 block mb-0.5">Better Answer Structure:</span>
                        <p className="text-gray-600 leading-relaxed bg-blue-50/40 p-2.5 rounded-xl border border-blue-100">
                          {evalData.betterAnswerStructure}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
            <button
              onClick={() => {
                setSession(null);
                setSetupMode(true);
              }}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Interview</span>
            </button>

            {onViewAnalytics && (
              <button
                onClick={onViewAnalytics}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <BarChart2 className="w-4 h-4" />
                <span>View in Analytics Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: LIVE INTERACTIVE PRACTICE WORKSPACE
  // ----------------------------------------------------
  if (!currentQuestion) {
    return <div className="text-center py-10">No questions available.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Session Progress Bar & Controls */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-gray-300">•</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(currentQuestion.difficulty)}`}>
              {currentQuestion.difficulty}
            </span>
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
              {currentQuestion.topic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause / Resume Button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
            >
              {isPaused ? <PlayCircle className="w-3.5 h-3.5 text-green-600" /> : <PauseCircle className="w-3.5 h-3.5 text-amber-600" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* End Interview */}
            <button
              onClick={() => setConfirmEndModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Finish Early</span>
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Question Selector Dots / Numbers */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {questions.map((q, idx) => {
            const hasAnswered = !!q.userAnswer && q.evaluation;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                    : hasAnswered
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={`Question ${idx + 1}: ${q.topic} (${q.difficulty})`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Display Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {currentQuestion.projectReference && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-200">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Project Deep-Dive: {currentQuestion.projectReference}</span>
              </div>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
              {currentQuestion.questionText}
            </h3>
          </div>

          {/* Audio TTS Speaker Button */}
          <button
            onClick={() => handleToggleSpeak(currentQuestion.questionText)}
            className={`p-3 rounded-2xl border transition-all shrink-0 ${
              isSpeaking
                ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
            }`}
            title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
          >
            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Expected Competencies tags */}
        {currentQuestion.expectedCompetencies && currentQuestion.expectedCompetencies.length > 0 && (
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Expected Competencies:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentQuestion.expectedCompetencies.map((comp, i) => (
                <span key={i} className="text-[11px] bg-white text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Answer Input Workspace */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700">
              Your Answer
            </label>

            {/* Voice Recording Controls */}
            <div className="flex items-center gap-2">
              {isRecording && (
                <span className="text-xs text-rose-600 font-semibold flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  Recording ({recordingTimer}s)...
                </span>
              )}

              <button
                type="button"
                onClick={handleToggleRecording}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isRecording
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Dictate your answer via microphone"
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-blue-600" />}
                <span>{isRecording ? 'Stop Recording' : 'Voice Input'}</span>
              </button>
            </div>
          </div>

          <textarea
            rows={7}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            disabled={isSubmitting}
            placeholder="Type your answer clearly. Explain your thought process, implementation steps, trade-offs, and examples..."
            className="w-full p-4 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
          />

          <p className="text-[11px] text-gray-400">
            Tip: You can use voice recording to draft your speech, then edit the text before submitting.
          </p>
        </div>

        {/* Submit and Navigation Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => goToQuestion(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !currentAnswer.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating with InterVue AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{currentQuestion.evaluation ? 'Update & Re-evaluate' : 'Submit Answer'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Answer Evaluation Feedback Drawer / Card */}
      {currentQuestion.evaluation && showEvaluationDrawer && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xs space-y-6 animate-in fade-in duration-300 ring-1 ring-blue-500/20">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-base font-bold text-gray-900">Answer Evaluation Report</h4>
                <p className="text-[11px] text-gray-500">Based on objective technical rubric and expected competencies</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-right">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Score</span>
                <span className="text-xl font-extrabold text-blue-900">{currentQuestion.evaluation.score}/100</span>
              </div>
            </div>
          </div>

          {/* Rubric Breakdown */}
          {currentQuestion.evaluation.rubricBreakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-2xl text-xs">
              <div>
                <span className="text-gray-500 text-[10px] block">Technical Correctness</span>
                <span className="font-bold text-gray-800">{currentQuestion.evaluation.rubricBreakdown.technicalCorrectness} / 30</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Relevance & Completeness</span>
                <span className="font-bold text-gray-800">{currentQuestion.evaluation.rubricBreakdown.relevanceAndCompleteness} / 30</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Clarity & Structure</span>
                <span className="font-bold text-gray-800">{currentQuestion.evaluation.rubricBreakdown.clarityAndStructure} / 20</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Practical Application</span>
                <span className="font-bold text-gray-800">{currentQuestion.evaluation.rubricBreakdown.practicalApplication} / 20</span>
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Strengths</span>
              </span>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {currentQuestion.evaluation.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Improvement Areas</span>
              </span>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {currentQuestion.evaluation.weaknesses.map((weak, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Model Answer */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
              Suggested Model Answer
            </span>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap">
              {currentQuestion.evaluation.suggestedModelAnswer}
            </div>
          </div>

          {/* Better Answer Structure */}
          <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 text-xs text-gray-700 leading-relaxed">
            <span className="font-bold text-blue-900 block mb-1">
              Recommended Answer Structure:
            </span>
            {currentQuestion.evaluation.betterAnswerStructure}
          </div>

          {/* Topic-Specific Suggestions */}
          {currentQuestion.evaluation.topicSpecificSuggestions &&
            currentQuestion.evaluation.topicSpecificSuggestions.length > 0 && (
              <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 text-xs text-purple-900">
                <span className="font-bold block mb-1">Concepts to Revise:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {currentQuestion.evaluation.topicSpecificSuggestions.map((sug, i) => (
                    <li key={i}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}

          {/* Bottom Next Question CTA */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-gray-400">
              {currentIndex < questions.length - 1 ? 'Ready for next question?' : 'All questions attempted!'}
            </span>
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <span>Proceed to Question {currentIndex + 2}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishInterview}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Interview & View Final Report</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal before ending unfinished interview */}
      {confirmEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">End Practice Session?</h4>
            <p className="text-xs text-gray-500">
              You have answered {answeredCount} of {questions.length} questions. Ending now will generate your performance report with your current answers.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setConfirmEndModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Keep Practicing
              </button>
              <button
                onClick={handleFinishInterview}
                className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
              >
                Yes, Finish & Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
