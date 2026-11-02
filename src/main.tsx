import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const router = createRouter({ routeTree, scrollRestoration: true, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// The build bakes each page's tags into its HTML for link-preview scrapers; the router's
// head() manages them from here on, so drop the static copies to avoid duplicates.
for (const tag of document.head.querySelectorAll("[data-prerendered]")) tag.remove();

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
