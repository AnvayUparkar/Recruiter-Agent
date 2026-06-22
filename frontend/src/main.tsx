import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./providers/ThemeProvider";
import { router } from "./routes";
import { usePWAStore } from "./store/pwaStore";
import "./index.css";

// ─── PWA & Service Worker Registration ─────────────────────────────────────────
if (typeof window !== "undefined") {
  // Register Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registration successful with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("[PWA] Service Worker registration failed:", err);
        });
    });
  }

  // Intercept the browser install prompt trigger
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    usePWAStore.getState().setInstallPrompt(e);
  });

  // Track app installation completion
  window.addEventListener("appinstalled", () => {
    usePWAStore.getState().setInstalled(true);
    console.log("[PWA] Application was installed successfully!");
  });

  // Monitor network status dynamically
  window.addEventListener("online", () => {
    usePWAStore.getState().setOnline(true);
  });

  window.addEventListener("offline", () => {
    usePWAStore.getState().setOnline(false);
  });
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
