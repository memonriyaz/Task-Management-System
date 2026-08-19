'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, User, ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthScreen: React.FC = () => {
  const { loginAsGuest, loginWithGoogle, login, isLoading } = useAuth();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isUseAnotherAccount, setIsUseAnotherAccount] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isEmailLoginOpen, setIsEmailLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);

  const googleAccounts = [
    {
      name: 'RIYAZ MEMON',
      email: 'riyazmemon614@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Riyaz Memon',
      email: 'riyazismailmemon@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Riyaz Memon (Work)',
      email: 'memonriyazwork@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
  ];

  useEffect(() => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '983742918237-sampleclientid.apps.googleusercontent.com';

    const handleCredentialResponse = (response: any) => {
      if (response.credential) {
        try {
          const base64Url = response.credential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join(''),
          );
          const payload = JSON.parse(jsonPayload);
          loginWithGoogle(
            payload.email,
            payload.name,
            payload.picture,
            response.credential,
          );
        } catch {
          loginWithGoogle(undefined, undefined, undefined, response.credential);
        }
      }
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          window.google.accounts.id.prompt();
        } catch {

        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [loginWithGoogle]);

  const handleGoogleButtonClick = () => {
    setAuthError('');
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id:
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            '644272848172-6pdgjqnlhjh4oki6cekp4hakumr5acc1.apps.googleusercontent.com',
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              console.warn('Google OAuth popup closed or error:', tokenResponse.error);
              setIsGoogleModalOpen(true);
              return;
            }
            if (tokenResponse?.access_token) {
              try {
                const userInfo = await fetch(
                  'https://www.googleapis.com/oauth2/v3/userinfo',
                  {
                    headers: {
                      Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                  },
                ).then((r) => r.json());

                if (userInfo?.email) {
                  await loginWithGoogle(
                    userInfo.email,
                    userInfo.name,
                    userInfo.picture,
                  );
                  return;
                }
              } catch (fetchErr) {
                console.error('Failed fetching Google profile:', fetchErr);
              }
            }
            setIsGoogleModalOpen(true);
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('Google OAuth2 client error, opening fallback modal:', err);
      }
    }
    setIsGoogleModalOpen(true);
  };

  const handleSelectGoogleAccount = async (account: {
    name: string;
    email: string;
    avatar?: string;
  }) => {
    setIsGoogleModalOpen(false);
    await loginWithGoogle(account.email, account.name, account.avatar);
  };

  const handleCustomAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    setIsGoogleModalOpen(false);
    await loginWithGoogle(
      customEmail.trim(),
      name,
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    );
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setAuthError('Email is required');
      return;
    }
    if (!password) {
      setAuthError('Password is required');
      return;
    }
    try {
      setIsSubmitting(true);
      setAuthError('');
      await login(email.trim(), password);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#FDFDFD] dark:bg-[#121212] flex items-center justify-center p-4 overflow-hidden select-none font-sans">

      <div className="absolute top-[28%] left-[52%] -translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-2xl z-10 animate-bounce duration-1000">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute top-[42%] left-[63%] flex items-center justify-center w-11 h-11 rounded-full bg-[#3F332B] text-white font-bold text-[15px] border-2 border-white shadow-2xl z-10">
        N
      </div>

      <div className="absolute top-[39%] right-[5%] flex items-center justify-center w-12 h-12 rounded-full bg-[#E57A44] border-2 border-white shadow-2xl z-10">
        <span className="text-xl">🦁</span>
      </div>

      <div className="absolute bottom-[18%] right-[22%] flex items-center gap-0.5 z-10">
        <div className="w-10 h-10 rounded-full bg-[#4CAF50] text-white font-bold flex items-center justify-center border-2 border-white shadow-xl">
          A
        </div>
        <div className="w-10 h-10 rounded-full bg-[#D32F2F] text-white font-bold flex items-center justify-center -ml-3 border-2 border-white shadow-xl">
          A
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xl -ml-3">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="absolute top-[30%] flex items-center gap-2">
        <div className="w-6 h-6 rounded-[6px] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-[11px]">
          ▲
        </div>
        <span className="font-bold text-[15px] text-black dark:text-white tracking-tight">
          Pyramid
        </span>
      </div>

      <div className="w-full max-w-[420px] bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center z-20 mt-14">
        <h1 className="text-[22px] sm:text-[24px] font-extrabold text-black dark:text-white mb-2 tracking-tight">
          Let&apos;s get back on track
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 max-w-[280px]">
          Sign in to your workspace or explore with guest credentials.
        </p>

        {authError && (
          <div className="w-full p-3.5 mb-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-[13px] text-left flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-snug">
                {authError}
              </div>
              <button
                type="button"
                onClick={() => setAuthError('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {authError.toLowerCase().includes('google') && (
              <button
                type="button"
                onClick={() => {
                  setAuthError('');
                  handleGoogleButtonClick();
                }}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}
          </div>
        )}

        {isEmailLoginOpen ? (
          <form onSubmit={handleEmailPasswordLogin} className="w-full flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent">
              <Mail size={15} className="text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="name@company.com"
                className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] bg-transparent">
              <Lock size={15} className="text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="Password"
                className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[14px] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In with Email'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsEmailLoginOpen(false);
                setAuthError('');
              }}
              className="text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pt-1 cursor-pointer"
            >
              Back to options
            </button>
          </form>
        ) : (
          <div className="w-full flex flex-col gap-3.5 mb-8">
            <button
              type="button"
              onClick={async () => {
                try {
                  setIsGuestSubmitting(true);
                  setAuthError('');
                  await loginAsGuest();
                } catch (err: any) {
                  setAuthError(err.message || 'Guest login failed');
                } finally {
                  setIsGuestSubmitting(false);
                }
              }}
              disabled={isGuestSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-gray-100 text-black font-semibold text-[14px] transition-all duration-150 shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isGuestSubmitting ? 'Entering Workspace...' : 'Continue as Guest'}
            </button>

            <button
              type="button"
              onClick={handleGoogleButtonClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1E232A] hover:bg-[#252B33] text-white font-semibold text-[14px] border border-[#2D333B] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Login with Google</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEmailLoginOpen(true)}
              className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors pt-2 cursor-pointer"
            >
              or sign in with email &amp; password
            </button>
          </div>
        )}

        <p className="text-[12px] text-gray-500 leading-relaxed">
          By clicking continue, you agree to our{' '}
          <a href="#" className="underline hover:text-white transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-white transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>

      {isGoogleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
          onClick={() => setIsGoogleModalOpen(false)}
        >
          <div
            className="w-full max-w-[840px] bg-[#131314] text-[#E3E3E3] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#2D2E30] flex flex-col gap-6 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between pb-2 border-b border-[#2D2E30]/60">
              <div className="flex items-center gap-2.5 text-[14px] text-[#E3E3E3] font-medium">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </div>

              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="text-[#8E918F] hover:text-white p-1 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start py-2">

              <div className="flex flex-col gap-2">
                <h2 className="text-[28px] font-normal text-white tracking-tight leading-tight">
                  Choose an account
                </h2>
                <p className="text-[15px] text-[#C4C7C5]">
                  to continue to <span className="text-[#A8C7FA] font-medium">Pyramid Workspace</span>
                </p>
              </div>

              <div className="flex flex-col">
                {!isUseAnotherAccount ? (
                  <div className="flex flex-col divide-y divide-[#2D2E30]/80">
                    {googleAccounts.map((acc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectGoogleAccount(acc)}
                        className="flex items-center gap-3.5 py-3 px-3 rounded-2xl hover:bg-[#202124] transition-colors text-left group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[#444746]">
                          <img
                            src={acc.avatar}
                            alt={acc.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[14px] font-medium text-white group-hover:text-[#A8C7FA] transition-colors truncate">
                            {acc.name}
                          </span>
                          <span className="text-[12px] text-[#8E918F] truncate">
                            {acc.email}
                          </span>
                        </div>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsUseAnotherAccount(true)}
                      className="flex items-center gap-3.5 py-3 px-3 rounded-2xl hover:bg-[#202124] transition-colors text-left text-[14px] font-medium text-white hover:text-[#A8C7FA] cursor-pointer mt-1"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#202124] flex items-center justify-center shrink-0 border border-[#444746] text-[#C4C7C5]">
                        <User size={18} />
                      </div>
                      <span>Use another account</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCustomAccountSubmit} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-2">
                      <button
                        type="button"
                        onClick={() => setIsUseAnotherAccount(false)}
                        className="text-[#A8C7FA] hover:underline flex items-center gap-1 text-[13px] cursor-pointer"
                      >
                        <ArrowLeft size={14} />
                        <span>Back to accounts</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[12px] text-[#C4C7C5] font-medium">
                        Email or phone
                      </label>
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="Enter your Google email"
                        className="w-full px-3.5 py-3 rounded-lg border border-[#8E918F] bg-transparent text-white text-[14px] focus:outline-none focus:border-[#A8C7FA] transition-colors"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[12px] text-[#C4C7C5] font-medium">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Riyaz Memon"
                        className="w-full px-3.5 py-3 rounded-lg border border-[#8E918F] bg-transparent text-white text-[14px] focus:outline-none focus:border-[#A8C7FA] transition-colors"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-[#A8C7FA] text-[#041E49] font-medium text-[14px] hover:bg-[#D3E3FD] transition-colors cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#2D2E30]/60 text-[12px] text-[#8E918F] leading-relaxed">
              Before using this app, you can review Pyramid Workspace&apos;s{' '}
              <a href="#" className="text-[#A8C7FA] hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#A8C7FA] hover:underline">
                Terms of Service
              </a>
              .
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
