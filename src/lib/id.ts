/**
 * ID generation adapter. Switching to ULID, CUID2 or database-generated IDs is
 * a change to this file only.
 */
export type IdGenerator = () => string;

/** RFC 9562 v4 UUID, from the platform's crypto (no dependency). */
export const generateId: IdGenerator = () => crypto.randomUUID();
