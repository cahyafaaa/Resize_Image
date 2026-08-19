"use client";

import React, { useState } from "react";
import { ImageResizer } from "./image-resizer";
import { ResultPreview } from "./result-preview";
import { HistoryList } from "./history-list";
import { UserProfile } from "./user-profile";
import { SparklesIcon, UserIcon, ImageIcon } from "./icons";
import type { ResizeActionResult, ResizeHistoryItem } from "../../actions/image";

interface DashboardClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  initialHistory: ResizeHistoryItem[];
}

export function DashboardClient({ user: initialUser, initialHistory }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"resizer" | "history" | "profile">("resizer");
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [activeResult, setActiveResult] = useState<ResizeActionResult["data"] | null>(null);
  const [history, setHistory] = useState<ResizeHistoryItem[]>(initialHistory);

  const handleResizeSuccess = (data: NonNullable<ResizeActionResult["data"]>) => {
    setActiveResult(data);
    setActiveTab("resizer");

    // Optimistically add to history
    const newItem: ResizeHistoryItem = {
      id: data.jobId,
      originalName: data.originalName,
      originalWidth: data.originalWidth,
      originalHeight: data.originalHeight,
      originalSize: data.originalSize,
      resizedWidth: data.resizedWidth,
      resizedHeight: data.resizedHeight,
      resizedSize: data.resizedSize,
      format: data.format,
      quality: data.quality,
      status: "COMPLETED",
      createdAt: data.createdAt,
      previewUrl: data.previewUrl,
      downloadUrl: data.downloadUrl,
    };

    setHistory((prev) => [newItem, ...prev.filter((i) => i.id !== data.jobId)]);
  };

  const handleReset = () => {
    setActiveResult(null);
  };

  const handleProfileUpdated = (newName: string, newEmail: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      name: newName,
      email: newEmail,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs - Blue & White */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-xs border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("resizer")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === "resizer"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            Image Studio
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === "history"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            History ({history.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeTab === "profile"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Profile Settings
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "resizer" && (
        <div className="space-y-8">
          <section>
            {activeResult ? (
              <ResultPreview result={activeResult} onReset={handleReset} />
            ) : (
              <ImageResizer onSuccess={handleResizeSuccess} />
            )}
          </section>

          {/* Quick preview of history below studio */}
          {history.length > 0 && !activeResult && (
            <section className="border-t border-slate-200/80 pt-8">
              <HistoryList initialHistory={history.slice(0, 3)} />
            </section>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <section>
          <HistoryList initialHistory={history} />
        </section>
      )}

      {activeTab === "profile" && (
        <section>
          <UserProfile
            user={currentUser}
            onProfileUpdated={handleProfileUpdated}
          />
        </section>
      )}
    </div>
  );
}
