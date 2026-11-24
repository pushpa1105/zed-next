import "server-only";

/**
 * Server-only public API of the `todos` feature: data reads and services.
 * Importing this from a Client Component fails the build (via `server-only`).
 */
export { getTodos } from "./queries/get-todos";
export { todoService } from "./services/todo.service";
