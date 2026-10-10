import React from 'react';
import {
  FileText,
  PlayCircle,
  BarChart3,
  History,
  User as UserIcon,
  Home,
  MessageSquare,
  ShieldCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
  openFeedbackModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  openFeedbackModal,
}) => {
  const { user, firebaseUser, logout, activeResume } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'practice', label: 'Practice', icon: PlayCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left group focus:outline-hidden"
            >
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-100 group-hover:border-blue-200 transition-colors shadow-2xs">
                {/* Google 4-Color Dots Mark */}
                <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FBBC05]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                    InterVue
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-100/80">
                    PRO
                  </span>
                </div>
                <p className="hidden md:block text-[11px] text-gray-500 font-medium tracking-tight">
                  Your Resume. Your Skills. Your Interview.
                </p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'text-blue-600 bg-blue-50/80 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Resume Indicator (if any) */}
            {user && activeResume && (
              <button
                onClick={() => setActiveTab('resume')}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/70 rounded-lg text-xs font-medium text-gray-700 transition-all max-w-[200px]"
                title={`Active Resume: ${activeResume.fileName}`}
              >
                <div className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse"></div>
                <span className="truncate">{activeResume.parsedSummary.fullName || activeResume.fileName}</span>
              </button>
            )}

            {/* Feedback Button */}
            <button
              onClick={openFeedbackModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              title="Submit platform feedback"
            >
              <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* User Profile or Auth Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Firebase
                </span>

                {user.role === 'admin' && (
                  <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Admin
                  </span>
                )}

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    activeTab === 'profile'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {firebaseUser?.photoURL ? (
                    <img
                      src={firebaseUser.photoURL}
                      alt="avatar"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                  <span className="max-w-[100px] truncate">{user.name || user.email.split('@')[0]}</span>
                </button>

                <button
                  onClick={logout}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow transition-all"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
