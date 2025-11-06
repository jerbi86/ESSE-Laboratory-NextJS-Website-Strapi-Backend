import { parse } from "pg-connection-string";

export default ({ env }) => {
  // Prefer a single DATABASE_URL if present
  const url = env("DATABASE_URL");

  // Parse URL (only if defined), otherwise use discrete vars
  const parsed = url ? parse(url) : ({} as any);

  const host = parsed.host ?? env("DATABASE_HOST");
  const port = parsed.port ? Number(parsed.port) : env.int("DATABASE_PORT", 5432);
  const database = parsed.database ?? env("DATABASE_NAME");
  const user = parsed.user ?? env("DATABASE_USERNAME");
  const password = parsed.password ?? env("DATABASE_PASSWORD");

  // Handle CA (PEM pasted directly OR base64-encoded)
  const rawCA = env("DATABASE_CA");
  const ca =
    rawCA
      ? (rawCA.trim().startsWith("-----BEGIN")
          ? rawCA
          : Buffer.from(rawCA, "base64").toString("utf8"))
      : undefined;

  const sslEnabled = env.bool("DATABASE_SSL", true);
  const rejectUnauthorized = env.bool("DATABASE_SSL_REJECT", true);

  return {
    connection: {
      client: "postgres",
      connection: {
        host,
        port,
        database,
        user,
        password,
        ssl: sslEnabled
          ? {
              ca, // fine if undefined
              rejectUnauthorized,
            }
          : false,
      },
      pool: { min: 0, max: 10 },
    },
    debug: false,
  };
};
