import React from 'react';
import { X, FileCheck, CheckCircle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-green-50 text-green-600">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Terms of Service</h3>
              <p className="text-xs text-gray-500">Effective Date: October 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-4 text-xs text-gray-600 leading-relaxed pr-2">
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">1. Educational & Preparation Purpose</h4>
            <p>
              InterVue is designed to assist students and candidates in preparing for technical, behavioral, and architectural interviews. All AI-generated evaluation scores, rubrics, and model answers are formative educational estimates to help you improve, and do not constitute a guarantee of actual job offers or corporate hiring decisions.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">2. Permitted Use & User Obligations</h4>
            <p>
              Users agree to upload only legitimate resumes that reflect their own credentials or synthetic test resumes for practice. Users shall not attempt to inject prompt attacks, malicious executable code, or bypass rate limits.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">3. Intellectual Property</h4>
            <p>
              InterVue brand assets, algorithmic evaluation pipelines, and user interfaces are developed by TEAM NEW. Candidate resumes remain the sole intellectual property of their respective creators.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">4. Feedback & Contact</h4>
            <p>
              Users may submit feedback or report system anomalies directly via our built-in feedback module or by contacting{' '}
              <a href="mailto:support@intervue.app" className="text-blue-600 font-semibold hover:underline">
                support@intervue.app
              </a>.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl"
          >
            Accept Terms
          </button>
        </div>
      </div>
    </div>
  );
};
