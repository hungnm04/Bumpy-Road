import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget = process.env.VITE_BACKEND_TARGET || "http://localhost:5000";
const proxiedPaths = [
  "/api",
  "/admin",
  "/auth-status",
  "/create-account",
  "/faq",
  "/featured-places",
  "/login",
  "/logout",
  "/mountains",
  "/notifications",
  "/places",
  "/profile",
  "/refresh-token",
  "/storage",
  "/upload-avatar",
];

const bypassHtmlNavigation = (req) =>
  req.headers.accept?.includes("text/html") ? "/index.html" : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: proxiedPaths.reduce(
      (proxy, route) => ({
        ...proxy,
        [route]: {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          bypass: bypassHtmlNavigation,
        },
      }),
      {}
    ),
  },
});
