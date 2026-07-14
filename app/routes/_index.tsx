import type { MetaFunction } from "react-router";
import { Form, redirect } from "react-router";
import { createRoom } from "~/lib/rooms.server";
import type { Route } from "./+types/_index";

export const meta: MetaFunction = () => [
  { title: "Shared Tab Sync" },
  {
    name: "description",
    content: "A live shared board for tabs your team is triaging together.",
  },
];

export async function action({ context }: Route.ActionArgs) {
  const code = await createRoom(context.cloudflare.env);
  return redirect(`/r/${code}`);
}

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-lg text-center px-6">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Shared Tab Sync</h1>
        <p className="text-muted-foreground mb-6">
          Create a room and share the code — links you paste show up live for
          everyone.
        </p>
        <Form method="post">
          <button
            type="submit"
            className="rounded-md bg-foreground text-background px-4 py-2 font-medium"
          >
            Create a room
          </button>
        </Form>
      </div>
    </main>
  );
}
