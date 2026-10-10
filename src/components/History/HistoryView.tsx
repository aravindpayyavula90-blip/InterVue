import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  Clock,
  Award,
  PlayCircle,
  Trash2,
  ExternalLink,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { InterviewSession } from '../../types';

import { Sparkles, Lock } from 'lucide-react';

interface HistoryViewProps {
  onOpenSession: (sessionId: string) => void;
  onStartPractice: () => void;
  onGoToResume: () => void;
  openAuthModal?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onOpenSession,
  onStartPractice,
  onGoToResume,
  openAuthModal,
}) => {
  const { user, activeResume, showToast } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setLoading(false);
      setSessions([]);
    }
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getInterviews();
      setSessions(res.sessions);
    } catch (err: any) {
      showToast(err.message || 'Failed to load interview history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this interview session?')) return;
    try {
      await api.deleteInterviewSession(id);
      showToast('Interview session removed.', 'info');
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete interview session.', 'error');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 font-medium">Loading your session history...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs max-w-xl mx-auto text-center space-y-5 animate-in fade-in duration-200 my-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Sign In to View Interview History</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            InterVue preserves your mock interview scorecards, past transcripts, and model answer comparisons securely tied to your registered candidate account.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <button
            onClick={openAuthModal}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Sign In / Create Account</span>
          </button>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs max-w-xl mx-auto text-center space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
          <History className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">No Interview History Yet</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            Once you start and complete mock interviews, your complete session logs, scorecards, and model answer reviews will appear here.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          {activeResume ? (
            <button
              onClick={onStartPractice}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start an Interview</span>
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
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <History className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Interview History ({sessions.length})
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Review your past mock interviews, open evaluation reports, or resume unfinished sessions.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'completed'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'in_progress'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            In Progress
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="space-y-3">
        {filteredSessions.map((s) => {
          const isDone = s.status === 'completed';
          const dateStr = new Date(s.startedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={s.id}
              onClick={() => onOpenSession(s.id)}
              className="bg-white p-5 rounded-3xl border border-gray-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                      isDone
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isDone ? 'Completed' : 'In Progress'}
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {s.type === 'topic_based' ? 'Topic-Based Practice' : 'Comprehensive Mock Interview'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[11px] text-gray-400">{dateStr}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {s.selectedTopics.slice(0, 5).map((top, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-md border border-gray-100"
                    >
                      {top}
                    </span>
                  ))}
                  {s.selectedTopics.length > 5 && (
                    <span className="text-[10px] text-gray-400 font-semibold self-center">
                      +{s.selectedTopics.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side Info & Actions */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                {isDone ? (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Overall Score
                    </span>
                    <span className="text-lg font-extrabold text-blue-600">
                      {s.overallScore || 0}/100
                    </span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                      Status
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                      Unfinished Drill
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSession(s.id);
                    }}
                    className="px-3.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors flex items-center gap-1"
                  >
                    <span>{isDone ? 'View Report' : 'Resume'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(s.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete session record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
