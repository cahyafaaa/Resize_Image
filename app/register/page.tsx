import { redirect } from "next/navigation";
import { getCurrentUser } from "../lib/auth";
import { RegisterForm } from "./register-form";
import { SparklesIcon } from "../dashboard/components/icons";
import Link from "next/link";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-slate-900 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs group-hover:bg-slate-800 transition">
          <SparklesIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="text-lg font-bold tracking-tight">Image Resizer Studio</span>
      </Link>

      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Create your account
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Start resizing, optimizing, and tracking your images for free.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
