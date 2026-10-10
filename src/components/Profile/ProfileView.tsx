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
  CheckCircle2,
  MessageSquare,
  Star,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, getStoredAuthToken } from '../../services/api';
import { FeedbackEntry } from '../../types';

export const ProfileView: React.FC = () => {
  const { user, firebaseUser, logout, showToast } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Admin feedback state
  const [adminFeedbacks, setAdminFeedbacks] = useState<FeedbackEntry[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.email.toLowerCase() === 'aravindpayyavula90@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      loadAdminFeedbacks();
    }
  }, [isAdmin]);

  const loadAdminFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const res = await api.getAdminFeedbacks();
      setAdminFeedbacks(res.feedbacks);
    } catch (err: any) {
      console.warn('Could not load admin feedbacks', err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleToggleFeedbackStatus = async (fb: FeedbackEntry) => {
    const nextStatus = fb.status === 'new' ? 'reviewed' : 'new';
    try {
      await api.updateFeedbackStatus(fb.id, nextStatus);
      setAdminFeedbacks((prev) =>
        prev.map((f) => (f.id === fb.id ? { ...f, status: nextStatus } : f))
      );
      showToast(`Feedback marked as ${nextStatus}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update feedback status.', 'error');
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
    showToast('Exporting your InterVue account data archive...', 'info');
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Profile Header */}
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
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  Admin
                </span>
              )}
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
          <span>Export All Data (JSON)</span>
        </button>
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
              <div>• <strong>User ID:</strong> <code className="text-gray-800">{user.id}</code></div>
              <div>• <strong>Storage:</strong> Cryptographically isolated database</div>
              <div>• <strong>Deletion:</strong> Hard-delete without residual retention</div>
            </div>
          </div>

          <button
            onClick={() => setDeleteModalOpen(true)}
            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 transition-colors"
          >
            Permanently Delete Account & Data
          </button>
        </div>
      </div>

      {/* Admin Feedback Portal (Visible to Admin Role or Dev Email) */}
      {isAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Platform Feedback Management (Admin Portal)
                </h3>
                <p className="text-xs text-gray-500">
                  Review student feedback, feature requests, and bug reports submitted to TEAM NEW.
                </p>
              </div>
            </div>

            <button
              onClick={loadAdminFeedbacks}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              Refresh ({adminFeedbacks.length})
            </button>
          </div>

          {loadingFeedbacks ? (
            <div className="py-10 text-center text-xs text-gray-400">Loading feedback entries...</div>
          ) : adminFeedbacks.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No feedback entries recorded yet.</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {adminFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: fb.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="font-bold text-gray-800 uppercase text-[10px] bg-white px-2 py-0.5 rounded border border-gray-200">
                        {fb.category}
                      </span>
                      <span className="text-gray-400 text-[11px]">{fb.userEmail}</span>
                    </div>

                    <button
                      onClick={() => handleToggleFeedbackStatus(fb)}
                      className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase transition-colors ${
                        fb.status === 'reviewed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800 hover:bg-green-100 hover:text-green-800'
                      }`}
                    >
                      {fb.status}
                    </button>
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap">{fb.comments}</p>
                  {fb.featureRequest && (
                    <div className="text-blue-700 bg-blue-50/70 p-2 rounded-lg font-medium text-[11px]">
                      <strong>Wishlist Feature:</strong> {fb.featureRequest}
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400 block">
                    {new Date(fb.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
