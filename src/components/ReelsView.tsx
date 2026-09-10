import React, { useState, useEffect } from 'react';
import {
  Heart,
  Bookmark,
  MessageCircle,
  Share2,
  Play,
  Sparkles,
  Send,
  Calendar,
  Eye,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Reel, Salon, User } from '../types';
import { fetchReels, toggleReelLike, toggleReelSave, addReelComment } from '../lib/api';

interface ReelsViewProps {
  currentUser: User | null;
  salons: Salon[];
  onBookLook: (salonId: number) => void;
  onOpenAuth: () => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({
  currentUser,
  salons,
  onBookLook,
  onOpenAuth,
}) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelComments, setActiveReelComments] = useState<Reel | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchReels();
      setReels(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleLike = async (reelId: number) => {
    try {
      const res = await toggleReelLike(reelId);
      setReels((prev) =>
        prev.map((r) =>
          r.id === reelId ? { ...r, likes: res.likes, is_liked: res.is_liked } : r
        )
      );
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleSave = async (reelId: number) => {
    try {
      const res = await toggleReelSave(reelId);
      setReels((prev) =>
        prev.map((r) =>
          r.id === reelId ? { ...r, saves_count: res.saves_count, is_saved: res.is_saved } : r
        )
      );
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReelComments || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await addReelComment(
        activeReelComments.id,
        commentText,
        currentUser?.fullname || 'You'
      );

      setReels((prev) =>
        prev.map((r) => {
          if (r.id === activeReelComments.id) {
            const updatedComments = [newComment, ...(r.comments || [])];
            return {
              ...r,
              comments: updatedComments,
              comments_count: r.comments_count + 1,
            };
          }
          return r;
        })
      );

      setActiveReelComments((prev) =>
        prev
          ? {
              ...prev,
              comments: [newComment, ...(prev.comments || [])],
              comments_count: prev.comments_count + 1,
            }
          : null
      );
      setCommentText('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(reels.map((reel) => reel.category).filter(Boolean))).sort()];

  const filteredReels =
    selectedCategory === 'All'
      ? reels
      : reels.filter((r) => (r.category || '').toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-pink-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Pinterest & TikTok Feed
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold">
            Trending Nail Art & Video Inspo
          </h2>
          <p className="text-sm text-pink-100/80 mt-1 max-w-xl">
            Watch viral transformations, save custom aesthetics, and book the exact look with the verified creator salons!
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-pink-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry / Reels Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading nail reels...</p>
        </div>
      ) : filteredReels.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-3xl border border-dashed border-pink-200 bg-white shadow-xs">
          <Sparkles className="w-10 h-10 text-pink-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No nail reels posted yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Video transformations and trending nail reels will appear here once published by verified studios.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReels.map((reel) => (
            <div
              key={reel.id}
              className="bg-white rounded-3xl overflow-hidden border border-pink-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Media Player / Thumbnail Container */}
              <div className="relative aspect-4/5 bg-black overflow-hidden group">
                {reel.thumbnail ? (
                  <img
                    src={reel.thumbnail}
                    alt={reel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : null}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Creator Tag */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  {reel.salon_logo ? (
                    <img
                      src={reel.salon_logo}
                      alt={reel.salon_name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : null}
                  <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                    {reel.salon_name}
                  </span>
                </div>

                {/* Category Pill */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-600/90 backdrop-blur-xs text-white">
                    {reel.category}
                  </span>
                </div>

                {/* Right Side Social Actions Toolbar */}
                <div className="absolute right-3 bottom-16 flex flex-col items-center gap-3 z-20">
                  {/* Like */}
                  <button
                    onClick={() => handleLike(reel.id)}
                    className="flex flex-col items-center group/btn cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-125 ${
                        reel.is_liked
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${reel.is_liked ? 'fill-white' : ''}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md">
                      {reel.likes}
                    </span>
                  </button>

                  {/* Comment */}
                  <button
                    onClick={() => setActiveReelComments(reel)}
                    className="flex flex-col items-center group/btn cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white backdrop-blur-md transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md">
                      {reel.comments_count}
                    </span>
                  </button>

                  {/* Save Pin */}
                  <button
                    onClick={() => handleSave(reel.id)}
                    className="flex flex-col items-center group/btn cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-125 ${
                        reel.is_saved
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/50'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Bookmark
                        className={`w-5 h-5 ${reel.is_saved ? 'fill-white' : ''}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md">
                      {reel.saves_count}
                    </span>
                  </button>
                </div>

                {/* Bottom Overlay Text */}
                <div className="absolute bottom-3 left-3 right-16 text-white">
                  <h3 className="text-sm font-bold font-serif leading-tight drop-shadow-md line-clamp-2">
                    {reel.title}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1 mt-1 font-normal drop-shadow-xs">
                    {reel.description}
                  </p>
                </div>
              </div>

              {/* Card Footer CTA */}
              <div className="p-3.5 bg-pink-50/50 flex items-center justify-between gap-2 border-t border-pink-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Eye className="w-3.5 h-3.5 text-pink-500" />
                  <span>{reel.views.toLocaleString()} views</span>
                </div>

                <button
                  onClick={() => onBookLook(reel.salon_id)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book This Look</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments Drawer / Modal */}
      {activeReelComments && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-pink-100">
            {/* Header */}
            <div className="p-4 border-b border-pink-100 flex items-center justify-between bg-pink-50/50">
              <div>
                <h4 className="font-serif font-bold text-base text-gray-900">
                  Reel Discussion & Inspo
                </h4>
                <p className="text-xs text-gray-500">{activeReelComments.title}</p>
              </div>
              <button
                onClick={() => setActiveReelComments(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {(!activeReelComments.comments || activeReelComments.comments.length === 0) ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No comments yet. Start the conversation!
                </div>
              ) : (
                activeReelComments.comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-800 font-bold flex items-center justify-center shrink-0">
                      {c.user_name[0]}
                    </div>
                    <div className="bg-pink-50/60 p-2.5 rounded-2xl rounded-tl-none border border-pink-100 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-gray-900">{c.user_name}</span>
                        <span className="text-[10px] text-gray-400">{c.created_at}</span>
                      </div>
                      <p className="text-gray-700">{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <form
              onSubmit={handleAddComment}
              className="p-3 bg-pink-50 border-t border-pink-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts on this nail style..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-pink-200 text-xs focus:outline-pink-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="p-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
