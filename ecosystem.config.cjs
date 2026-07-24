// PM2 config for the Nuvio production server (Next.js standalone).
// Runs the standalone server on a loopback port behind the nginx reverse proxy.
module.exports = {
  apps: [
    {
      name: "nuvio",
      script: "server.js",
      cwd: "/opt/nuvio/.next/standalone",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "3020",
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
