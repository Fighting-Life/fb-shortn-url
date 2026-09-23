import mitt from "mitt";

type ApplicationEvent = {
  "search:open": boolean;
};

export default defineNuxtPlugin(() => {
  const emitter = mitt<ApplicationEvent>();

  return {
    provide: {
      event: emitter.emit,
      listen: emitter.on,
      off: emitter.off,
    },
  };
});
