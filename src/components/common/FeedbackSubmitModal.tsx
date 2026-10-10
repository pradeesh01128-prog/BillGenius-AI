import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Bill } from '../../types';
import { Star, X, CheckCircle2, MessageSquare, ThumbsUp, Send } from 'lucide-react';

interface FeedbackSubmitModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackSubmitModal: React.FC<FeedbackSubmitModalProps> = ({
  bill,
  isOpen,
  onClose,
}) => {
  const { submitFeedback } = useStore();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Speedy Service', 'Fresh Items']);
  const [submitted, setSubmitted] = useState(false);

  const availableTags = [
    'Speedy Service',
    'Fresh Produce',
    'Clean Store',
    'Friendly Staff',
    'Great Prices',
    'Easy Payment',
    'Long Queue',
    'Stock Missing',
  ];

  if (!isOpen || !bill) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback({
      invoiceId: bill.invoiceNumber,
      customerName: bill.customerName || 'Walk-in Customer',
      customerPhone: bill.customerPhone || 'N/A',
      rating,
      comments: comments || (rating >= 4 ? 'Great shopping experience!' : 'Could be improved.'),
      tags: selectedTags,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Customer Feedback Form
              </h3>
              <p className="text-[11px] text-slate-400">Invoice: {bill.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              Thank You for Your Feedback!
            </h4>
            <p className="text-xs text-slate-500">
              Your review has been recorded and synced to the store management dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Star selector */}
            <div className="text-center space-y-1.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                How was your shopping experience today?
              </p>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                {rating === 5
                  ? '⭐⭐⭐⭐⭐ Outstanding!'
                  : rating === 4
                  ? '⭐⭐⭐⭐ Very Good'
                  : rating === 3
                  ? '⭐⭐⭐ Average'
                  : rating === 2
                  ? '⭐⭐ Needs Improvement'
                  : '⭐ Poor Experience'}
              </span>
            </div>

            {/* Quick tags */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Feedback Highlights
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments textarea */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Additional Comments & Suggestions
              </label>
              <textarea
                id="feedback-comments-textarea"
                rows={3}
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Tell us what you loved or how we can improve..."
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              id="submit-feedback-button"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md hover:bg-teal-700 transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
