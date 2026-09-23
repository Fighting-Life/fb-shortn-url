import type { User, UserSession } from "#auth-utils";
import type { Redis } from "@upstash/redis";
import "h3";
import type { H3Event } from "h3";
import type { ServerHandler } from "../../server/handlers/index";

declare global {
  function getUserSession(event: H3Event): Promise<UserSession>;
  function setUserSession(
    event: H3Event,
    data: Omit<UserSession, "id">,
    config?: Record<string, unknown>,
  ): Promise<UserSession>;
  function clearUserSession(event: H3Event): Promise<boolean>;
  function useNodeMailer(): {
    sendMail(options: {
      to: string;
      subject: string;
      text: string;
    }): Promise<unknown>;
  };
  function useRedis(event: H3Event): {
    redis: Redis | null;
    setRedis(redis: Redis): void;
  };
}

declare module "#app" {
  interface NuxtApp { }
}
declare module "nitropack" {
  interface NitroApp { }
  interface NitroRuntimeHooks { }
}
declare module "h3" {
  interface H3EventContext {
    handler: ServerHandler | null;
    userSession: UserSession | null;
    currentUser: User | null;
  }
}
