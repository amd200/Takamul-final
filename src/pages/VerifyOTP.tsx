import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/Logo';
import { localizeAuthError, AUTH_API_BASE } from '@/lib/utils';

import { Input } from "@/components/ui/input";

const AUTH_API = `${AUTH_API_BASE}/Auth`;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, direction } = useLanguage();
  const email = (location.state as { email?: string })?.email ?? '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || otp, // some APIs use email, some use phone
          otp: otp.trim(),
          code: otp.trim(),
        }),
      });
      const text = await res.text();
      const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
      if (!res.ok) {
        const rawMsg = typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : (data?.title ?? text) || '';
        setError(localizeAuthError(rawMsg, t, 'otp_error'));
        setLoading(false);
        return;
      }
      const token = data?.token ?? data?.resetToken ?? data?.data?.token;
      navigate('/reset-password', { state: { email: email || data?.email, token, otp: otp.trim() } });
    } catch {
      setError(t('otp_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" dir={direction}>
        <Logo className="mb-8" />
        <motion.div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center">
          <p className="text-gray-600 mb-4">{direction === 'rtl' ? 'الرجاء البدء من صفحة نسيت كلمة المرور.' : 'Please start from the forgot password page.'}</p>
          <button type="button" onClick={() => navigate('/forgot-password')} className="text-[#1e3a8a] font-medium hover:underline">
            {t('password_recovery')}
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
          onClick={() => navigate('/forgot-password')}
          className={`absolute top-6 text-gray-400 hover:text-gray-600 transition-colors ${direction === 'rtl' ? 'right-6' : 'left-6'}`}
        >
          <ArrowRight size={24} className={direction === 'rtl' ? '' : 'rotate-180'} />
        </button>

        <h1 className="text-2xl font-bold text-[#1e3a8a] text-center mb-4">{t('verify_otp')}</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">{t('otp_sent_to_email')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" role="alert">{error}</p>
          )}
          <div className="relative">
            <div className={`absolute top-0 h-full w-12 flex items-center justify-center border-gray-300 text-gray-500 ${direction === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'}`}>
              <KeyRound size={20} />
            </div>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t('otp_code')}
              className={`w-full h-12 border border-gray-300 rounded-lg outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all ${direction === 'rtl' ? 'pr-14 pl-4 text-right' : 'pl-14 pr-4 text-left'}`}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#054C28] text-white font-bold rounded-lg shadow-md hover:bg-[#043b1f] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (direction === 'rtl' ? 'جاري التحقق...' : 'Verifying...') : t('verify_otp')}
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
