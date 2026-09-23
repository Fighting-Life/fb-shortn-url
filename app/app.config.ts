export default defineAppConfig({
  ui: {
    colors: {
      primary: "green",
      secondary: "slate",
      success: "green",
      info: "blue",
      warning: "yellow",
      error: "red",
      neutral: "neutral",
      tertiary: "indigo",
      black: "black",
      white: "white",
    },
    button: {
      slots: {
        base: "active:scale-95 cursor-pointer font-semibold transition-transform",
      },
      defaultVariants: {
        size: "lg",
        color: "neutral",
        variant: "solid",
      },
    },
    input: {
      slots: {},
      defaultVariants: {
        size: "xl",
        color: "neutral",
        variant: "outline",
      },
    },
    pageHero: {
      slots: {
        container: "py-18 sm:py-24 lg:py-32",
        title: "mx-auto text-3xl sm:text-4xl lg:text-5xl",
        description:
          "mt-2 text-md mx-auto max-w-2xl text-pretty sm:text-md text-muted",
      },
    },
    icons: {
      light: "i-ph-sun",
      dark: "i-ph-moon",
    },
  },
});
