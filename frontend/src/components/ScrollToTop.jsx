/**
 * ScrollToTop
 *
 * - Hash link (e.g. /#contact): scrolls to the element, then immediately
 *   wipes the hash from the URL so the browser's native scroll-anchor
 *   behaviour can't lock the page at that element.
 *
 * - No hash: scrolls to the very top instantly on every pathname change.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');

      // Small delay so the target route has finished rendering
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // ⚠️ Remove the hash from the URL right after scrolling.
        // Without this, the browser treats #contact as a "scroll anchor"
        // and prevents the user from scrolling above that element.
        window.history.replaceState(null, '', pathname);
      }, 80);

      return () => clearTimeout(timer);
    } else {
      // Hard route change (no hash) → snap to top
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
