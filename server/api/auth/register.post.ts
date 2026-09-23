export default defineEventHandler(async (event) => {
  try {
    const response = await event.context.handler?.auth.signup();
    if (response instanceof H3Error) throw response;

    setResponseStatus(event, 200);

    return {
      status: 200,
      success: true,
      message: "Registration successful.",
      ...response,
    };
  } catch (error) {
    throw handleRequestError(error);
  }
});
