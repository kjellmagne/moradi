import { useCallback, useRef } from 'react';

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

export function useSwipeX({ onSwipeLeft, onSwipeRight, enabled = true }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const tracking = useRef(false);

  const onTouchStart = useCallback(
    (e) => {
      if (!enabled) return;
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startTime.current = Date.now();
      tracking.current = true;
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (e) => {
      if (!enabled || !tracking.current) return;
      tracking.current = false;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      const dt = Date.now() - startTime.current;

      if (Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      const velocity = Math.abs(dx) / dt;
      if (velocity < SWIPE_VELOCITY_THRESHOLD && Math.abs(dx) < 120) return;

      if (dx > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (dx < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    },
    [enabled, onSwipeLeft, onSwipeRight]
  );

  return { onTouchStart, onTouchEnd };
}

export function useSwipeCard({ onSwipeRight, enabled = true }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const tracking = useRef(false);
  const locked = useRef(false);
  const elementRef = useRef(null);

  const onTouchStart = useCallback(
    (e) => {
      if (!enabled) return;
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      currentX.current = 0;
      tracking.current = true;
      locked.current = false;
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e) => {
      if (!enabled || !tracking.current) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      if (!locked.current) {
        if (Math.abs(dy) > Math.abs(dx)) {
          tracking.current = false;
          return;
        }
        if (Math.abs(dx) > 10) {
          locked.current = true;
        }
      }

      if (!locked.current) return;

      const offset = Math.max(0, dx);
      currentX.current = offset;

      if (elementRef.current) {
        const progress = Math.min(offset / 120, 1);
        elementRef.current.style.transform = `translateX(${offset * 0.6}px)`;
        elementRef.current.style.transition = 'none';

        const bg = `rgba(16, 185, 129, ${progress * 0.15})`;
        elementRef.current.style.background = bg;
      }

      if (offset > 20) {
        e.preventDefault();
      }
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (e) => {
      if (!enabled || !tracking.current) return;
      tracking.current = false;

      const offset = currentX.current;

      if (elementRef.current) {
        if (offset > 100 && onSwipeRight) {
          elementRef.current.style.transition = 'transform 300ms cubic-bezier(0.55, 0, 1, 0.45), opacity 300ms ease';
          elementRef.current.style.transform = 'translateX(110%)';
          elementRef.current.style.opacity = '0';
          setTimeout(() => {
            onSwipeRight();
            if (elementRef.current) {
              elementRef.current.style.transform = '';
              elementRef.current.style.opacity = '';
              elementRef.current.style.background = '';
              elementRef.current.style.transition = '';
            }
          }, 300);
        } else {
          elementRef.current.style.transition = 'transform 250ms cubic-bezier(0.22, 1, 0.36, 1), background 250ms ease';
          elementRef.current.style.transform = 'translateX(0)';
          elementRef.current.style.background = '';
        }
      }

      currentX.current = 0;
    },
    [enabled, onSwipeRight]
  );

  return { ref: elementRef, onTouchStart, onTouchMove, onTouchEnd };
}
