import { z } from "zod";

const allowedKeys = new Set<string>([...Object.keys(ADMIN_SETTING_DEFAULTS)]);

const updateItemSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  group_name: z.string().min(1).optional(),
});

const schema = z.union([
  z.object({ updates: z.array(updateItemSchema).min(1) }),
  updateItemSchema,
]);

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) {
      throw createError({
        status: 400,
        statusText: parsed.error.issues.map((i) => i.message).join(", "),
        data: {
          code: "INVALID_INPUT",
          message: parsed.error.issues.map((i) => i.message).join(", "),
        },
      });
    }

    const updates = (
      "updates" in parsed.data ? parsed.data.updates : [parsed.data]
    ).map((u) => ({
      key: u.key,
      group_name: u.group_name ?? "general",
      value: u.value === null ? "" : String(u.value),
    }));

    for (const u of updates) {
      if (!allowedKeys.has(u.key)) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid setting key",
          data: {
            code: "INVALID_SETTING_KEY",
            message: "Invalid setting key",
          },
        });
      }
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.setting.upsert({
          where: {
            setting_key_group_name_unique: {
              key: u.key,
              group_name: u.group_name,
            },
          },
          update: { value: u.value },
          create: { key: u.key, group_name: u.group_name, value: u.value },
        }),
      ),
    );

    setResponseStatus(event, 200);
    setSecurityHeaders(event);

    return {
      status: 200,
      success: true,
      message: "OK",
    };
  } catch (error) {
    throw handleRequestError(error);
  }
});
