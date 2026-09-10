/**
 * Helper utility to smoothly scroll to any target element by ID across tab changes and async DOM renders,
 * with retry logic and visual highlight animation.
 */

export function scrollToElement(
  elementId: string,
  options?: {
    highlight?: boolean;
    timeout?: number;
    block?: ScrollLogicalPosition;
    onFound?: (el: HTMLElement) => void;
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !elementId) {
    return Promise.resolve(false);
  }

  const timeout = options?.timeout ?? 3500;
  const highlight = options?.highlight !== false;
  const block = options?.block ?? 'center';
  const startTime = Date.now();

  return new Promise((resolve) => {
    const attempt = () => {
      const el = document.getElementById(elementId);
      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block });
        } catch {
          el.scrollIntoView();
        }

        if (highlight) {
          // Remove if already present, then force reflow to restart animation
          el.classList.remove('notification-highlight-target');
          void el.offsetWidth;
          el.classList.add('notification-highlight-target');

          setTimeout(() => {
            el.classList.remove('notification-highlight-target');
          }, 3200);
        }

        options?.onFound?.(el);
        resolve(true);
        return;
      }

      // Retry every 70ms until timeout is reached
      if (Date.now() - startTime < timeout) {
        setTimeout(attempt, 70);
      } else {
        resolve(false);
      }
    };

    // Defer slightly to allow React DOM mounting/tab switches to complete
    setTimeout(attempt, 60);
  });
}
