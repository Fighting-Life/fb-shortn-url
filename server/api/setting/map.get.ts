export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const settings = await prisma.setting.findMany({
    select: { key: true, value: true, group_name: true },
    orderBy: [{ group_name: "asc" }, { key: "asc" }],
  });

  const groups: Record<string, Record<string, string>> = {};

  for (const s of settings) {
    groups[s.group_name] ||= {};
    groups[s.group_name]![s.key] = s.value;
  }

  return { groups };
});
