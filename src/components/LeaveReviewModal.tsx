import React, { useState } from 'react';
import { X, Star, Sparkles, CheckCircle2, Lock, Globe, ShieldCheck } from 'lucide-react';
import { Salon, User } from '../types';
import { createReview } from '../lib/api';

interface LeaveReviewModalProps {
  salon: Salon;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: () => void;
  technicianId?: number | null;
  technicianName?: string;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  salon,
  currentUser,
  onClose,
  onSuccess,
  technicianId,
  technicianName,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(currentUser?.fullname || '');
  const [reviewText, setReviewText] = useState('');
  const [privateFeedback, setPrivateFeedback] = useState('');
  const [reviewAudience, setReviewAudience] = useState<'public' | 'private' | 'both'>('public');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() && !privateFeedback.trim()) return;

    setSubmitting(true);
    try {
      const fullComment =
        reviewAudience === 'private'
          ? `[Private Owner Feedback]: ${privateFeedback || reviewText}`
          : reviewAudience === 'both' && privateFeedback.trim()
          ? `${reviewText}\n\n[Private Note to Owner]: ${privateFeedback}`
          : reviewText;

      await createReview({
        user_id: currentUser?.id,
        user_name: reviewerName || currentUser?.fullname,
        salon_id: salon.id,
        technician_id: technicianId || null,
        technician_name: technicianName || undefined,
        rating,
        comment: fullComment,
      });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Submit review error:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-pink-100 p-4 sm:p-6 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-pink-100 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                <span>Service Completed</span>
              </span>
            </div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900 truncate">Leave a Review</h3>
            <p className="text-xs text-pink-700 font-semibold truncate">{salon.salon_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-gray-600 cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 sm:py-10 text-center space-y-3 overflow-y-auto flex-1 min-h-0">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-serif font-bold text-lg text-gray-900">Thank You!</h4>
            <p className="text-xs text-gray-500">
              {reviewAudience === 'private'
                ? 'Your private feedback has been sent directly to salon management.'
                : 'Your review and ratings have been successfully submitted.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0 pr-0.5">
            {technicianName && (
              <p className="rounded-xl bg-purple-50 p-2.5 text-center text-xs font-semibold text-purple-800">
                Reviewing specialist: {technicianName}
              </p>
            )}

            {/* Audience Type: Public vs Private Review */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Review Visibility
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setReviewAudience('public')}
                  className={`p-2 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    reviewAudience === 'public'
                      ? 'bg-pink-50 border-pink-500 text-pink-900 ring-1 ring-pink-400'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-pink-600" />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAudience('private')}
                  className={`p-2 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    reviewAudience === 'private'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-400'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Private</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAudience('both')}
                  className={`p-2 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    reviewAudience === 'both'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-400'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Both</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {reviewAudience === 'public' && 'Public review visible on salon listing for all clients.'}
                {reviewAudience === 'private' && 'Private feedback sent exclusively to the salon owner.'}
                {reviewAudience === 'both' && 'Submit a public rating plus private notes for the owner.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 text-center">
                Overall Rating
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Sophia Rodriguez"
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                required
              />
            </div>

            {(reviewAudience === 'public' || reviewAudience === 'both') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Public Review Comments
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe your treatment, technician cleanliness, retention, and experience..."
                  className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                  required={reviewAudience === 'public'}
                />
              </div>
            )}

            {(reviewAudience === 'private' || reviewAudience === 'both') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-900">
                    Private Feedback to Salon Owner
                  </label>
                  <span className="text-[10px] text-purple-700 font-semibold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Confidential
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={privateFeedback}
                  onChange={(e) => setPrivateFeedback(e.target.value)}
                  placeholder="Share direct confidential suggestions, service critiques, or private notes for management..."
                  className="w-full p-3 rounded-xl border border-purple-200 bg-purple-50/30 text-xs focus:outline-purple-500"
                  required={reviewAudience === 'private'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (!reviewText.trim() && !privateFeedback.trim())}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-pink-500/20 cursor-pointer transition-all"
            >
              {submitting ? 'Submitting Review...' : reviewAudience === 'private' ? 'Submit Private Feedback' : 'Post Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

