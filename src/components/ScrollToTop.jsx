import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll position for window, document, and custom scroll containers (.lms-content, etc.)
 */
export const resetAllScrolls = (instant = true) => {
  const behavior = instant ? 'instant' : 'auto';

  // 1. Reset standard browser window / html / body
  try {
    window.scrollTo({ top: 0, left: 0, behavior });
  } catch {
    window.scrollTo(0, 0);
  }

  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }

  // 2. Reset LMS content and layout scroll containers
  const scrollContainers = document.querySelectorAll(
    '.lms-content, main, .lms-wrapper, [data-scroll-container]'
  );

  scrollContainers.forEach((container) => {
    if (container) {
      container.scrollTop = 0;
      container.scrollLeft = 0;
      if (typeof container.scrollTo === 'function') {
        try {
          container.scrollTo({ top: 0, left: 0, behavior });
        } catch {
          container.scrollTo(0, 0);
        }
      }
    }
  });
};

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  // Disable browser automatic scroll restoration so it doesn't fight SPA route transitions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Immediately reset scroll on route change
  useLayoutEffect(() => {
    resetAllScrolls(true);

    // Double check with requestAnimationFrame and micro-delay for async route renderers
    const rafId = requestAnimationFrame(() => {
      resetAllScrolls(true);
    });
    const timerId = setTimeout(() => {
      resetAllScrolls(true);
    }, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [pathname, search, hash]);

  // Handle section / tab / pagination clicks
  useEffect(() => {
    const handleSectionClick = (e) => {
      const target = e.target;
      if (!target || typeof target.closest !== 'function') return;

      // Check if user clicked a tab, section button, or pagination link
      const sectionTrigger = target.closest(
        'button.nav-link, .nav-pills button, .nav-pills .nav-link, .nav-tabs button, .nav-tabs .nav-link, [role="tab"], [data-bs-toggle="tab"], [data-bs-toggle="pill"], .pagination .page-link, .pagination button'
      );

      if (sectionTrigger) {
        // If the tab is inside an open modal or dialog, scroll that modal's body instead
        const modalBody = sectionTrigger.closest('.modal-body, .modal-content, .modal, [role="dialog"]');
        if (modalBody) {
          modalBody.scrollTop = 0;
          return;
        }

        // Otherwise reset page scroll so the newly opened section starts from top
        requestAnimationFrame(() => {
          resetAllScrolls(true);
        });
      }
    };

    document.addEventListener('click', handleSectionClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleSectionClick);
    };
  }, []);

  return null;
};

export default ScrollToTop;
