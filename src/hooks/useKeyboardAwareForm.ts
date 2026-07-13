// ============================================================
// useKeyboardAwareForm — keeps the focused field visible on mobile
// ============================================================

"use client";

import { useEffect } from "react";

const FIELD_SELECTOR = "input, select, textarea";

// Gap to keep between the focused field and the top of the keyboard.
const CLEARANCE_PX = 24;

/**
 * On phones the on-screen keyboard covers the lower half of the screen without
 * resizing the layout viewport, so a focused field near the bottom of the form
 * ends up hidden behind it. Browsers only scroll the field into view on their
 * own terms, and Android in particular often doesn't.
 *
 * visualViewport reports the area *not* covered by the keyboard, so we compare
 * the focused field against it and scroll only when it's actually obscured.
 * Falls back to doing nothing where visualViewport is unsupported — the CSS
 * scroll-margin rules in globals.css still apply there.
 */
export function useKeyboardAwareForm() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const ensureVisible = () => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement) || !el.matches(FIELD_SELECTOR)) return;

      const field = el.getBoundingClientRect();
      const keyboardTop = vv.height + vv.offsetTop;

      if (field.bottom + CLEARANCE_PX > keyboardTop) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    };

    // The keyboard animates open, so the viewport resize lands after focus.
    // Listen to both: focus catches field-to-field moves while the keyboard is
    // already up, resize catches the initial open.
    const onFocusIn = () => window.setTimeout(ensureVisible, 300);

    document.addEventListener("focusin", onFocusIn);
    vv.addEventListener("resize", ensureVisible);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      vv.removeEventListener("resize", ensureVisible);
    };
  }, []);
}
