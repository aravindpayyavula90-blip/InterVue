import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle2,
  Award,
  Layers,
  Calendar,
  AlertCircle,
  PlayCircle,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { UserAnalytics, ResumeData } from '../../types';

interface AnalyticsViewProps {
  onStartPractice: () => void;
  onGoToResume: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onStartPractice,
  onGoToResume,
}) => {
  const { user, activeResume, showToast } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [resumesList, setResumesList] = useState<ResumeData[]>([]);
  const [selectedResumeFilter, setSelectedResumeFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedResumeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resumesRes, analyticsRes] = await Promise.all([
        api.getResumes(),
        api.getAnalytics(selectedResumeFilter || undefined),
      ]);
      setResumesList(resumesRes.resumes);
      setAnalytics(analyticsRes.analytics);
    } catch (err: any) {
      showToast(err.message || 'Failed to load analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 font-medium">Calculating performance analytics...</p>
      </div>
    );
  }

  // Empty State if no sessions completed yet
  if (!analytics || analytics.totalQuestionsAnswered === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs max-w-xl mx-auto text-center space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">No Interview Analytics Yet</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            InterVue calculates real performance trends only from your actual completed interviews. Take your first practice session to unlock topic scores, difficulty comparisons, and mastery trends!
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {activeResume ? (
            <button
              onClick={onStartPractice}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Your First Mock Interview</span>
            </button>
          ) : (
            <button
              onClick={onGoToResume}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              Upload Resume to Begin
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Performance Analytics
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real performance telemetry derived from verified interview submissions.
          </p>
        </div>

        {/* Filter by Resume */}
        {resumesList.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Filter by Resume:</label>
            <select
              value={selectedResumeFilter}
              onChange={(e) => setSelectedResumeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Resumes</option>
              {resumesList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.parsedSummary.fullName || r.fileName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Average Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{analytics.averageScore}</span>
            <span className="text-xs text-gray-400 font-semibold">/ 100</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Across all evaluated answers</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Questions Answered</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{analytics.totalQuestionsAnswered}</span>
            <span className="text-xs text-gray-400 font-semibold">questions</span>
          </div>
          <p className="text-[11px] text-blue-600 font-medium">Total evaluated responses</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Completed Sessions</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{analytics.completedSessionsCount}</span>
            <span className="text-xs text-gray-400 font-semibold">/ {analytics.totalSessions}</span>
          </div>
          <p className="text-[11px] text-purple-600 font-medium">Full reports generated</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Completion Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{analytics.completionRate}%</span>
          </div>
          <p className="text-[11px] text-amber-600 font-medium">Of attempted questions finished</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend Over Time */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Score Progress Over Time</h4>
              <p className="text-[11px] text-gray-400">Session scores across successive interview attempts</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>

          <div className="h-64 w-full">
            {analytics.scoreTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.scoreTrends}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#4285F4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Complete more sessions to visualize score progression over time.
              </div>
            )}
          </div>
        </div>

        {/* Scores by Topic */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Performance by Topic</h4>
              <p className="text-[11px] text-gray-400">Average evaluation score across specific subjects</p>
            </div>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="h-64 w-full">
            {analytics.topicStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topicStats.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="topic" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="avgScore" fill="#34A853" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No topic breakdown available yet.
              </div>
            )}
          </div>
        </div>

        {/* Difficulty Breakdown (Easy, Medium, Hard) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Difficulty Competency Comparison</h4>
              <p className="text-[11px] text-gray-400">Average score grouped by question complexity</p>
            </div>
            <Target className="w-4 h-4 text-amber-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.difficultyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="avgScore" fill="#FBBC05" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strongest & Weakest Areas Summary */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Key Mastery Insights</h4>
            <p className="text-[11px] text-gray-400 mb-4">Calculated from recent question rubrics</p>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Strongest Topics</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analytics.strongestTopics.length > 0 ? (
                    analytics.strongestTopics.map((top, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white text-emerald-900 text-xs font-bold rounded-lg border border-emerald-200">
                        {top}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">Continue practicing to identify strong areas.</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Focus Improvement Areas</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analytics.weakestTopics.length > 0 ? (
                    analytics.weakestTopics.map((top, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white text-rose-900 text-xs font-bold rounded-lg border border-rose-200">
                        {top}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">No specific weak areas detected yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={onStartPractice}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Practice Weakest Topics</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
