import React, { useState } from 'react';
import { X, Star, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setSubmitting(true);
    try {
      await createReview({
        user_id: currentUser?.id,
        user_name: reviewerName || currentUser?.fullname,
        salon_id: salon.id,
        technician_id: technicianId || null,
        technician_name: technicianName || null,
        rating,
        comment: reviewText,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-pink-100 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-pink-100">
          <div>
            <h3 className="font-serif font-bold text-lg text-gray-900">Leave a Review</h3>
            <p className="text-xs text-pink-700 font-semibold">{salon.salon_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-serif font-bold text-lg text-gray-900">Thank You!</h4>
            <p className="text-xs text-gray-500">Your review has been successfully published.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {technicianName && (
              <p className="rounded-xl bg-purple-50 p-2.5 text-center text-xs font-semibold text-purple-800">
                Reviewing technician: {technicianName}
              </p>
            )}
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Review Comments
              </label>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Describe your treatment, technician cleanliness, retention, and experience..."
                className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !reviewText.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-pink-500/20 cursor-pointer transition-all"
            >
              {submitting ? 'Publishing Review...' : 'Post Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
