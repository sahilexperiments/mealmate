'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ChevronRight } from 'lucide-react';

type Tab = 'email' | 'phone' | 'google';
type EmailMode = 'signin' | 'register';

// ── Google Icon SVG ───────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.292C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ── OTP Input ─────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  }

  function handleChange(i: number, v: string) {
    const digit = v.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < 3) refs[i + 1].current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (text.length === 4) {
      onChange(text.split(''));
      refs[3].current?.focus();
    }
    e.preventDefault();
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-14 h-14 text-center text-2xl font-black text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-400 transition-colors bg-white"
        />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  const [tab, setTab]           = useState<Tab>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');

  // Email/password form
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPwd,       setShowPwd]       = useState(false);
  const [keepLoggedIn,  setKeepLoggedIn]  = useState(true);

  // Phone/OTP form
  const [phone,         setPhone]         = useState('');
  const [otpDigits,     setOtpDigits]     = useState(['', '', '', '']);
  const [otpSent,       setOtpSent]       = useState(false);
  const [devOtp,        setDevOtp]        = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  // State
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Resend countdown
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (emailMode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(emailMode === 'register' ? 'Account created but sign-in failed. Please try signing in.' : 'Invalid email or password.');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    setError('');
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setOtpSent(true);
      setResendSeconds(60);
      if (data.devOtp) setDevOtp(data.devOtp); // dev mode only
    } catch {
      setError('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otpDigits.join('');
    if (code.length < 4) { setError('Please enter the 4-digit OTP.'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await signIn('phone', {
        phone: phone.trim(),
        token: code,
        redirect: false,
      });
      if (result?.error) {
        setError('Incorrect or expired OTP. Please try again.');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn('google', { callbackUrl });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-10">

      {/* Branding */}
      <div className="text-center mb-8 space-y-1">
        <span className="text-5xl">🍛</span>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">MealMate</h1>
        <p className="text-sm text-gray-500 font-medium">Zero decisions. Pure flavour.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-lg shadow-orange-50 p-6 space-y-5">

        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          {([
            { id: 'email',  label: '✉️ Email'  },
            { id: 'phone',  label: '📱 Phone'  },
            { id: 'google', label: 'G  Google' },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(''); }}
              className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Email tab ────────────────────────────────────────────────────── */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {/* Mode toggle */}
            <div className="flex gap-2">
              {(['signin', 'register'] as EmailMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setEmailMode(m); setError(''); }}
                  className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${
                    emailMode === m
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {emailMode === 'register' && (
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
            />

            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Keep me logged in */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setKeepLoggedIn((p) => !p)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  keepLoggedIn ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                }`}
              >
                {keepLoggedIn && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-600">Keep me logged in</span>
            </label>

            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition-colors shadow-md shadow-orange-100"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {emailMode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Phone tab ────────────────────────────────────────────────────── */}
        {tab === 'phone' && (
          <div className="space-y-4">
            {!otpSent ? (
              <>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
                  />
                </div>

                {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition-colors shadow-md shadow-orange-100"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-gray-700">Enter the 4-digit OTP</p>
                  <p className="text-xs text-gray-400">sent to {phone}</p>
                  {devOtp && (
                    <p className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-xl inline-block">
                      Dev OTP: {devOtp}
                    </p>
                  )}
                </div>

                <OtpInput value={otpDigits} onChange={setOtpDigits} />

                {error && <p className="text-xs text-red-500 font-semibold text-center">{error}</p>}

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otpDigits.join('').length < 4}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition-colors shadow-md shadow-orange-100"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Verify & Continue
                </button>

                <div className="text-center">
                  {resendSeconds > 0 ? (
                    <p className="text-xs text-gray-400">Resend in {resendSeconds}s</p>
                  ) : (
                    <button
                      onClick={() => { setOtpSent(false); setOtpDigits(['', '', '', '']); setDevOtp(''); setError(''); }}
                      className="text-xs font-bold text-orange-500 hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Google tab ───────────────────────────────────────────────────── */}
        {tab === 'google' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 text-center">
              Sign in instantly using your Google account. No password needed.
            </p>

            {error && <p className="text-xs text-red-500 font-semibold text-center">{error}</p>}

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-800 font-bold py-3.5 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <GoogleIcon />}
              Continue with Google
            </button>

            {!process.env.NEXT_PUBLIC_GOOGLE_ENABLED && (
              <p className="text-[10px] text-gray-400 text-center">
                Configure GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in .env.local to enable.
              </p>
            )}
          </div>
        )}

        {/* ── Footer divider ───────────────────────────────────────────────── */}
        {tab !== 'google' && (
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        )}
        {tab !== 'google' && (
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-semibold text-sm py-3 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        )}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-gray-400 text-center max-w-xs">
        By continuing, you agree to our Terms of Service and Privacy Policy.
        Your meal journey starts here. 🍳
      </p>
    </div>
  );
}
