import { getPrisma } from "~/db.server";
import type { Route } from "./+types/room";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { env } = context.cloudflare;
  const prisma = getPrisma(env.shared_tab_sync_db);
  const room = await prisma.room.findUnique({ where: { code: params.code } });

  if (!room || room.expiresAt < new Date()) {
    throw new Response("Not Found", { status: 404 });
  }

  const snapshot = await env.ROOM.getByName(params.code).getSnapshot();
  return { code: params.code, snapshot };
}

export default function Room({ loaderData }: Route.ComponentProps) {
  const { code, snapshot } = loaderData;

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-lg text-center px-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Room {code}</h1>
        <p className="text-muted-foreground">
          Durable Object reachable — snapshot code: {snapshot.code}
        </p>
      </div>
    </main>
  );
}
