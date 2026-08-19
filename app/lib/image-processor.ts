import sharp from "sharp";

export type ImageFormatOption = "JPEG" | "PNG" | "WEBP" | "AVIF";
export type ImageFitOption = "cover" | "contain" | "fill" | "inside" | "outside";

export interface ProcessImageOptions {
  width?: number;
  height?: number;
  fit?: ImageFitOption;
  quality?: number;
  format?: ImageFormatOption;
}

export interface ImageMetadataInfo {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: ImageFormatOption;
  mimeType: string;
}

export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadataInfo> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: (metadata.format || "jpeg").toUpperCase(),
    size: buffer.length,
  };
}

export async function processImage(
  inputBuffer: Buffer,
  options: ProcessImageOptions
): Promise<ProcessedImageResult> {
  const {
    width,
    height,
    fit = "cover",
    quality = 85,
    format = "JPEG",
  } = options;

  let pipeline = sharp(inputBuffer);

  // Apply rotate based on EXIF
  pipeline = pipeline.rotate();

  // Resize if width or height provided
  if (width || height) {
    pipeline = pipeline.resize({
      width: width ? Math.round(width) : undefined,
      height: height ? Math.round(height) : undefined,
      fit: fit,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    });
  }

  // Format and compression
  let targetMimeType = "image/jpeg";
  const safeQuality = Math.min(100, Math.max(1, Math.round(quality)));

  switch (format.toUpperCase()) {
    case "PNG":
      pipeline = pipeline.png({
        quality: safeQuality,
        compressionLevel: 9,
      });
      targetMimeType = "image/png";
      break;

    case "WEBP":
      pipeline = pipeline.webp({
        quality: safeQuality,
        effort: 4,
      });
      targetMimeType = "image/webp";
      break;

    case "AVIF":
      pipeline = pipeline.avif({
        quality: safeQuality,
        effort: 4,
      });
      targetMimeType = "image/avif";
      break;

    case "JPEG":
    default:
      pipeline = pipeline.jpeg({
        quality: safeQuality,
        mozjpeg: true,
      });
      targetMimeType = "image/jpeg";
      break;
  }

  const { data: outputBuffer, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer: outputBuffer,
    width: info.width,
    height: info.height,
    size: outputBuffer.length,
    format: format.toUpperCase() as ImageFormatOption,
    mimeType: targetMimeType,
  };
}
