import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Shared Tab Sync" },
  {
    name: "description",
    content: "A live shared board for tabs your team is triaging together.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-lg text-center px-6">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Shared Tab Sync</h1>
        <p className="text-muted-foreground">
          Create a room and share the code — links you paste show up live for
          everyone.
        </p>
      </div>
    </main>
  );
}
