import React, { useState } from 'react';
import { X, Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('general');
  const [comments, setComments] = useState<string>('');
  const [featureRequest, setFeatureRequest] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    setLoading(true);
    try {
      await api.submitFeedback({
        rating,
        category,
        comments,
        featureRequest: featureRequest.trim() || undefined,
      });
      setSubmitted(true);
      showToast('Thank you for your valuable feedback!', 'success');
      setTimeout(() => {
        setSubmitted(false);
        setComments('');
        setFeatureRequest('');
        onClose();
      }, 1500);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit feedback.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Feedback Submitted!</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Thank you for helping us improve InterVue. The engineering team reviews all comments directly.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4]"></span>
                <h3 className="text-lg font-bold text-gray-900">Share Your Platform Feedback</h3>
              </div>
              <p className="text-xs text-gray-500">
                Help TEAM NEW enhance InterVue's question accuracy, evaluation rubric, and user experience.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Overall Experience Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-medium text-gray-500 ml-2">
                    {rating === 5 ? 'Exceptional' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Needs Work'}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Feedback Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="general">General Experience</option>
                  <option value="question_quality">Question Relevance & Quality</option>
                  <option value="evaluation_feedback">Answer Scoring & Feedback Rubric</option>
                  <option value="ui_ux">User Interface & Audio Recording</option>
                  <option value="bug">Bug Report / Unexpected Issue</option>
                  <option value="feature_request">Feature Request / Suggestion</option>
                </select>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Your Comments <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us what worked well or what felt unclear..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Optional Feature Request */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Wishlist Feature (Optional)
                </label>
                <input
                  type="text"
                  value={featureRequest}
                  onChange={(e) => setFeatureRequest(e.target.value)}
                  placeholder="e.g. System design diagramming, LeetCode sync, timed mode"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !comments.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
