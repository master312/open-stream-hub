
export const TheConfig = {
  environment: process.env.NODE_ENV,
  port: process.env.REST_API_PORT,
  publicInjectUrl: process.env.RTMP_INJECT_PUBLIC_URL,
  database: {
    mongo: {
      uri: process.env.MONGODB_URI,
      options: {},
    },
  },
  nodeMediaServer: {
    rtmp: {
      port: Number(process.env.RTMP_SERVER_PORT),
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60,
    }
  },
};