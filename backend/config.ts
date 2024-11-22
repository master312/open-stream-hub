const nodeMediaServerCfg = {
  rtmp: {
    port: Deno.env.get("RTMP_INJECT_PORT"),
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    allow_origin: "*",
  },
};

export const config = {
  backendPort: Deno.env.get("BACKEND_PORT"),
  mongodbUrl: Deno.env.get("MONGODB_URI"),
  mongoDbName: Deno.env.get("MONGODB_DB_NAME"),
  injestRtmpServer: {
    ...nodeMediaServerCfg,
    publicUrl: (
      Deno.env.get("RTMP_INJECT_PUBLIC_URL") +
      ":" +
      nodeMediaServerCfg.rtmp.port
    ).replace(/(?<!:)\/\//g, ""),
    linkRoot: Deno.env.get("RTMP_INJECT_LINK_ROOT").replace("/", ""),
  },
};
