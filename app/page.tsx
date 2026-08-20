import Link from "next/link";
import { getCurrentUser } from "./lib/auth";
import { SparklesIcon, ImageIcon, CheckIcon, LockIcon } from "./dashboard/components/icons";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col justify-between">
      {/* Header Navbar */}
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              Canyafaaa
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 mb-6 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          Powered by Sharp High-Performance Processing Engine
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-3xl mx-auto leading-tight text-slate-950">
          Resize & Optimize Images in{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
            Seconds.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-7 text-slate-600">
          Tailor image resolutions for Instagram, TikTok, YouTube, or web apps. Convert between JPEG, PNG, WebP, and AVIF with full compression control.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href={user ? "/dashboard" : "/register"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-700 hover:to-indigo-700"
          >
            <SparklesIcon className="w-4 h-4 text-sky-200" />
            {user ? "Open Studio Dashboard" : "Start Resizing Free"}
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-xs transition hover:bg-blue-50/50 hover:text-blue-700 hover:border-blue-300"
          >
            {user ? "View History" : "Sign In to Account"}
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="rounded-3xl border border-blue-100 bg-white p-7 shadow-sm transition hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5 shadow-xs border border-blue-100">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-950">Custom & Preset Sizes</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Enter custom Width and Height with aspect ratio locking or pick presets for Social Media & 4K resolutions.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-7 shadow-sm transition hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-5 shadow-xs border border-indigo-100">
              <CheckIcon className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-950">Next-Gen Formats</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Export to WebP, AVIF, PNG, or JPEG. Adjust quality sliders to reduce file sizes up to 90% without quality loss.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-7 shadow-sm transition hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-5 shadow-xs border border-sky-100">
              <LockIcon className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-950">Secure History & Profile</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your processed images are stored securely in your private gallery. Manage your profile and password at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs font-medium text-slate-500">
          © {new Date().getFullYear()} Canyafaaa Resize. Built with Next.js, Tailwind CSS & Sharp.
        </div>
      </footer>
    </main>
  );
}
