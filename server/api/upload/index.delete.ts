import * as zod from "zod";

const schema = zod.object({
  url: zod
    .string({ message: "URL is required" })
    .url({ message: "URL is invalid" }),
});

export type DeleteUploadRequest = zod.infer<typeof schema>;

export default defineEventHandler(async (event) => {
  try {
    const body = schema.safeParse(await readBody(event));
    if (!body.success) {
      throw createError({
        statusCode: 400,
        statusMessage: body.error.issues
          .map((issue) => issue.message)
          .join(", "),
        data: {
          code: "INVALID_REQUEST",
        },
      });
    }
    const success = await deleteImage(body.data.url);
    if (!success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Image not found",
        data: {
          code: "IMAGE_NOT_FOUND",
        },
      });
    }
    return {
      status: 200,
      success: true,
      message: "Image deleted successfully",
    };
  } catch (error) {
    throw handleRequestError(error);
  }
});
