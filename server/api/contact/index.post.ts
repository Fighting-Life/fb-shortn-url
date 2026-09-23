

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const parsed = contactSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validasi gagal',
      data: parsed.error.flatten()
    })
  }

  try {
    const { sendMail } = useNodeMailer()

    await sendMail({
      to: config.DEFAULT_ADMIN_EMAIL,
      subject: `Contact Form: ${parsed.data.name} - ${parsed.data.company ?? 'Unknown'}`,
      text: parsed.data.message
    })
  } catch (error) {
    console.error(error)
  }

  return { ok: true }
})
