import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  Download,
  Trash2,
  ShieldCheck,
  Calendar,
  Mail,
  Loader2,
  FileText,
  PlayCircle,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, getStoredAuthToken } from '../../services/api';
import { ResumeData, InterviewSession, UserAnalytics } from '../../types';

export const ProfileView: React.FC = () => {
  const { user, firebaseUser, logout, showToast } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // User-specific personal activity counts
  const [userResumes, setUserResumes] = useState<ResumeData[]>([]);
  const [userSessions, setUserSessions] = useState<InterviewSession[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    setLoadingStats(true);
    try {
      const [resumesRes, sessionsRes, analyticsRes] = await Promise.all([
        api.getResumes().catch(() => ({ resumes: [] })),
        api.getInterviews().catch(() => ({ sessions: [] })),
        api.getAnalytics().catch(() => ({ analytics: null })),
      ]);
      setUserResumes(resumesRes.resumes || []);
      setUserSessions(sessionsRes.sessions || []);
      setUserAnalytics(analyticsRes.analytics || null);
    } catch {
      // Ignored
    } finally {
      setLoadingStats(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setUpdatingPassword(true);
    try {
      await api.updatePassword({ currentPassword, newPassword });
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleExportData = () => {
    const token = getStoredAuthToken();
    const downloadUrl = `/api/auth/export-data${token ? `?token=${token}` : ''}`;
    window.location.href = downloadUrl;
    showToast('Exporting your InterVue personal account archive...', 'info');
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      showToast('Account and all associated records permanently erased.', 'info');
      setDeleteModalOpen(false);
      logout();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account.', 'error');
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-xs text-gray-500">Please sign in to view your account profile.</p>
      </div>
    );
  }

  const completedSessions = userSessions.filter((s) => s.status === 'completed');
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) /
            completedSessions.length
        )
      : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Registered User Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold text-2xl shadow-2xs overflow-hidden">
            {firebaseUser?.photoURL ? (
              <img src={firebaseUser.photoURL} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span>{user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{user.name || 'Candidate'}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Firebase Auth
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                Registered Candidate
              </span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>{user.email}</span>
            </p>
            {firebaseUser && (
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                <span className="font-semibold text-gray-500">Firebase UID:</span>
                <code className="text-[10px] bg-gray-100 px-1 py-0.5 rounded">{firebaseUser.uid}</code>
              </p>
            )}
            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleExportData}
          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-gray-500" />
          <span>Export My Data (JSON)</span>
        </button>
      </div>

      {/* User's Own Statistics & Activity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">My Uploaded Resumes</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {loadingStats ? '-' : userResumes.length}
          </div>
          <p className="text-[11px] text-gray-400">Target technical profiles saved</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">My Mock Interviews</span>
            <PlayCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {loadingStats ? '-' : userSessions.length}
          </div>
          <p className="text-[11px] text-gray-400">
            {completedSessions.length} completed &bull; {userSessions.length - completedSessions.length} in progress
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">My Average Score</span>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {loadingStats ? '-' : avgScore !== null ? `${avgScore}%` : 'N/A'}
          </div>
          <p className="text-[11px] text-gray-400">
            {userAnalytics?.totalQuestionsAnswered || 0} questions evaluated
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Form */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Lock className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-gray-900">Security & Password</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="•••••••• (min 6 chars)"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {updatingPassword ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>

        {/* Account Data & Deletion */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
                <Trash2 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-gray-900">Privacy & Data Erasure</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              You own all your interview data. You can download an offline archive of all your resumes, sessions, and evaluations at any time, or permanently erase your account.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">Strict Data Privacy:</p>
              <p>Your resumes and mock interview records are isolated to your account and never shared with other candidates.</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Permanently Delete My Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Erase All Account Data?</h4>
            <p className="text-xs text-gray-500">
              This will permanently delete your account, uploaded resumes, generated questions, and interview scorecards. This action cannot be undone.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
              >
                Yes, Erase Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
