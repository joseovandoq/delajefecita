import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta la variable de entorno DATABASE_URL");
}

// En desarrollo, Next recarga este modulo en cada cambio: sin guardar el
// cliente en globalThis cada recarga abria un pool nuevo y dejaba el viejo
// abierto, hasta agotar las conexiones del pooler de Supabase (EMAXCONN).
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    prepare: false,
    // Ojo: si hay mas consultas simultaneas que `max`, postgres.js las
    // encola y contra el pooler de Supabase se quedan colgadas. Por eso las
    // paginas lanzan como maximo ~5 a la vez (ver resumen/queries.ts).
    max: 10,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
