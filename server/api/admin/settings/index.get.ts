import { apiSuccess } from "../../../utils/api";
import { requireAdmin } from "../../../utils/auth";
import { ADMIN_SETTING_DEFAULTS } from "../../../utils/settings";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const stored = await prisma.setting.findMany({ where: { group_name: "admin" } });
  const values: Record<string, any> = { ...ADMIN_SETTING_DEFAULTS };

  for (const setting of stored) values[setting.key] = setting.value;

  return apiSuccess(event, { group: "admin", values }, "Settings loaded successfully.");
});
