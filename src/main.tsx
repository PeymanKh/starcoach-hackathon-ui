import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "./index.css";
import App from "./App";
import StatesPlayground from "./pages/StatesPlayground";

// TEMPORARY: /playground shows every agent state for design review.
const Root = window.location.pathname.startsWith("/playground") ? StatesPlayground : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* reducedMotion="user" → every motion animation respects the OS setting */}
    <MotionConfig reducedMotion="user">
      <Root />
    </MotionConfig>
  </StrictMode>,
);
