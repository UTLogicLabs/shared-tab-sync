import { createRequestHandler } from "@react-router/cloudflare";
import * as build from "virtual:react-router/server-build";

interface Env {
  shared_tab_sync_db: D1Database;
}

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const handler = createRequestHandler({ build, mode: import.meta.env.MODE });

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
