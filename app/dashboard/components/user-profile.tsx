"use client";

import React, { useState, useTransition } from "react";
import { UserIcon, KeyIcon, CheckIcon, RefreshIcon } from "./icons";
import {
  updateProfileInfoAction,
  updatePasswordAction,
  ProfileActionResult,
} from "../../actions/profile";

interface UserProfileProps {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  onProfileUpdated?: (newName: string, newEmail: string) => void;
}

export function UserProfile({ user, onProfileUpdated }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");

  // Personal Info Form State
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [infoMessage, setInfoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [infoFieldErrors, setInfoFieldErrors] = useState<Record<string, string>>({});
  const [isPendingInfo, startTransitionInfo] = useTransition();

  // Sync state if user prop changes
  React.useEffect(() => {
    setName(user.name || "");
    setEmail(user.email || "");
  }, [user.name, user.email]);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [securityFieldErrors, setSecurityFieldErrors] = useState<Record<string, string>>({});
  const [isPendingSecurity, startTransitionSecurity] = useTransition();

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);
    setInfoFieldErrors({});

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);

    startTransitionInfo(async () => {
      const res: ProfileActionResult = await updateProfileInfoAction(formData);
      if (res.success) {
        setInfoMessage({ type: "success", text: res.message });
        if (onProfileUpdated) {
          onProfileUpdated(name, email);
        }
      } else {
        setInfoMessage({ type: "error", text: res.message });
        if (res.fieldErrors) {
          setInfoFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);
    setSecurityFieldErrors({});

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    startTransitionSecurity(async () => {
      const res: ProfileActionResult = await updatePasswordAction(formData);
      if (res.success) {
        setSecurityMessage({ type: "success", text: res.message });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setSecurityMessage({ type: "error", text: res.message });
        if (res.fieldErrors) {
          setSecurityFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  const getInitials = (nameStr: string | null, emailStr: string) => {
    if (nameStr && nameStr.trim().length > 0) {
      const parts = nameStr.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return nameStr.slice(0, 2).toUpperCase();
    }
    return emailStr.slice(0, 2).toUpperCase();
  };

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-sm">
      {/* Profile Overview Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-100 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-lg font-bold text-white shadow-md shadow-blue-500/25">
            {getInitials(name, email)}
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              {name || "User Account"}
            </h2>
            <p className="text-xs text-blue-600 font-medium">{email}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-2xl bg-blue-50/60 p-1 border border-blue-100">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "info"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Personal Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "security"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            <KeyIcon className="w-3.5 h-3.5" />
            Security & Password
          </button>
        </div>
      </div>

      {/* TAB 1: Personal Info Form */}
      {activeTab === "info" && (
        <form onSubmit={handleUpdateInfo} className="max-w-xl space-y-5">
          {infoMessage && (
            <div
              role="alert"
              className={`rounded-2xl p-4 text-xs font-semibold border flex items-center justify-between shadow-xs ${
                infoMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span>{infoMessage.text}</span>
              <button
                type="button"
                onClick={() => setInfoMessage(null)}
                className="font-bold ml-2 text-base"
              >
                ×
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Pratama"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
            />
            {infoFieldErrors.name && (
              <p className="mt-1 text-xs text-red-600 font-bold">{infoFieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
            />
            {infoFieldErrors.email && (
              <p className="mt-1 text-xs text-red-600 font-bold">{infoFieldErrors.email}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPendingInfo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPendingInfo ? (
                <>
                  <RefreshIcon className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 text-white" />
                  Save Profile Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Security & Password Form */}
      {activeTab === "security" && (
        <form onSubmit={handleUpdatePassword} className="max-w-xl space-y-5">
          {securityMessage && (
            <div
              role="alert"
              className={`rounded-2xl p-4 text-xs font-semibold border flex items-center justify-between shadow-xs ${
                securityMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span>{securityMessage.text}</span>
              <button
                type="button"
                onClick={() => setSecurityMessage(null)}
                className="font-bold ml-2 text-base"
              >
                ×
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
            />
            {securityFieldErrors.currentPassword && (
              <p className="mt-1 text-xs text-red-600 font-bold">
                {securityFieldErrors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
            />
            {securityFieldErrors.newPassword && (
              <p className="mt-1 text-xs text-red-600 font-bold">
                {securityFieldErrors.newPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type your new password"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
            />
            {securityFieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 font-bold">
                {securityFieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPendingSecurity}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPendingSecurity ? (
                <>
                  <RefreshIcon className="w-4 h-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <KeyIcon className="w-4 h-4 text-white" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
