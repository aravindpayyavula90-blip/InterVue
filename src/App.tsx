import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ResumeUploadSection } from './components/ResumeUpload/ResumeUploadSection';
import { PracticeView } from './components/Practice/PracticeView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { HistoryView } from './components/History/HistoryView';
import { ProfileView } from './components/Profile/ProfileView';
import { AuthModal } from './components/Modals/AuthModal';
import { FeedbackModal } from './components/Modals/FeedbackModal';
import { PrivacyPolicyModal } from './components/Modals/PrivacyPolicyModal';
import { TermsModal } from './components/Modals/TermsModal';
import { ChevronLeft, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

function MainAppContent() {
  const { user, loading, toasts, removeToast } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [termsModalOpen, setTermsModalOpen] = useState<boolean>(false);

  const handleNavigateTab = (tab: string, sessionId?: string) => {
    if (sessionId) {
      setTargetSessionId(sessionId);
    } else {
      setTargetSessionId(null);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#1f2937]">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        openAuthModal={() => setAuthModalOpen(true)}
        openFeedbackModal={() => setFeedbackModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Visible Back Button on Secondary Views */}
        {activeTab !== 'dashboard' && (
          <div className="mb-6">
            <button
              onClick={() => handleNavigateTab('dashboard')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={handleNavigateTab}
            openAuthModal={() => setAuthModalOpen(true)}
            openFeedbackModal={() => setFeedbackModalOpen(true)}
          />
        )}

        {activeTab === 'resume' && (
          <div className="space-y-6">
            <ResumeUploadSection
              onStartPractice={() => handleNavigateTab('practice')}
              openAuthModal={() => setAuthModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'practice' && (
          <PracticeView
            initialSessionId={targetSessionId}
            onViewAnalytics={() => handleNavigateTab('analytics')}
            onGoToResume={() => handleNavigateTab('resume')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            onStartPractice={() => handleNavigateTab('practice')}
            onGoToResume={() => handleNavigateTab('resume')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            onOpenSession={(id) => handleNavigateTab('practice', id)}
            onStartPractice={() => handleNavigateTab('practice')}
            onGoToResume={() => handleNavigateTab('resume')}
          />
        )}

        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        openAuthModal={() => setAuthModalOpen(true)}
        isAuthenticated={!!user}
      />

      {/* Footer */}
      <Footer
        openPrivacyModal={() => setPrivacyModalOpen(true)}
        openTermsModal={() => setTermsModalOpen(true)}
        openFeedbackModal={() => setFeedbackModalOpen(true)}
        setActiveTab={handleNavigateTab}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />

      <PrivacyPolicyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />

      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />

      {/* Toast Notification Stack */}
      <div className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-lg border text-xs font-medium flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-white border-gray-200 text-gray-900 shadow-md'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
