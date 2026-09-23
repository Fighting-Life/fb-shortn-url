import { readMultipartFormData } from "h3";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const parts = await readMultipartFormData(event);
    if (!parts) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid multipart form data",
      });
    }

    const filePart = parts.find(
      (p) => p.name === "file" && p.filename && p.data,
    );
    if (!filePart || !filePart.filename || !filePart.data) {
      throw createError({
        statusCode: 400,
        statusMessage: "File is required",
      });
    }

    const folderPart = parts.find((p) => p.name === "folder");

    const folder = folderPart?.data
      ? folderPart.data.toString("utf8").trim()
      : undefined;

    const settings = await getSetupConfig();
    const maxFileSize = buildMaxFileSizeFromSettings(settings);

    const check = validateFile(
      filePart.type || "application/octet-stream",
      filePart.data.length,
      filePart.filename,
      maxFileSize,
    );

    if (!check.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: check.error || "Invalid file",
      });
    }

    const uploaded = await uploadImage(filePart.data, folder || "settings");

    return {
      status: 200,
      success: true,
      message: "File uploaded successfully",
      data: uploaded,
    };
  } catch (err) {
    throw handleRequestError(err);
  }
});
