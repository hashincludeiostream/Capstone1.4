import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Link as LinkIcon,
  Trash2,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import {
  optimizeProfileImage,
  validateImageFile,
  getInitials,
  PRESET_AVATARS,
} from '../../lib/imageUpload';

interface ProfileImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  userName?: string;
  onSelectAvatar: (avatarUrl: string) => void | Promise<void>;
  title?: string;
}

export const ProfileImageUploadModal: React.FC<ProfileImageUploadModalProps> = ({
  isOpen,
  onClose,
  currentAvatar = '',
  userName = 'User',
  onSelectAvatar,
  title = 'Update Profile Photo',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatar);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      setProcessing(true);
      const optimizedDataUrl = await optimizeProfileImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        mimeType: 'image/jpeg',
      });
      setPreviewUrl(optimizedDataUrl);
    } catch (err: any) {
      console.error('Error processing profile image:', err);
      setError(err?.message || 'Failed to process image. Please try another file.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // Reset file input so selecting the same file again triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleApplyUrl = () => {
    setError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Please enter a valid image URL');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setError('URL must begin with http:// or https://');
      return;
    }
    setPreviewUrl(trimmed);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSelectAvatar(previewUrl);
      onClose();
    } catch (err: any) {
      console.error('Error saving avatar:', err);
      setError(err?.message || 'Failed to save profile photo');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    setUrlInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-pink-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-purple-900 via-pink-900 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Camera className="w-4 h-4 text-pink-200" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">{title}</h3>
              <p className="text-xs text-pink-200/80">Customize your avatar across Nail Glam Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-pink-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Avatar Preview Box */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-gradient-to-br from-pink-50/60 to-purple-50/60 border border-pink-100">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-pink-600 via-rose-600 to-purple-700 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={userName}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setError('Failed to load image preview. Please check the URL or select another file.');
                    }}
                  />
                ) : (
                  <span className="text-white text-2xl font-bold tracking-wider">
                    {getInitials(userName)}
                  </span>
                )}
              </div>
              {processing && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <p className="text-sm font-bold text-gray-900">
                {previewUrl ? 'Custom Photo Selected' : 'Default Initials Avatar'}
              </p>
              <p className="text-xs text-gray-500">
                {previewUrl
                  ? 'Your profile picture will be displayed on salons, appointments, and reviews.'
                  : `Showing personalized initials "${getInitials(userName)}" based on your name.`}
              </p>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium pt-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove photo (revert to initials)</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-600" />
              <span>Beauty Presets</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
          </div>

          {/* TAB 1: Upload from Device */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-pink-500 bg-pink-50/50 scale-[1.01]'
                    : 'border-gray-200 hover:border-pink-400 hover:bg-pink-50/30'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Click to select photo or drag and drop here
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports PNG, JPG, WebP, GIF (Max 12MB, auto-compressed to crisp avatar)
                </p>
                <button
                  type="button"
                  className="mt-3 px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                >
                  Choose From Computer / Phone
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Beauty Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Choose one of our curated salon artist & beauty specialist avatars:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = previewUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPreviewUrl(preset.url);
                        setError(null);
                      }}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-pink-600 ring-2 ring-pink-500/30 scale-105'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-pink-600/30 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Image URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Image Web Address
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/... or your hosted photo"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-pink-600 focus:border-pink-600"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Preview
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Enter any direct HTTPS image link to use as your profile avatar.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || processing}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || processing}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Photo...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Apply & Save Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
