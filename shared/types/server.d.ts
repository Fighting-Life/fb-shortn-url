import type { User, UserSession } from "#auth-utils";
import "h3";
import type { ServerHandler } from "../../server/handlers/index";

declare module "#app" {
  interface NuxtApp {}
}
declare module "nitropack" {
  interface NitroApp {}
  interface NitroRuntimeHooks {}
}
declare module "h3" {
  interface H3EventContext {
    handler: ServerHandler | null;
    userSession: UserSession | null;
    currentUser: User | null;
  }
}
