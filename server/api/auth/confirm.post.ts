export default defineEventHandler(async (event) => {
  try {
    const response = await event.context.handler?.auth.confirmEmail();
    if (response instanceof H3Error) throw response;

    setResponseStatus(event, 200);

    return {
      status: 200,
      success: true,
      message: response?.message || "Email confirmed successfully.",
      data: response?.data || {},
    };
  } catch (error) {
    throw handleRequestError(error);
  }
});
