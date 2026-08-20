"use client";

import React, { useState } from "react";
import { DownloadIcon, TrashIcon, ImageIcon, SparklesIcon, RefreshIcon } from "./icons";
import { deleteResizeJobAction, ResizeHistoryItem } from "../../actions/image";

interface HistoryListProps {
  initialHistory: ResizeHistoryItem[];
  onSelectJob?: (job: ResizeHistoryItem) => void;
  onDeleteJob?: (id: string) => void;
  onGoToStudio?: () => void;
}

function formatBytes(bytes: number | null, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function HistoryList({
  initialHistory = [],
  onSelectJob,
  onDeleteJob,
  onGoToStudio,
}: HistoryListProps) {
  const [history, setHistory] = useState<ResizeHistoryItem[]>(
    Array.isArray(initialHistory) ? initialHistory : []
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null);

  // Sync state whenever initialHistory changes
  React.useEffect(() => {
    if (Array.isArray(initialHistory)) {
      setHistory(initialHistory);
    }
  }, [initialHistory]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this processed image?")) return;

    setDeletingId(id);
    try {
      const res = await deleteResizeJobAction(id);
      if (res.success) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (onDeleteJob) {
          onDeleteJob(id);
        }
      } else {
        alert(res.message || "Failed to delete image.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenInStudio = async (job: ResizeHistoryItem) => {
    if (!onSelectJob) return;
    setLoadingJobId(job.id);

    try {
      // Fetch the original or resized file as a Blob to pass back to ImageResizer
      const res = await fetch(job.previewUrl);
      if (!res.ok) throw new Error("Could not fetch image file");
      const blob = await res.blob();
      const ext = job.format.toLowerCase().replace("jpeg", "jpg");
      const fileName = `${job.originalName.replace(/\.[^/.]+$/, "")}_edited.${ext}`;
      const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });

      onSelectJob(job);
    } catch (err) {
      console.error("Error loading job into studio:", err);
      // Fallback
      onSelectJob(job);
    } finally {
      setLoadingJobId(null);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.originalName.toLowerCase().includes(q) ||
      item.format.toLowerCase().includes(q) ||
      `${item.resizedWidth}x${item.resizedHeight}`.includes(q)
    );
  });

  if (history.length === 0) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shadow-xs">
          <ImageIcon className="w-7 h-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">No resize history yet</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Upload and resize your first image in the Image Studio to see your processed files saved here.
        </p>
        {onGoToStudio && (
          <button
            type="button"
            onClick={onGoToStudio}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700"
          >
            <SparklesIcon className="w-4 h-4" />
            Go to Image Studio
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-sm">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-5 mb-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Recent Resize History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredHistory.length} of {history.length} processed image{history.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or format..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 w-full sm:w-60 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid of processed images */}
      {filteredHistory.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500">
          No images match your search query &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col rounded-2xl border border-blue-100 bg-white p-4 transition hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10"
            >
              {/* Thumbnail Preview */}
              <div className="relative flex items-center justify-center h-44 w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100 mb-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.originalName}
                  className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-2.5 right-2.5 rounded-lg bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase shadow-sm">
                  {item.format}
                </span>
                {item.quality && (
                  <span className="absolute top-2.5 left-2.5 rounded-lg bg-slate-900/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {item.quality}% Q
                  </span>
                )}
              </div>

              {/* Info details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 truncate" title={item.originalName}>
                    {item.originalName}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-bold text-blue-700">
                      {item.resizedWidth} × {item.resizedHeight} px
                    </span>
                    <span>•</span>
                    <span>{formatBytes(item.resizedSize)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400" suppressHydrationWarning>
                    {formatDate(item.createdAt)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <a
                    href={item.downloadUrl}
                    download={item.originalName}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    Download
                  </a>

                  {onSelectJob && (
                    <button
                      type="button"
                      onClick={() => handleOpenInStudio(item)}
                      disabled={loadingJobId === item.id}
                      title="Load image into Studio"
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                    >
                      {loadingJobId === item.id ? (
                        <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <SparklesIcon className="w-3.5 h-3.5" />
                      )}
                      Studio
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    disabled={deletingId === item.id}
                    title="Delete image"
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

