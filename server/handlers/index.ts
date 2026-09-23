import { H3Event } from "h3";
import { AuthHandler } from "./auth";

export class ServerHandler {
  public readonly auth: InstanceType<typeof AuthHandler>;
  constructor(event: H3Event) {
    this.auth = new AuthHandler(event);
  }
}
