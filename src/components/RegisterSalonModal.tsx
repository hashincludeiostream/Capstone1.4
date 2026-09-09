import React, { useState } from 'react';
import { X, Store, Sparkles, MapPin, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Salon, User, BusinessCategory } from '../types';
import { API_BASE } from '../lib/api';

interface RegisterSalonModalProps {
  currentUser: User | null;
  categories: BusinessCategory[];
  onClose: () => void;
  onSuccess: (salon: Salon) => void;
}

export const RegisterSalonModal: React.FC<RegisterSalonModalProps> = ({
  currentUser,
  categories,
  onClose,
  onSuccess,
}) => {
  const [salonName, setSalonName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [logoUrl, setLogoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.user_type !== 'salon_owner' || !salonName || !address) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/salons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: currentUser.id,
          salon_name: salonName,
          address,
          phone,
          email,
          description,
          logo: logoUrl,
          category_id: categoryId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDone(true);
        setTimeout(() => {
          onSuccess(data.salon || data);
          onClose();
        }, 1500);
      } else {
        const errorData = await res.json();
        console.error('Register salon error:', errorData);
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Register salon error:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-pink-100 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900">List Your Salon</h3>
              <p className="text-xs text-gray-500">Join our verified beauty network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-serif font-bold text-lg text-gray-900">Salon Registered!</h4>
            <p className="text-xs text-gray-500">Your studio is now live on the marketplace.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Salon Business Name
              </label>
              <input
                type="text"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder="e.g. Celestial Nail Haven"
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0917-xxx-xxxx"
                  className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Studio Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Bonifacio High Street, Taguig City"
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Branch Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="branch@salon.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Bio & Specialties
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Highlight your signature techniques, hygiene protocols, and atmosphere..."
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !salonName || !address}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-500/20 cursor-pointer transition-all"
            >
              {submitting ? 'Registering...' : 'Complete Studio Onboarding'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
