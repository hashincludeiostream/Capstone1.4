import React, { useState } from 'react';
import { X, Store, MapPin, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Salon, User, BusinessCategory } from '../types';
import { API_BASE } from '../lib/api';

interface BranchRegistrationModalProps {
  currentUser: User;
  categories: BusinessCategory[];
  onClose: () => void;
  onSuccess: (salon: Salon) => void;
}

export const BranchRegistrationModal: React.FC<BranchRegistrationModalProps> = ({
  currentUser,
  categories,
  onClose,
  onSuccess,
}) => {
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(currentUser.email);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!branchName.trim() || !address.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/salons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: currentUser.id,
          salon_name: branchName.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          description: description.trim(),
          category_id: categoryId,
        }),
      });

      const responseText = await response.text();
      let data: { error?: string; details?: string; salon?: Salon; id?: number } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        setError('The server returned an invalid response. Please make sure the application server is running.');
        return;
      }

      if (!response.ok) {
        setError(data.error || data.details || `Unable to register branch (${response.status})`);
        return;
      }

      const createdSalon = data.salon || (data.id ? data as Salon : null);
      if (!createdSalon) {
        setError('The branch was not returned by the server. Please try again.');
        return;
      }

      setDone(true);
      window.setTimeout(() => {
        onSuccess(createdSalon);
        onClose();
      }, 900);
    } catch (submissionError) {
      console.error('Branch registration error:', submissionError);
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-purple-100 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900">Register a New Branch</h3>
              <p className="text-xs text-gray-500">Add another salon location under your owner account</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-gray-600 cursor-pointer" aria-label="Close branch registration">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-serif font-bold text-lg text-gray-900">Branch Registered</h4>
            <p className="text-xs text-gray-500">The new branch is now linked to your owner account for management.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Branch Name</label>
              <input value={branchName} onChange={(event) => setBranchName(event.target.value)} placeholder="e.g. Nail Glam Hub - BGC Branch" className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/20 text-xs" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Category</label>
                <select value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value))} className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/20 text-xs">
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.category_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Branch Phone</label>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0917-xxx-xxxx" className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/20 text-xs" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1"><MapPin className="inline w-3.5 h-3.5 mr-1" />Branch Address</label>
              <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="e.g. High Street, Taguig City" className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/20 text-xs" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1"><Mail className="inline w-3.5 h-3.5 mr-1" />Branch Email</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/20 text-xs" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1"><FileText className="inline w-3.5 h-3.5 mr-1" />Branch Description</label>
              <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe this branch location and its services" className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/20 text-xs" />
            </div>
            <button type="submit" disabled={submitting || !branchName.trim() || !address.trim()} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer">
              {submitting ? 'Registering Branch...' : 'Register Branch Under My Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
