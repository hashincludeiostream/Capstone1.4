import React, { useState, useRef } from 'react';
import { X, User, Camera, Save, ArrowRight, Upload, RefreshCw, Sparkles } from 'lucide-react';
import { processImageFile, PRESET_AVATARS } from '../utils/imageUploadHelper';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: { avatar?: string; fullname?: string; phone?: string }) => void;
  onSkip: () => void;
  currentUser: any;
}

export default function ProfileCustomizationModal({
  isOpen,
  onClose,
  onSave,
  onSkip,
  currentUser,
}: ProfileCustomizationModalProps) {
  const [fullname, setFullname] = useState(currentUser?.fullname || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFile = async (file: File) => {
    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const dataUrl = await processImageFile(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
      });
      setAvatarUrl(dataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process image file');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleSave = async () => {
    if (phone.trim()) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        setErrorMsg('Phone number must have strictly 11 numbers (e.g. 09171234567).');
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const cleanPhone = phone.trim() ? phone.replace(/\D/g, '') : '';
      await onSave({ avatar: avatarUrl, fullname: fullname.trim(), phone: cleanPhone });
      onClose();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setErrorMsg(error.message || 'Failed to save profile changes');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  const presetList =
    currentUser?.user_type === 'salon_owner'
      ? PRESET_AVATARS.salon_owner
      : currentUser?.user_type === 'admin'
      ? PRESET_AVATARS.admin
      : PRESET_AVATARS.customer;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-pink-100 flex flex-col max-h-[92vh] my-auto">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          className="hidden"
        />

        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 p-4 sm:p-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <User className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold truncate">Customize Your Profile</h2>
                <p className="text-pink-100 text-[11px] sm:text-xs truncate">Set your photo & contact details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-2">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload profile photo"
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-pink-400" />
                )}

                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold">
                  <Upload className="w-4 h-4 mb-0.5" />
                  <span>Upload</span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                title="Choose image file"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-pink-600 hover:text-pink-800 hover:underline cursor-pointer"
              >
                Upload from Device
              </button>
              {avatarUrl && (
                <>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Preset Avatars */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-500" />
              <span>Or pick an instant avatar:</span>
            </span>
            <div className="flex items-center gap-2.5 overflow-x-auto py-1">
              {presetList.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    avatarUrl === url
                      ? 'border-pink-600 ring-2 ring-pink-300 scale-105'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all text-sm outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">
                  Phone Number (11 Digits)
                </label>
                <span
                  className={`text-[11px] font-semibold transition-colors ${
                    phone.replace(/\D/g, '').length === 11
                      ? 'text-emerald-700'
                      : phone.replace(/\D/g, '').length > 0
                      ? 'text-amber-700'
                      : 'text-gray-400'
                  }`}
                >
                  {phone.replace(/\D/g, '').length}/11 digits {phone.replace(/\D/g, '').length === 11 ? '✓' : ''}
                </span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={phone}
                onChange={(e) => {
                  const strictlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setPhone(strictlyNumbers);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="09171234567"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm outline-none font-mono tracking-wider transition-all ${
                  phone && phone.replace(/\D/g, '').length !== 11
                    ? 'border-amber-400 bg-amber-50/20 focus:border-amber-500'
                    : 'border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100'
                }`}
              />
              {phone && phone.replace(/\D/g, '').length !== 11 && (
                <p className="text-[11px] text-amber-700 mt-1 font-medium">
                  Phone number must have strictly 11 numbers (currently {phone.replace(/\D/g, '').length}).
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Profile Image URL (Optional)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2.5 shrink-0">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Skip for Now</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading || uploadingImage}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-pink-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
