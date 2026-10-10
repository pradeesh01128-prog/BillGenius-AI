import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  MessageSquareHeart,
  Star,
  ThumbsUp,
  Smile,
  Frown,
  Meh,
  Tag,
  Search,
  Filter,
  User,
} from 'lucide-react';

export const CustomerFeedbackView: React.FC = () => {
  const { customerFeedbacks, feedbacks, currentBranch } = useStore();
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  const safeFeedbacks = customerFeedbacks || feedbacks || [];

  const filtered = safeFeedbacks.filter(f => {
    const matchesRating = filterRating === 'all' || f.rating === filterRating;
    const matchesSearch =
      (f.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.comments || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesRating && matchesSearch;
  });

  const avgRating =
    safeFeedbacks.length > 0
      ? (
          safeFeedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) /
          safeFeedbacks.length
        ).toFixed(1)
      : '5.0';

  const positiveCount = safeFeedbacks.filter(f => f.sentiment === 'positive').length;
  const neutralCount = safeFeedbacks.filter(f => f.sentiment === 'neutral').length;
  const negativeCount = safeFeedbacks.filter(f => f.sentiment === 'negative').length;

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Overall CSAT Score</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-black text-slate-900 dark:text-white">{avgRating}</p>
            <div className="flex text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            From {customerFeedbacks.length} verified ratings
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Positive Sentiment</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-black text-emerald-600">
              {((positiveCount / Math.max(1, customerFeedbacks.length)) * 100).toFixed(0)}%
            </p>
            <Smile className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {positiveCount} happy shoppers
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Neutral Reviews</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-black text-slate-700 dark:text-slate-300">
              {neutralCount}
            </p>
            <Meh className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-400">Acceptable experience</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Attention Required</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-black text-rose-600">{negativeCount}</p>
            <Frown className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-[11px] text-rose-500 font-medium">Flagged feedback</span>
        </div>
      </div>

      {/* Main Feedback List */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Customer Reviews & Sentiments
              </h3>
              <p className="text-xs text-slate-400">Post-purchase verified feedback</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search reviews..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            <select
              value={filterRating}
              onChange={e =>
                setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium"
            >
              <option value="all">All Stars</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 Star)</option>
              <option value="4">⭐⭐⭐⭐ (4 Star)</option>
              <option value="3">⭐⭐⭐ (3 Star)</option>
              <option value="2">⭐⭐ (2 Star)</option>
              <option value="1">⭐ (1 Star)</option>
            </select>
          </div>
        </div>

        {/* Reviews Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(fb => (
            <div
              key={fb.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {fb.customerName}
                    </span>
                    <span className="text-[10px] text-slate-400">Inv #{fb.invoiceId}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < fb.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    fb.sentiment === 'positive'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : fb.sentiment === 'neutral'
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      : 'bg-rose-500/10 text-rose-600'
                  }`}
                >
                  {fb.sentiment}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                "{fb.comments}"
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {fb.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <div className="text-[10px] text-slate-400 text-right">
                {new Date(fb.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
