import React from 'react';
import { Mail, Sparkles, Heart } from 'lucide-react';

interface FooterProps {
  openPrivacyModal: () => void;
  openTermsModal: () => void;
  openFeedbackModal: () => void;
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  openPrivacyModal,
  openTermsModal,
  openFeedbackModal,
  setActiveTab,
}) => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16 pb-20 md:pb-8 text-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="w-2 h-2 rounded-full bg-[#4285F4]"></span>
                <span className="w-2 h-2 rounded-full bg-[#EA4335]"></span>
                <span className="w-2 h-2 rounded-full bg-[#FBBC05]"></span>
                <span className="w-2 h-2 rounded-full bg-[#34A853]"></span>
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">InterVue</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              “Your Resume. Your Skills. Your Interview.”
            </p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-md">
              A specialized platform that analyzes student resumes, maps core technical and behavioral competencies, delivers progressive difficulty mock interviews, evaluates answers with transparent rubrics, and tracks mastery over time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('resume')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Resume Topics
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Mock Interview Practice
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Performance Analytics
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('history')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Session History
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Contact & Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="mailto:aravindpayyavula90@gmail.com"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>aravindpayyavula90@gmail.com</span>
                </a>
              </li>
              <li>
                <button
                  onClick={openFeedbackModal}
                  className="hover:text-blue-600 transition-colors"
                >
                  Submit Feedback
                </button>
              </li>
              <li>
                <button
                  onClick={openPrivacyModal}
                  className="hover:text-blue-600 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={openTermsModal}
                  className="hover:text-blue-600 transition-colors"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider & Credits */}
        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <p>© {new Date().getFullYear()} InterVue. All rights reserved.</p>
          <div className="flex items-center gap-1.5 font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-full border border-gray-200/80">
            <span>Developed by TEAM NEW</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
