import React from 'react';
import { X, Shield, Lock, EyeOff, Trash2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Privacy Policy</h3>
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
            <h4 className="font-semibold text-gray-900 text-sm mb-1">1. Respecting Student Data Privacy</h4>
            <p>
              InterVue (“we”, “our”, or “platform”) is engineered with student security and data privacy as foundational tenets. We believe your resume, employment history, and interview answers are confidential assets.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">2. Information We Collect</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> Email address and salted, hashed passwords (we never see or store plain-text passwords).</li>
              <li><strong>Resume Content:</strong> Uploaded PDF/DOCX documents and pasted resume texts used strictly to extract technical skills and generate personalized questions.</li>
              <li><strong>Interview Interactions:</strong> Submitted answers, speech transcripts, generated scores, and model feedback to power your personal analytics dashboard.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">3. Strict Data Isolation</h4>
            <p>
              Every resume, practice session, answer, and feedback report is cryptographically associated with your unique account. We enforce authorization at the database level so other platform users cannot access your documents or practice history.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">4. No Data Monetization</h4>
            <p>
              We do not sell, rent, or trade your personal data, resumes, or interview recordings to third-party recruiters, advertisers, or data brokers.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">5. Right to Erasure & Data Export</h4>
            <p>
              You maintain complete ownership of your data. You may download an export of all your resumes, sessions, and question histories anytime via Account Settings, or execute permanent deletion of your account and records in a single click.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">6. Contact Inquiries</h4>
            <p>
              For security or privacy inquiries, contact our development team at{' '}
              <a href="mailto:aravindpayyavula90@gmail.com" className="text-blue-600 font-semibold hover:underline">
                aravindpayyavula90@gmail.com
              </a>.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
