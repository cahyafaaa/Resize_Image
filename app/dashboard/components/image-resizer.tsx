"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import {
  UploadIcon,
  DownloadIcon,
  LockIcon,
  UnlockIcon,
  ImageIcon,
  SparklesIcon,
  RefreshIcon,
  LinkIcon,
  GlobeIcon,
} from "./icons";
import {
  resizeImageAction,
  importImageFromUrlAction,
  ResizeActionResult,
} from "../../actions/image";

interface ImageResizerProps {
  onSuccess: (result: NonNullable<ResizeActionResult["data"]>) => void;
}

interface DimensionPreset {
  name: string;
  category: string;
  width: number;
  height: number;
}

const PRESETS: DimensionPreset[] = [
  { name: "Instagram Square", category: "Social", width: 1080, height: 1080 },
  { name: "Story / TikTok", category: "Social", width: 1080, height: 1920 },
  { name: "YouTube Thumbnail", category: "Social", width: 1280, height: 720 },
  { name: "Twitter / X Post", category: "Social", width: 1200, height: 675 },
  { name: "Twitter / X Header", category: "Social", width: 1500, height: 500 },
  { name: "Facebook Banner", category: "Social", width: 820, height: 312 },
  { name: "Full HD (1080p)", category: "Standard", width: 1920, height: 1080 },
  { name: "HD (720p)", category: "Standard", width: 1280, height: 720 },
  { name: "4K Ultra HD", category: "Standard", width: 3840, height: 2160 },
];

const PERCENT_SCALES = [25, 50, 75, 100, 150, 200];

const SAMPLE_IMAGES = [
  {
    title: "Mountain Vista",
    desc: "1600 × 1067 px",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80",
  },
  {
    title: "Cyber City Night",
    desc: "1600 × 1067 px",
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&auto=format&fit=crop&q=80",
  },
  {
    title: "Abstract Neon Flow",
    desc: "1600 × 1067 px",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
  },
];

// Helper to convert Base64 Data URL to a browser File object
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function ImageResizer({ onSuccess }: ImageResizerProps) {
  // Import mode: 'upload' | 'url' | 'sample'
  const [importMode, setImportMode] = useState<"upload" | "url" | "sample">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number | null>(null);
  const [originalHeight, setOriginalHeight] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  // Resize settings
  const [width, setWidth] = useState<number | string>("");
  const [height, setHeight] = useState<number | string>("");
  const [lockRatio, setLockRatio] = useState(true);
  const [fit, setFit] = useState<"cover" | "contain" | "fill" | "inside">("cover");
  const [format, setFormat] = useState<"JPEG" | "PNG" | "WEBP" | "AVIF">("JPEG");
  const [quality, setQuality] = useState<number>(85);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Global Clipboard Paste Listener (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (file) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            handleFileSelect(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [file]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP, etc.)");
      return;
    }

    setErrorMessage(null);
    setFile(selectedFile);

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Read image dimensions
    const img = new Image();
    img.onload = () => {
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      setOriginalWidth(naturalW);
      setOriginalHeight(naturalH);
      setWidth(naturalW);
      setHeight(naturalH);
      const ratio = naturalW / naturalH;
      setAspectRatio(ratio);
    };
    img.src = objectUrl;
  };

  const handleImportFromUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setErrorMessage(null);
    setIsImportingUrl(true);

    try {
      const res = await importImageFromUrlAction(targetUrl);
      if (res.success && res.data) {
        const convertedFile = dataURLtoFile(res.data.base64, res.data.name);
        handleFileSelect(convertedFile);
      } else {
        setErrorMessage(res.message || "Failed to import image from the URL.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to download image from the provided URL.");
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleWidthChange = (val: string) => {
    setWidth(val);
    const numVal = parseInt(val, 10);
    if (lockRatio && aspectRatio && !isNaN(numVal) && numVal > 0) {
      setHeight(Math.round(numVal / aspectRatio));
    }
  };

  const handleHeightChange = (val: string) => {
    setHeight(val);
    const numVal = parseInt(val, 10);
    if (lockRatio && aspectRatio && !isNaN(numVal) && numVal > 0) {
      setWidth(Math.round(numVal * aspectRatio));
    }
  };

  const applyPreset = (presetW: number, presetH: number) => {
    setWidth(presetW);
    setHeight(presetH);
  };

  const applyPercentScale = (pct: number) => {
    if (!originalWidth || !originalHeight) return;
    const factor = pct / 100;
    setWidth(Math.round(originalWidth * factor));
    setHeight(Math.round(originalHeight * factor));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select or import an image file first.");
      return;
    }

    const targetW = typeof width === "number" ? width : parseInt(width, 10);
    const targetH = typeof height === "number" ? height : parseInt(height, 10);

    if ((!targetW || isNaN(targetW)) && (!targetH || isNaN(targetH))) {
      setErrorMessage("Please enter at least a valid width or height.");
      return;
    }

    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    if (targetW) formData.append("width", targetW.toString());
    if (targetH) formData.append("height", targetH.toString());
    formData.append("fit", fit);
    formData.append("format", format);
    formData.append("quality", quality.toString());

    startTransition(async () => {
      const response = await resizeImageAction(formData);
      if (response.success && response.data) {
        onSuccess(response.data);
      } else {
        setErrorMessage(response.message || "Failed to resize image.");
      }
    });
  };

  const resetSelection = () => {
    setFile(null);
    setPreviewUrl(null);
    setOriginalWidth(null);
    setOriginalHeight(null);
    setWidth("");
    setHeight("");
    setErrorMessage(null);
    setUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-sm transition">
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center justify-between shadow-xs"
        >
          <span className="font-medium">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-800 font-bold ml-2 text-base"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload / Import Modes */}
      {!file ? (
        <div className="space-y-6">
          {/* Import Method Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-blue-100 pb-4">
            <button
              type="button"
              onClick={() => setImportMode("upload")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
                importMode === "upload"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <UploadIcon className="w-4 h-4" />
              Upload Local File
            </button>

            <button
              type="button"
              onClick={() => setImportMode("url")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
                importMode === "url"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Import from Web URL
            </button>

            <button
              type="button"
              onClick={() => setImportMode("sample")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
                importMode === "sample"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <GlobeIcon className="w-4 h-4" />
              Sample Demo Images
            </button>
          </div>

          {/* TAB 1: Upload File Drag & Drop */}
          {importMode === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition ${
                isDragging
                  ? "border-blue-600 bg-blue-50/80 scale-[0.99]"
                  : "border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:bg-blue-50/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="rounded-2xl bg-white p-4 shadow-md shadow-blue-500/10 border border-blue-100 text-blue-600">
                <UploadIcon className="w-8 h-8" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Choose an image or drag & drop here
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-sm">
                Supports PNG, JPG, JPEG, WEBP, AVIF up to 25MB • You can also press{" "}
                <kbd className="rounded-md bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800 border border-blue-200">
                  Ctrl + V
                </kbd>{" "}
                anywhere to paste
              </p>
              <span className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition">
                Browse Files from Device
              </span>
            </div>
          )}

          {/* TAB 2: Import from URL */}
          {importMode === "url" && (
            <div className="rounded-3xl border border-blue-100 bg-blue-50/20 p-6 sm:p-8 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Import Image from URL</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste any public direct link to an image on the web (e.g. Unsplash, Wikimedia, etc.).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-500">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleImportFromUrl(urlInput);
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  disabled={isImportingUrl || !urlInput.trim()}
                  onClick={() => handleImportFromUrl(urlInput)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isImportingUrl ? (
                    <>
                      <RefreshIcon className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="w-4 h-4" />
                      Fetch Image
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Sample Demo Images */}
          {importMode === "sample" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Try with Sample Images</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any sample image below to instantly load it into the resizer.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.title}
                    type="button"
                    disabled={isImportingUrl}
                    onClick={() => handleImportFromUrl(sample.url)}
                    className="group relative flex flex-col rounded-2xl border border-blue-100 bg-white p-3.5 text-left transition hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10"
                  >
                    <div className="relative h-32 w-full overflow-hidden rounded-xl bg-slate-100 mb-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sample.url}
                        alt={sample.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                      {sample.title}
                    </span>
                    <span className="text-[11px] text-blue-600/80 font-medium mt-0.5">{sample.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Image Preview & Configuration Form */
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 border border-blue-100">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{file.name}</p>
                <p className="text-xs text-slate-500">
                  Original: <span className="font-semibold text-blue-700">{originalWidth} × {originalHeight} px</span> •{" "}
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetSelection}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 transition shadow-2xs"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              Import Different Image
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Preview thumbnail */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl bg-blue-50/30 border border-blue-100 p-5">
              <div className="relative flex items-center justify-center max-h-[300px] w-full overflow-hidden rounded-xl bg-white/80 p-2 shadow-inner border border-blue-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="max-h-[280px] w-auto max-w-full rounded-lg object-contain shadow-xs"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 font-bold bg-blue-100/60 px-3 py-1 rounded-full">
                <span>Aspect Ratio: {aspectRatio ? aspectRatio.toFixed(2) : "1.00"}:1</span>
              </div>
            </div>

            {/* Right: Resize Settings */}
            <div className="lg:col-span-7 space-y-6">
              {/* Dimension Inputs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-slate-900">
                    Target Dimensions (Pixels)
                  </label>
                  <button
                    type="button"
                    onClick={() => setLockRatio(!lockRatio)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      lockRatio
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {lockRatio ? (
                      <>
                        <LockIcon className="w-3.5 h-3.5" /> Ratio Locked
                      </>
                    ) : (
                      <>
                        <UnlockIcon className="w-3.5 h-3.5" /> Ratio Unlocked
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Width (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      placeholder="e.g. 1920"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Height (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      placeholder="e.g. 1080"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Percentage Scale */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Scale Percentage
                </label>
                <div className="flex flex-wrap gap-2">
                  {PERCENT_SCALES.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyPercentScale(pct)}
                      className="rounded-xl border border-blue-100 bg-blue-50/40 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition hover:border-blue-500 hover:bg-blue-600 hover:text-white hover:shadow-xs"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Social & Resolution Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Popular Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset.width, preset.height)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-blue-500 hover:bg-blue-50/60 hover:text-blue-700 shadow-2xs"
                    >
                      {preset.name} <span className="text-slate-400 font-normal">({preset.width}×{preset.height})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format, Quality, and Fit Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-blue-100 pt-5">
                {/* Format */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Output Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  >
                    <option value="JPEG">JPEG (Most Compatible)</option>
                    <option value="WEBP">WEBP (Recommended)</option>
                    <option value="PNG">PNG (Lossless / Transparent)</option>
                    <option value="AVIF">AVIF (Smallest Size)</option>
                  </select>
                </div>

                {/* Fit Mode */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Fit Mode
                  </label>
                  <select
                    value={fit}
                    onChange={(e) => setFit(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  >
                    <option value="cover">Cover (Crop to fill)</option>
                    <option value="contain">Contain (Keep all, pad)</option>
                    <option value="fill">Fill (Stretch exact)</option>
                    <option value="inside">Inside (Fit without crop)</option>
                  </select>
                </div>

                {/* Quality Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Quality</label>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {quality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <RefreshIcon className="w-4 h-4 animate-spin" />
                    Processing with Sharp Engine...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 text-sky-200" />
                    Resize & Optimize Image Now
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
