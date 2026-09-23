import { v2 as cloudinary } from "cloudinary";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function extractPublicIdFromUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);

    if (!url.hostname.includes("cloudinary.com")) {
      console.warn("No Cloudinary URL:", imageUrl);
      return null;
    }

    const pathParts = url.pathname.split("/");

    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return null;

    let relevantParts = pathParts.slice(uploadIndex + 1);

    if (relevantParts[0]?.match(/^v\d+$/)) {
      relevantParts = relevantParts.slice(1);
    }

    const fullPath = relevantParts.join("/");
    const publicId =
      fullPath.substring(0, fullPath.lastIndexOf(".")) || fullPath;

    return publicId || null;
  } catch (error) {
    console.error("Gagal extract public_id:", error);
    return null;
  }
}
export async function uploadImage(
  source: string | Buffer,
  folder = "snapland/products",
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof source === "string"
      ? source
      : `data:image/jpeg;base64,${source.toString("base64")}`,
    {
      folder,
      resource_type: "image",
      transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
    },
  );

  return {
    url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    const publicId = extractPublicIdFromUrl(imageUrl);

    if (!publicId) {
      console.error("Tidak bisa extract public_id dari URL:", imageUrl);
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch {
    return false;
  }
}
export async function uploadBase64Image(
  base64: string,
  mimeType = "image/jpeg",
  folder = "snapland/products",
): Promise<UploadResult> {
  const dataUrl = base64.startsWith("data:")
    ? base64
    : `data:${mimeType};base64,${base64}`;
  return uploadImage(dataUrl, folder);
}

// ── MIME type → MediaType mapping ─────────────────────────────────────────────
export function detectMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType === "text/plain" ||
    mimeType === "text/markdown"
  )
    return "DOCUMENT";
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("python") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("json") ||
    mimeType.includes("yaml") ||
    mimeType.includes("xml")
  )
    return "CODE";
  return "OTHER";
}

/** Extension file yang diizinkan */
export const ALLOWED_EXTENSIONS: Record<MediaType, string[]> = {
  IMAGE: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  VIDEO: [".mp4", ".webm", ".mov"],
  AUDIO: [".mp3", ".wav", ".ogg", ".m4a"],
  DOCUMENT: [".pdf", ".doc", ".docx", ".txt", ".md"],
  CODE: [
    ".html",
    ".css",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".json",
    ".yaml",
    ".yml",
    ".py",
    ".sh",
  ],
  ARCHIVE: [".zip", ".tar", ".gz"],
  OTHER: [], // Semua ekstensi diizinkan untuk tipe OTHER, tapi tetap divalidasi berdasarkan MIME type
};

/** Max file size per tipe (bytes) */
export const MAX_FILE_SIZE: Record<MediaType, number> = {
  IMAGE: 10 * 1024 * 1024, // 10 MB
  VIDEO: 500 * 1024 * 1024, // 500 MB
  AUDIO: 50 * 1024 * 1024, // 50 MB
  DOCUMENT: 20 * 1024 * 1024, // 20 MB
  CODE: 5 * 1024 * 1024, // 5 MB
  ARCHIVE: 100 * 1024 * 1024, // 100 MB
  OTHER: 10 * 1024 * 1024, // 10 MB
};

export function buildMaxFileSizeFromSettings(settings?: {
  max_upload_size_mb?: number;
  max_upload_image_mb?: number;
  max_upload_video_mb?: number;
  max_upload_audio_mb?: number;
  max_upload_document_mb?: number;
  max_upload_code_mb?: number;
  max_upload_archive_mb?: number;
}): Record<MediaType, number> {
  const toBytes = (mb?: number) =>
    typeof mb === "number" && Number.isFinite(mb) && mb > 0
      ? Math.round(mb * 1024 * 1024)
      : undefined;

  const all = toBytes(settings?.max_upload_size_mb);

  return {
    IMAGE: toBytes(settings?.max_upload_image_mb) ?? all ?? MAX_FILE_SIZE.IMAGE,
    VIDEO: toBytes(settings?.max_upload_video_mb) ?? all ?? MAX_FILE_SIZE.VIDEO,
    AUDIO: toBytes(settings?.max_upload_audio_mb) ?? all ?? MAX_FILE_SIZE.AUDIO,
    DOCUMENT:
      toBytes(settings?.max_upload_document_mb) ??
      all ??
      MAX_FILE_SIZE.DOCUMENT,
    CODE: toBytes(settings?.max_upload_code_mb) ?? all ?? MAX_FILE_SIZE.CODE,
    ARCHIVE:
      toBytes(settings?.max_upload_archive_mb) ?? all ?? MAX_FILE_SIZE.ARCHIVE,
    OTHER: all ?? MAX_FILE_SIZE.OTHER,
  };
}

export function validateFile(
  mimeType: string,
  size: number,
  filename: string,
  maxFileSize: Record<MediaType, number> = MAX_FILE_SIZE,
): { valid: boolean; error?: string } {
  const type = detectMediaType(mimeType);
  const maxSize = maxFileSize[type];
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = ALLOWED_EXTENSIONS[type];

  if (size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return {
      valid: false,
      error: `Ukuran file maksimal ${maxMB}MB untuk tipe ${type}.`,
    };
  }

  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Ekstensi "${ext}" tidak diizinkan. Gunakan: ${allowedExts.join(", ")}`,
    };
  }

  return { valid: true };
}
