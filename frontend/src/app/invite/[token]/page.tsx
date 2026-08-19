'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { WorkspaceInvitation } from '../../../types';
import {
  Briefcase,
  User,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Mail,
  UserCheck,
} from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, loginAsGuest, loginWithGoogle, logout } = useAuth();

  const [invitation, setInvitation] = useState<WorkspaceInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);

  useEffect(() => {
    if (!token) return;

    api
      .getInvitationInfo(token)
      .then((data) => {
        setInvitation(data);
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Invitation is invalid or has expired');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    setErrorMessage('');

    try {
      const res = await api.acceptInvitation(token);
      if ((res as any).isExistingMember) {
        setIsAlreadyMember(true);
        setSuccessMessage(res.message);
      } else {
        setSuccessMessage(res.message || `Successfully joined ${invitation?.workspace?.name}`);
      }
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to accept invitation');
      setIsAccepting(false);
    }
  };

  const handleSwitchAccount = async (targetEmail: string) => {
    setIsAccepting(true);
    setErrorMessage('');
    try {
      const name = targetEmail.split('@')[0];
      await loginWithGoogle(targetEmail, name);
      const res = await api.acceptInvitation(token);
      setSuccessMessage(res.message || `Successfully joined ${invitation?.workspace?.name}`);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to switch account and accept');
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen bg-[#FDFDFD] dark:bg-[#121212] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={26} className="animate-spin text-black dark:text-white" />
          <span className="text-[14px] font-medium">Verifying workspace invitation...</span>
        </div>
      </div>
    );
  }

  const normalizedUserEmail = (user?.email || '').trim().toLowerCase();
  const normalizedInviteEmail = (invitation?.email || '').trim().toLowerCase();
  const isEmailMismatch = Boolean(
    user && normalizedInviteEmail && normalizedUserEmail && normalizedUserEmail !== normalizedInviteEmail,
  );
  const isAccepted = invitation?.status === 'ACCEPTED';
  const isExpired = invitation?.status === 'EXPIRED';

  return (
    <div className="min-h-screen w-screen bg-[#FDFDFD] dark:bg-[#121212] flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-[460px] bg-white dark:bg-[#1E1E20] rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-150">

        <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-[18px] shadow-lg">
          ▲
        </div>

        {successMessage ? (
          <div className="flex flex-col items-center gap-3 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center justify-center shadow-inner">
              <Check size={28} strokeWidth={3} />
            </div>
            <h1 className="text-[20px] font-extrabold text-gray-900 dark:text-white">
              {isAlreadyMember ? 'Welcome Back!' : 'Welcome to the Workspace!'}
            </h1>
            <p className="text-[13px] text-gray-500 max-w-[320px]">{successMessage}</p>
            <span className="text-[12px] text-gray-400 flex items-center gap-1.5 mt-2">
              <Loader2 size={13} className="animate-spin" />
              <span>Redirecting to your workspace...</span>
            </span>
          </div>
        ) : errorMessage ? (

          <div className="flex flex-col items-center gap-3 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <AlertCircle size={26} />
            </div>
            <h1 className="text-[19px] font-bold text-gray-900 dark:text-white">
              Invitation Notice
            </h1>
            <p className="text-[13px] text-gray-500 max-w-[340px] leading-relaxed">
              {errorMessage}
            </p>

            <div className="flex flex-col gap-2 w-full mt-2">
              {invitation && (
                <button
                  type="button"
                  onClick={() => handleSwitchAccount(invitation.email)}
                  disabled={isAccepting}
                  className="w-full py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isAccepting && <Loader2 size={14} className="animate-spin" />}
                  <span>Sign in as {invitation.email} &amp; Join</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Go to Workspace Dashboard
              </button>
            </div>
          </div>
        ) : isAccepted ? (

          <div className="flex flex-col items-center gap-4 animate-in fade-in w-full">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <UserCheck size={26} />
            </div>
            <h1 className="text-[19px] font-bold text-gray-900 dark:text-white">
              Invitation Already Accepted
            </h1>
            <p className="text-[13px] text-gray-500 max-w-[340px] leading-relaxed">
              This invitation link for <span className="font-semibold text-gray-800 dark:text-gray-200">{invitation?.workspace?.name}</span> has already been claimed.
            </p>

            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                Go to Workspace Dashboard
              </button>
            </div>
          </div>
        ) : (

          invitation && (
            <div className="flex flex-col items-center gap-5 w-full">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  You&apos;re Invited
                </span>
                <h1 className="text-[22px] font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Join {invitation.workspace?.name}
                </h1>
                <p className="text-[13px] text-gray-500">
                  {invitation.invitedBy?.name || 'A team member'} invited you to collaborate as{' '}
                  <span className="font-bold text-black dark:text-white uppercase text-[12px] px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                    {invitation.role}
                  </span>
                </p>
              </div>

              <div className="w-full p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/80 flex items-center gap-3.5 text-left">
                <div className="w-11 h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Briefcase size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-[14px] text-gray-900 dark:text-white truncate">
                    {invitation.workspace?.name}
                  </span>
                  <span className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                    <Mail size={12} />
                    <span>Invited for: {invitation.email}</span>
                  </span>
                </div>
              </div>

              {user && (
                <div className="w-full p-3 rounded-xl bg-gray-100/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-left text-[12px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-gray-400 text-[10px]">Current Account:</span>
                      <span className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.email || user.name}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}

              {isEmailMismatch && (
                <div className="w-full p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[12px] text-amber-800 dark:text-amber-300 text-left flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Different account detected</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    This invite was addressed to <span className="font-bold">{invitation.email}</span>. Click below to sign in with that email directly.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2.5 w-full">
                {isEmailMismatch ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSwitchAccount(invitation.email)}
                      disabled={isAccepting}
                      className="w-full py-3.5 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-[13px] hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isAccepting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ArrowRight size={16} />
                      )}
                      <span>Sign in as {invitation.email} &amp; Join</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAccept}
                      disabled={isAccepting}
                      className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-[12px] font-medium transition-colors"
                    >
                      Attempt with current account ({user?.email})
                    </button>
                  </>
                ) : user ? (
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="w-full py-3.5 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-[14px] hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAccepting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                    <span>Accept &amp; Join {invitation.workspace?.name}</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => handleSwitchAccount(invitation.email)}
                      disabled={isAccepting}
                      className="w-full py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-[13px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      {isAccepting && <Loader2 size={14} className="animate-spin" />}
                      <span>Sign in with Google ({invitation.email})</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await loginAsGuest();
                        await handleAccept();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[12px] font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      Continue as Guest
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
