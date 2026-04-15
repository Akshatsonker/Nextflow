import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_fliizbfkcpivtwosvcjs", // your real project ID

  maxDuration: 60, // ✅ REQUIRED

  logLevel: "log",

  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },

  dirs: ["./src/trigger"],
});