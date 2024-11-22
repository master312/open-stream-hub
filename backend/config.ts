const nodeMediaServerCfg = {
  rtmp: {
    port: 1935,
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
  mongodbUrl: "mongodb://localhost:27017",
  injestRtmpServer: {
    ...nodeMediaServerCfg,
    publicUrl: "rtmp://localhost:" + nodeMediaServerCfg.rtmp.port,
    linkRoot: "/live",
  },
};
