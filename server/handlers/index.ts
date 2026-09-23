import { H3Event } from "h3";
import { AuthHandler } from "./auth";
import { UserHandler } from "./user";


export class ServerHandler {
  public readonly auth: InstanceType<typeof AuthHandler>;
  public readonly user: InstanceType<typeof UserHandler>;
  constructor(event: H3Event) {
    this.auth = new AuthHandler(event);
    this.user = new UserHandler(event);
  }
}
