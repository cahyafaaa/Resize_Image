"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import {
  getImageMetadata,
  processImage,
  ImageFitOption,
  ImageFormatOption,
} from "../lib/image-processor";
import {
  saveOriginalImage,
  saveResizedImage,
  deleteStorageFile,
} from "../lib/storage";

export interface ResizeActionResult {
  success: boolean;
  message?: string;
  data?: {
    jobId: string;
    imageId: string;
    originalName: string;
    originalWidth: number;
    originalHeight: number;
    originalSize: number;
    resizedWidth: number;
    resizedHeight: number;
    resizedSize: number;
    format: string;
    quality: number;
    fit: string;
    previewUrl: string;
    downloadUrl: string;
    originalUrl: string;
    savedPercentage: number;
    createdAt: string;
  };
}

export interface ResizeHistoryItem {
  id: string;
  originalName: string;
  originalWidth: number | null;
  originalHeight: number | null;
  originalSize: number;
  resizedWidth: number | null;
  resizedHeight: number | null;
  resizedSize: number | null;
  format: string;
  quality: number | null;
  status: string;
  createdAt: string;
  previewUrl: string;
  downloadUrl: string;
}

export async function resizeImageAction(formData: FormData): Promise<ResizeActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "Please log in to resize images." };
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, message: "Please select an image file to upload." };
    }

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, message: "File size exceeds the 25MB limit." };
    }

    // Parameters
    const widthStr = formData.get("width")?.toString();
    const heightStr = formData.get("height")?.toString();
    const fitStr = (formData.get("fit")?.toString() || "cover") as ImageFitOption;
    const qualityStr = formData.get("quality")?.toString() || "85";
    const formatStr = (formData.get("format")?.toString() || "JPEG") as ImageFormatOption;

    const width = widthStr ? parseInt(widthStr, 10) : undefined;
    const height = heightStr ? parseInt(heightStr, 10) : undefined;
    const quality = Math.min(100, Math.max(1, parseInt(qualityStr, 10) || 85));

    if ((width && (isNaN(width) || width <= 0)) || (height && (isNaN(height) || height <= 0))) {
      return { success: false, message: "Width and height must be positive numbers." };
    }

    if (!width && !height) {
      return { success: false, message: "Please provide at least a target width or height." };
    }

    const fileArrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(fileArrayBuffer);

    // Get original metadata
    const originalMeta = await getImageMetadata(inputBuffer);

    // Save original image to disk
    const { storageKey } = await saveOriginalImage(inputBuffer, file.name);

    // Save image to database
    const imageRecord = await prisma.image.create({
      data: {
        userId: user.id,
        originalName: file.name,
        storageKey,
        mimeType: file.type || "image/jpeg",
        size: file.size,
        width: originalMeta.width,
        height: originalMeta.height,
      },
    });

    // Process with sharp
    const processed = await processImage(inputBuffer, {
      width,
      height,
      fit: fitStr,
      quality,
      format: formatStr,
    });

    // Save resized image to disk
    const { outputKey } = await saveResizedImage(processed.buffer, processed.format);

    // Save resize job to database
    const resizeJob = await prisma.resizeJob.create({
      data: {
        userId: user.id,
        imageId: imageRecord.id,
        width: processed.width,
        height: processed.height,
        quality,
        format: processed.format,
        outputKey,
        outputSize: processed.size,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");

    const savedPercentage = originalMeta.size > 0
      ? Math.round(((originalMeta.size - processed.size) / originalMeta.size) * 100)
      : 0;

    return {
      success: true,
      data: {
        jobId: resizeJob.id,
        imageId: imageRecord.id,
        originalName: file.name,
        originalWidth: originalMeta.width,
        originalHeight: originalMeta.height,
        originalSize: originalMeta.size,
        resizedWidth: processed.width,
        resizedHeight: processed.height,
        resizedSize: processed.size,
        format: processed.format,
        quality,
        fit: fitStr,
        previewUrl: `/api/images/${resizeJob.id}?type=resized`,
        downloadUrl: `/api/images/${resizeJob.id}?type=resized&download=1`,
        originalUrl: `/api/images/${imageRecord.id}?type=original`,
        savedPercentage,
        createdAt: resizeJob.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Failed to process image:", error);
    return {
      success: false,
      message: error?.message || "Failed to process image. Please try again.",
    };
  }
}

export async function getRecentResizeJobs(): Promise<ResizeHistoryItem[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const jobs = await prisma.resizeJob.findMany({
      where: { userId: user.id },
      include: { image: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return jobs.map((job) => ({
      id: job.id,
      originalName: job.image.originalName,
      originalWidth: job.image.width,
      originalHeight: job.image.height,
      originalSize: job.image.size,
      resizedWidth: job.width,
      resizedHeight: job.height,
      resizedSize: job.outputSize,
      format: job.format,
      quality: job.quality,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      previewUrl: `/api/images/${job.id}?type=resized`,
      downloadUrl: `/api/images/${job.id}?type=resized&download=1`,
    }));
  } catch (error) {
    console.error("Failed to fetch resize history:", error);
    return [];
  }
}

export async function deleteResizeJobAction(jobId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const job = await prisma.resizeJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.userId !== user.id) {
      return { success: false, message: "Job not found" };
    }

    // Delete disk file
    if (job.outputKey) {
      await deleteStorageFile(job.outputKey, true);
    }

    await prisma.resizeJob.delete({
      where: { id: jobId },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete resize job:", error);
    return { success: false, message: error?.message || "Failed to delete" };
  }
}

export interface ImportedImageData {
  name: string;
  type: string;
  size: number;
  base64: string;
  width: number;
  height: number;
}

export async function importImageFromUrlAction(
  imageUrl: string
): Promise<{ success: boolean; message?: string; data?: ImportedImageData }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "Please log in first." };
    }

    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return { success: false, message: "Please enter a valid HTTP or HTTPS image URL." };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(trimmedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ImageResizer/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch image from URL (Server responded with HTTP ${response.status}).`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("image") && !contentType.includes("octet-stream")) {
      return {
        success: false,
        message: "The URL does not point to a valid image file.",
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 25 * 1024 * 1024) {
      return { success: false, message: "Imported image exceeds 25MB size limit." };
    }

    const meta = await getImageMetadata(buffer);
    const parsedUrl = new URL(trimmedUrl);
    let fileName = parsedUrl.pathname.split("/").pop()?.split("?")[0] || "";
    if (!fileName || !fileName.includes(".")) {
      fileName = `imported_image_${Date.now()}.${meta.format.toLowerCase()}`;
    }

    const base64 = `data:${contentType || "image/jpeg"};base64,${buffer.toString("base64")}`;

    return {
      success: true,
      data: {
        name: fileName,
        type: contentType || `image/${meta.format.toLowerCase()}`,
        size: buffer.length,
        base64,
        width: meta.width,
        height: meta.height,
      },
    };
  } catch (error: any) {
    console.error("Error importing image from URL:", error);
    return {
      success: false,
      message: error?.message || "Failed to download image from the provided URL.",
    };
  }
}

export interface UserLibraryImage {
  id: string;
  originalName: string;
  size: number;
  width: number | null;
  height: number | null;
  mimeType: string;
  createdAt: string;
  previewUrl: string;
}

export async function getUserLibraryImages(): Promise<UserLibraryImage[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const images = await prisma.image.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    return images.map((img) => ({
      id: img.id,
      originalName: img.originalName,
      size: img.size,
      width: img.width,
      height: img.height,
      mimeType: img.mimeType,
      createdAt: img.createdAt.toISOString(),
      previewUrl: `/api/images/${img.id}?type=original`,
    }));
  } catch (error) {
    console.error("Failed to fetch user library images:", error);
    return [];
  }
}

