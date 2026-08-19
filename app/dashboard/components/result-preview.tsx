"use client";

import React, { useState } from "react";
import { DownloadIcon, RefreshIcon, CheckIcon, ImageIcon } from "./icons";
import type { ResizeActionResult } from "../../actions/image";

interface ResultPreviewProps {
  result: NonNullable<ResizeActionResult["data"]>;
  onReset: () => void;
}

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function ResultPreview({ result, onReset }: ResultPreviewProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    setDownloaded(true);
    const link = document.createElement("a");
    link.href = result.downloadUrl;
    link.download = result.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-sm transition">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-blue-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
            <CheckIcon className="w-3.5 h-3.5 text-blue-600" />
            Image Resized & Optimized
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            {result.originalName}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
          >
            <RefreshIcon className="w-4 h-4" />
            Resize Another
          </button>

          <button
            onClick={handleDownload}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20"
          >
            {downloaded ? (
              <>
                <CheckIcon className="w-4 h-4 text-white" />
                Downloaded!
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4" />
                Download Resized ({result.format})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image Preview and Comparison Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Resized Result Card */}
        <div className="flex flex-col rounded-2xl border border-blue-200 bg-blue-50/30 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <span className="font-bold text-sm text-blue-950 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
              Resized Output
            </span>
            <span className="rounded-lg bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
              {result.resizedWidth} × {result.resizedHeight} px
            </span>
          </div>

          <div className="relative mt-4 flex items-center justify-center min-h-[260px] max-h-[400px] overflow-hidden rounded-xl bg-white p-2 shadow-inner border border-blue-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.previewUrl}
              alt="Resized preview"
              className="max-h-[360px] w-auto max-w-full rounded-lg object-contain shadow-xs"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-white p-3 border border-blue-100 shadow-2xs">
              <p className="text-slate-500 font-medium">New Dimensions</p>
              <p className="mt-1 font-bold text-blue-700 text-sm">
                {result.resizedWidth} × {result.resizedHeight}
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 border border-blue-100 shadow-2xs">
              <p className="text-slate-500 font-medium">New File Size</p>
              <p className="mt-1 font-bold text-blue-700 text-sm">{formatBytes(result.resizedSize)}</p>
            </div>
            <div className="rounded-xl bg-white p-3 border border-blue-100 shadow-2xs">
              <p className="text-slate-500 font-medium">Format & Quality</p>
              <p className="mt-1 font-bold text-blue-700 text-sm">
                {result.format} ({result.quality}%)
              </p>
            </div>
          </div>
        </div>

        {/* Original Image Card */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-500" />
              Original Image
            </span>
            <span className="rounded-lg bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800">
              {result.originalWidth} × {result.originalHeight} px
            </span>
          </div>

          <div className="relative mt-4 flex items-center justify-center min-h-[260px] max-h-[400px] overflow-hidden rounded-xl bg-white p-2 shadow-inner border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.originalUrl}
              alt="Original preview"
              className="max-h-[360px] w-auto max-w-full rounded-lg object-contain opacity-90"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl bg-white p-3 border border-slate-200">
              <p className="text-slate-500 font-medium">Original Dimensions</p>
              <p className="mt-1 font-bold text-slate-800 text-sm">
                {result.originalWidth} × {result.originalHeight} px
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 border border-slate-200">
              <p className="text-slate-500 font-medium">Original Size</p>
              <p className="mt-1 font-bold text-slate-800 text-sm">{formatBytes(result.originalSize)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Metric Footer */}
      {result.savedPercentage !== 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 px-6 py-4 text-white shadow-lg border border-blue-800/40">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="rounded-xl bg-blue-500/20 p-2 text-blue-300 border border-blue-400/30">
              <CheckIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {result.savedPercentage > 0
                  ? `Optimized file size reduced by ${result.savedPercentage}%!`
                  : `Image scaled to ${result.resizedWidth}×${result.resizedHeight}px.`}
              </p>
              <p className="text-xs text-blue-200/70">
                From {formatBytes(result.originalSize)} to {formatBytes(result.resizedSize)}
              </p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            type="button"
            className="w-full sm:w-auto rounded-xl bg-blue-500 hover:bg-blue-400 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition"
          >
            Download Now
          </button>
        </div>
      )}
    </div>
  );
}
