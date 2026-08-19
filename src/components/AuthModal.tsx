import React, { useState } from 'react';
import {
  Layers,
  Mail,
  KeyRound,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { UserProfile } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserProfile, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await ApiService.sendOtp(email.trim());
      if (res.isSuccess) {
        setDemoCode(res.data?.demoCode || '123456');
        setOtp(res.data?.demoCode || '123456');
        setStep('otp');
      } else {
        setErrorMessage(res.message || 'Failed to send verification code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await ApiService.verifyOtp(email.trim(), otp.trim());
      if (res.isSuccess && res.data) {
        onSuccess(res.data.user, res.data.token);
      } else {
        setErrorMessage(res.message || 'Invalid or expired OTP code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await ApiService.demoLogin();
      if (res.isSuccess && res.data) {
        onSuccess(res.data.user, res.data.token);
      } else {
        setErrorMessage(res.message || 'Could not launch demo session.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-100 flex flex-col space-y-6 animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#8BC34A] text-white flex items-center justify-center mx-auto shadow-md shadow-[#8BC34A]/30">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Welcome to Oopsly
          </h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Spaced repetition flashcards powered by the scientifically proven FSRS algorithm.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium text-center">
            {errorMessage}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Sign in with Email (Passwordless OTP)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Sending Code...' : 'Send Verification Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Enter 6-Digit Code sent to {email}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-center tracking-widest text-sm font-bold text-stone-900 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                />
              </div>
              {demoCode && (
                <p className="text-[11px] text-[#558B2F] mt-1.5 text-center font-medium bg-[#8BC34A]/10 p-1.5 rounded-lg">
                  Demo code auto-filled: <span className="font-mono font-bold">{demoCode}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !otp.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying...' : 'Verify & Enter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
            >
              ← Use a different email
            </button>
          </form>
        )}

        {/* Instant 1-Click Demo Login */}
        <div className="pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Continue as Demo Learner (Instant Access)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
