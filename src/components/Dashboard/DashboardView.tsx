import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  PlayCircle,
  Briefcase,
  BarChart3,
  History,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  ChevronRight,
  ShieldCheck,
  Check,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ResumeUploadSection } from '../ResumeUpload/ResumeUploadSection';
import { JobDescriptionSection } from '../JobDescription/JobDescriptionSection';
import { api } from '../../services/api';
import { InterviewSession, UserAnalytics } from '../../types';

interface DashboardViewProps {
  onNavigateTab: (tab: string, sessionId?: string) => void;
  openAuthModal: () => void;
  openFeedbackModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  openAuthModal,
  openFeedbackModal,
}) => {
  const { user, activeResume } = useAuth();
  const [recentSessions, setRecentSessions] = useState<InterviewSession[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loadingExtras, setLoadingExtras] = useState(false);

  useEffect(() => {
    if (user && activeResume) {
      loadExtras();
    }
  }, [user, activeResume]);

  const loadExtras = async () => {
    setLoadingExtras(true);
    try {
      const [sessionsRes, analyticsRes] = await Promise.all([
        api.getInterviews(),
        api.getAnalytics(activeResume?.id),
      ]);
      setRecentSessions(sessionsRes.sessions.slice(0, 3));
      setAnalytics(analyticsRes.analytics);
    } catch {
      // Ignored
    } finally {
      setLoadingExtras(false);
    }
  };

  // ----------------------------------------------------
  // CRITICAL EMPTY STATE REQUIREMENT:
  // Before the user uploads a resume, display ONLY the welcome screen,
  // resume upload area, and brief instructions.
  // ----------------------------------------------------
  if (!activeResume) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Welcome Hero Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-xs relative overflow-hidden">
          {/* Subtle Google Colors background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-50/70 blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-50/70 blur-2xl pointer-events-none"></div>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-[#4285F4]"></span>
              <span>InterVue Preparation Engine</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {user ? `Welcome, ${user.name || user.email.split('@')[0]}!` : 'Welcome to InterVue'}
              <br />
              <span className="text-blue-600">Your Resume. Your Skills. Your Interview.</span>
            </h1>

            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
              InterVue analyzes your actual resume, extracts your core technical and project topics, and generates progressive mock interviews. Get instant evaluation on technical correctness, clarity, and practical applications.
            </p>

            {/* Brief Instructions */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs space-y-1">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  Upload Resume
                </span>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Provide your PDF, DOCX, or text resume to extract skills and project evidence.
                </p>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs space-y-1">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  Select Topics
                </span>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Choose specific programming languages, system design, or projects to practice.
                </p>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs space-y-1">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  Practice & Score
                </span>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Answer questions with speech or text and receive transparent AI evaluation rubrics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Upload Area */}
        <ResumeUploadSection
          onStartPractice={() => onNavigateTab('practice')}
          openAuthModal={openAuthModal}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // RESUME LOADED STATE: Full Central Workspace
  // ----------------------------------------------------
  const selectedTopicsCount = activeResume.topics.filter((t) => t.selected).length;
  const hasAnalyticsData = analytics && analytics.totalQuestionsAnswered > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner with Active Resume Profile */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]"></span>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
              Resume Analysis Active
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Hello, {activeResume.parsedSummary.fullName || user?.name || 'Candidate'}!
          </h2>

          <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
            Your resume has been analyzed. InterVue mapped{' '}
            <strong className="text-gray-900">{activeResume.topics.length} interview topics</strong> from your projects and skills.
          </p>
        </div>

        {/* Quick Start Practice CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('resume')}
            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Layers className="w-4 h-4 text-gray-500" />
            <span>Manage Topics ({selectedTopicsCount})</span>
          </button>

          <button
            onClick={() => onNavigateTab('practice')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch Mock Interview</span>
          </button>
        </div>
      </div>

      {/* Primary Workspace Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topic Practice & Overall Practice Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Launch Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Topic-Based Interview Card */}
            <div
              onClick={() => onNavigateTab('practice')}
              className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform shadow-2xs">
                  <Layers className="w-6 h-6" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  Targeted Drill
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Topic-Based Interview
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Drill questions exclusively focused on your selected {selectedTopicsCount} topics from your resume.
                </p>
              </div>

              <div className="pt-2 flex items-center text-xs font-bold text-blue-600 gap-1">
                <span>Start Practice</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. Overall Mock Interview Card */}
            <div
              onClick={() => onNavigateTab('practice')}
              className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-green-500 hover:shadow-xs transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-2xl bg-green-50 text-green-600 group-hover:scale-110 transition-transform shadow-2xs">
                  <Award className="w-6 h-6" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                  Full Simulation
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  Overall Mock Interview
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Comprehensive mock interview blending introduction, technical core, project follow-ups, and behavioral questions.
                </p>
              </div>

              <div className="pt-2 flex items-center text-xs font-bold text-green-600 gap-1">
                <span>Start Practice</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Extracted Topics Preview Widget */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Extracted Interview Topics</h3>
                <p className="text-[11px] text-gray-400">
                  {selectedTopicsCount} selected for your next practice
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('resume')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>Edit Selections</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeResume.topics.slice(0, 8).map((topic) => (
                <span
                  key={topic.id}
                  onClick={() => onNavigateTab('resume')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                    topic.selected
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 font-semibold'
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}
                >
                  {topic.selected && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                  <span>{topic.name}</span>
                </span>
              ))}
              {activeResume.topics.length > 8 && (
                <button
                  onClick={() => onNavigateTab('resume')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100"
                >
                  +{activeResume.topics.length - 8} more
                </button>
              )}
            </div>
          </div>

          {/* Job Description Matching Widget (Optional) */}
          <JobDescriptionSection
            onStartJobInterview={() => onNavigateTab('practice')}
          />
        </div>

        {/* Right Column: Performance Snapshot & Recent Sessions */}
        <div className="space-y-6">
          {/* Performance Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Performance Snapshot</h3>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                View Full
              </button>
            </div>

            {hasAnalyticsData ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Average Score
                  </span>
                  <div className="text-3xl font-extrabold text-gray-900 mt-1">
                    {analytics.averageScore}
                    <span className="text-sm text-gray-400 font-semibold">/100</span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {analytics.totalQuestionsAnswered} questions evaluated
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Completion Rate</span>
                    <span className="font-bold text-gray-900">{analytics.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${analytics.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-gray-400 italic">
                  No completed interviews yet. Your scores will appear after your first session!
                </p>
                <button
                  onClick={() => onNavigateTab('practice')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Start practice now →
                </button>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Recent Sessions</h3>
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                All History
              </button>
            </div>

            {recentSessions.length > 0 ? (
              <div className="space-y-2.5">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onNavigateTab('practice', s.id)}
                    className="p-3 bg-gray-50 hover:bg-blue-50/40 rounded-2xl border border-gray-100 hover:border-blue-200 cursor-pointer transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">
                        {s.type === 'topic_based' ? 'Topic-Based' : 'Overall Mock'}
                      </span>
                      {s.status === 'completed' ? (
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                          {s.overallScore || 0}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          In Progress
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {new Date(s.startedAt).toLocaleDateString()} • {s.selectedTopics.length} topics
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-4">
                No past sessions recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
