import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getOriginalPath, getResizedPath } from "../../../lib/storage";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "resized";
    const download = searchParams.get("download") === "1";

    let filePath: string | null = null;
    let fileName = "image";
    let mimeType = "image/jpeg";

    if (type === "original") {
      const image = await prisma.image.findUnique({
        where: { id },
      });

      if (!image || image.userId !== user.id) {
        return new NextResponse("Not found", { status: 404 });
      }

      filePath = getOriginalPath(image.storageKey);
      fileName = image.originalName;
      mimeType = image.mimeType;
    } else {
      // Look up ResizeJob by id
      const job = await prisma.resizeJob.findUnique({
        where: { id },
        include: { image: true },
      });

      if (!job || job.userId !== user.id || !job.outputKey) {
        return new NextResponse("Not found", { status: 404 });
      }

      filePath = getResizedPath(job.outputKey);
      const ext = path.extname(job.outputKey);
      const baseName = path.parse(job.image.originalName).name;
      fileName = `${baseName}_${job.width || "auto"}x${job.height || "auto"}${ext}`;

      switch (job.format) {
        case "PNG":
          mimeType = "image/png";
          break;
        case "WEBP":
          mimeType = "image/webp";
          break;
        case "AVIF":
          mimeType = "image/avif";
          break;
        case "JPEG":
        default:
          mimeType = "image/jpeg";
          break;
      }
    }

    try {
      const fileBuffer = await fs.readFile(filePath);

      const headers: Record<string, string> = {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=86400",
      };

      const safeFileName = fileName.replace(/["\r\n]/g, "_");
      const encodedFileName = encodeURIComponent(fileName);

      if (download) {
        headers["Content-Disposition"] = `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`;
      } else {
        headers["Content-Disposition"] = `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`;
      }

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (readError) {
      console.error("Error reading image file:", readError);
      return new NextResponse("File missing on server", { status: 404 });
    }
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
