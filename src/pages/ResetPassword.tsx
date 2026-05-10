import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/Logo';
import { localizeAuthError, AUTH_API_BASE } from '@/lib/utils';

import { Input } from "@/components/ui/input";

const AUTH_API = `${AUTH_API_BASE}/Auth`;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, direction } = useLanguage();
  const state = (location.state as { email?: string; token?: string; otp?: string }) ?? {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(direction === 'rtl' ? 'كلمة المرور وتأكيدها غير متطابقتين.' : 'Password and confirmation do not match.');
      return;
    }
    setLoading(true);
    try {
      // يطابق شكل الـ body في الـ Swagger: { email, token, newPassword }
      const body: Record<string, string> = {
        email: state.email ?? '',
        token: state.token ?? state.otp ?? '',
        newPassword: password,
      };
      const res = await fetch(`${AUTH_API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
      if (!res.ok) {
        const rawMsg = typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : (data?.title ?? text) || '';
        setError(localizeAuthError(rawMsg, t, 'reset_password_error'));
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError(t('reset_password_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!state.email && !state.token && !state.otp) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" dir={direction}>
        <Logo className="mb-8" />
        <motion.div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center">
          <p className="text-gray-600 mb-4">{direction === 'rtl' ? 'الرجاء التحقق من الرمز أولاً.' : 'Please verify the code first.'}</p>
          <button type="button" onClick={() => navigate('/verify-otp')} className="text-[#1e3a8a] font-medium hover:underline">
            {t('verify_otp')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" dir={direction}>
        <Logo className="mb-8" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{t('reset_password_success')}</h3>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 text-[#1e3a8a] font-medium hover:underline"
          >
            {t('back_to_login')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" dir={direction}>
      <Logo className="mb-8" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative p-8 md:p-10"
      >
        <button
          type="button"
          onClick={() => navigate('/verify-otp', { state: { email: state.email } })}
          className={`absolute top-6 text-gray-400 hover:text-gray-600 transition-colors ${direction === 'rtl' ? 'right-6' : 'left-6'}`}
        >
          <ArrowRight size={24} className={direction === 'rtl' ? '' : 'rotate-180'} />
        </button>

        <h1 className="text-2xl font-bold text-[#1e3a8a] text-center mb-4">{t('reset_password_title')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" role="alert">{error}</p>
          )}
          <div className="relative">
            <div className={`absolute top-0 h-full w-12 flex items-center justify-center border-gray-300 text-gray-500 ${direction === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'}`}>
              <Lock size={20} />
            </div>
            <Input
              type="password"
              placeholder={t('new_password')}
              className={`w-full h-12 border border-gray-300 rounded-lg outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all ${direction === 'rtl' ? 'pr-14 pl-4 text-right' : 'pl-14 pr-4 text-left'}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="relative">
            <div className={`absolute top-0 h-full w-12 flex items-center justify-center border-gray-300 text-gray-500 ${direction === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'}`}>
              <Lock size={20} />
            </div>
            <Input
              type="password"
              placeholder={t('confirm_password')}
              className={`w-full h-12 border border-gray-300 rounded-lg outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all ${direction === 'rtl' ? 'pr-14 pl-4 text-right' : 'pl-14 pr-4 text-left'}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#054C28] text-white font-bold rounded-lg shadow-md hover:bg-[#043b1f] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (direction === 'rtl' ? 'جاري الحفظ...' : 'Saving...') : t('reset_password_button')}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full mt-4 text-[#1e3a8a] font-medium hover:underline text-center"
        >
          {t('back_to_login')}
        </button>
      </motion.div>
    </div>
  );
}
