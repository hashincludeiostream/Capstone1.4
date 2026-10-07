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
  const [reviewType, setReviewType] = useState<'public' | 'private'>('public');
  const [reviewText, setReviewText] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [showPrivateNoteField, setShowPrivateNoteField] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isPrivate = reviewType === 'private';

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
        technician_name: technicianName || undefined,
        rating,
        comment: reviewText,
        is_private: isPrivate,
        feedback_type: isPrivate ? 'private' : privateNote.trim() ? 'both' : 'public',
        private_feedback: isPrivate ? reviewText : privateNote.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Submit review error:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-pink-100 p-4 sm:p-6 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-pink-100 shrink-0">
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900 truncate">
              {isPrivate ? 'Submit Private Feedback' : 'Leave a Service Review'}
            </h3>
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
            <h4 className="font-serif font-bold text-lg text-gray-900">
              {isPrivate ? 'Confidential Feedback Received!' : 'Thank You!'}
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {isPrivate
                ? 'Your feedback has been confidentially delivered to the salon owner & management.'
                : 'Your review and ratings have been successfully published on the salon portal.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0 pr-0.5">
            {technicianName && (
              <p className="rounded-xl bg-purple-50 p-2 text-center text-xs font-semibold text-purple-800">
                Staff specialist: <span className="font-bold">{technicianName}</span>
              </p>
            )}

            {/* Review Privacy Selector (Objective 2: Public vs Private reviews) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Review Visibility & Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewType('public')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                    reviewType === 'public'
                      ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20'
                      : 'border-gray-200 hover:border-pink-200'
                  }`}
                >
                  <Globe className={`w-4 h-4 shrink-0 mt-0.5 ${reviewType === 'public' ? 'text-pink-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Public Review</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Visible to all visitors on the salon page</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewType('private')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                    reviewType === 'private'
                      ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <Lock className={`w-4 h-4 shrink-0 mt-0.5 ${reviewType === 'private' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Private Feedback</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Confidential to salon owner & manager only</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 text-center">
                {isPrivate ? 'Service Satisfaction Rating' : 'Overall Public Rating'}
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
                      className={`w-7 h-7 sm:w-8 sm:h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Name */}
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

            {/* Review or Private Feedback Body */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                {isPrivate ? 'Confidential Feedback & Observations' : 'Public Review Comments'}
              </label>
              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={
                  isPrivate
                    ? 'Share candid feedback, cleanliness suggestions, or staff notes directly with the salon manager...'
                    : 'Describe your treatment, technician cleanliness, nail retention, and salon experience...'
                }
                className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                required
              />
            </div>

            {/* Optional Private Note for Management when submitting Public review */}
            {!isPrivate && (
              <div className="border border-purple-100 rounded-xl p-2.5 bg-purple-50/30">
                {!showPrivateNoteField ? (
                  <button
                    type="button"
                    onClick={() => setShowPrivateNoteField(true)}
                    className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    <span>+ Add an optional private note for salon management</span>
                  </button>
                ) : (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-purple-600" />
                        Confidential Note for Salon Owner (won't be public)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPrivateNote('');
                          setShowPrivateNoteField(false);
                        }}
                        className="text-[10px] text-gray-400 hover:text-gray-600"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={privateNote}
                      onChange={(e) => setPrivateNote(e.target.value)}
                      placeholder="Share constructive private tips or internal suggestions with management..."
                      className="w-full p-2.5 rounded-lg border border-purple-200 bg-white text-xs focus:outline-purple-500"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !reviewText.trim()}
              className={`w-full py-2.5 rounded-xl disabled:opacity-50 text-white text-xs font-semibold shadow-md cursor-pointer transition-all ${
                isPrivate
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-purple-600/20'
                  : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-pink-500/20'
              }`}
            >
              {submitting
                ? 'Submitting...'
                : isPrivate
                ? 'Submit Private Feedback to Management'
                : 'Post Public Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
