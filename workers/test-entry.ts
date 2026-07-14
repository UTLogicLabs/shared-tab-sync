import { RoomObject } from "../app/durable-objects/RoomObject";

export { RoomObject };

export default {
  fetch() {
    return new Response("test entry — not used for SSR", { status: 404 });
  },
} satisfies ExportedHandler;
