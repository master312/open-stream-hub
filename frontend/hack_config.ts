// A hacky way of solving vite & env variables problem... TODO: do properly some day

function isDenoEnvironment(): boolean {
  return typeof (globalThis as any).Deno !== "undefined";
}

export function getConfig() {
  if (isDenoEnvironment()) {
    // Deno environment (dev)
    return {
      FRONTEND_PORT: (globalThis as any).Deno.env.get("FRONTEND_PORT"),
      REST_API_HOST: (globalThis as any).Deno.env.get("REST_API_HOST"),
      REST_API_PORT: (globalThis as any).Deno.env.get("REST_API_PORT"),
    };
  }

  // Node environment (build)
  return {
    FRONTEND_PORT: process.env.FRONTEND_PORT,
    REST_API_HOST: process.env.REST_API_HOST,
    REST_API_PORT: process.env.REST_API_PORT,
  };
}
