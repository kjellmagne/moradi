import { useCallback, useEffect, useRef, useState } from 'react';

export function BottomSheet({ open, onClose, title, description, children }) {
  const [state, setState] = useState('closed');
  const sheetRef = useRef(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    if (open) {
      setState('open');
      document.body.style.overflow = 'hidden';
    } else if (state === 'open') {
      setState('closing');
      const timer = setTimeout(() => {
        setState('closed');
        document.body.style.overflow = '';
      }, 260);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const onHandleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    dragStartY.current = touch.clientY;
    dragCurrentY.current = 0;
    dragging.current = true;
  }, []);

  const onHandleTouchMove = useCallback((e) => {
    if (!dragging.current || !sheetRef.current) return;
    const touch = e.touches[0];
    const dy = Math.max(0, touch.clientY - dragStartY.current);
    dragCurrentY.current = dy;
    sheetRef.current.style.transform = `translateY(${dy}px)`;
    sheetRef.current.style.transition = 'none';
  }, []);

  const onHandleTouchEnd = useCallback(() => {
    if (!dragging.current || !sheetRef.current) return;
    dragging.current = false;

    if (dragCurrentY.current > 120) {
      onClose();
    } else {
      sheetRef.current.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';
      sheetRef.current.style.transform = 'translateY(0)';
    }
    dragCurrentY.current = 0;
  }, [onClose]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (state === 'closed') return null;

  return (
    <>
      <div
        className='bottom-sheet-overlay'
        data-state={state}
        onClick={handleOverlayClick}
        aria-hidden='true'
      />
      <div
        ref={sheetRef}
        className='bottom-sheet'
        data-state={state}
        role='dialog'
        aria-modal='true'
        aria-label={title}
      >
        <div
          className='flex cursor-grab touch-none flex-col items-center pb-2 active:cursor-grabbing'
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <div className='bottom-sheet-handle' />
        </div>

        <div className='px-5 pb-2'>
          {title ? <h2 className='text-lg font-bold text-slate-900'>{title}</h2> : null}
          {description ? <p className='mt-0.5 text-sm text-slate-500'>{description}</p> : null}
        </div>

        <div className='scroll-area-soft max-h-[70dvh] overflow-y-auto overscroll-contain px-5 pb-8'>
          {children}
        </div>
      </div>
    </>
  );
}
