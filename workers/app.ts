import { createRequestHandler } from "@react-router/cloudflare";
import * as build from "virtual:react-router/server-build";
import { RoomObject, type Env } from "../app/durable-objects/RoomObject";

export { RoomObject };

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const mode = import.meta.env?.MODE === "development" ? "development" : "production";
const handler = createRequestHandler({ build, mode });

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // createRequestHandler types as PagesFunction; cast to accept this Worker-shaped context
    return (handler as (ctx: unknown) => Promise<Response>)({
      request,
      env,
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException.bind(ctx),
    });
  },
} satisfies ExportedHandler<Env>;
