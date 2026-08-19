import { logoutAction } from "../actions/auth";
import { getRecentResizeJobs } from "../actions/image";
import { requireUser } from "../lib/auth";
import { DashboardClient } from "./components/dashboard-client";
import { SparklesIcon } from "./components/icons";

export default async function DashboardPage() {
  const user = await requireUser();
  const initialHistory = await getRecentResizeJobs();

  return (
    <main className="min-h-screen bg-slate-50/80 text-slate-900 pb-16">
      {/* Top Navbar - Clean White with Blue Brand Accents */}
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Image Resizer Studio
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  PRO
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900">
                {user.name || "User"}
              </span>
              <span className="text-[11px] text-blue-600 font-medium">{user.email}</span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Welcome & Intro Banner - Royal Blue Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-blue-800/40">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 border border-blue-400/30 mb-3">
              <SparklesIcon className="w-3.5 h-3.5 text-blue-300" />
              Next-Gen Image Processing Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome, {user.name || "Creator"}! 👋
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-blue-100/80 max-w-xl leading-relaxed">
              Upload any image, specify custom dimensions or select preset resolutions, and download instantly optimized files with zero quality loss.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-sky-200 border border-white/20 shadow-inner">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            Sharp Engine v0.35 Active
          </div>

          {/* Decorative background glow circles */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>

        {/* Dynamic Client Resizer, History & Profile */}
        <DashboardClient user={user} initialHistory={initialHistory} />
      </div>
    </main>
  );
}
