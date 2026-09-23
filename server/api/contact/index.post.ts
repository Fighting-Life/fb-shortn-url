

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = contactSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validasi gagal',
      data: parsed.error.flatten()
    })
  }

  return { ok: true }
})
