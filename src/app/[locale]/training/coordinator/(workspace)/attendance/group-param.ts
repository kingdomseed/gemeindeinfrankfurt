import { z } from "zod";

// ?group=N on the attendance pages; anything else shows every group.
export const groupParam = z.coerce.number().int().positive().optional().catch(undefined);
