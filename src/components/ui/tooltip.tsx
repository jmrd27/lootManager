import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  offset?: number;
  className?: string;
};

export function Tooltip({ content, children, offset = 8, className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [style, setStyle] = React.useState<React.CSSProperties>({});
  const triggerRef = React.useRef<HTMLSpanElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const el = contentRef.current;
    if (!trigger || !el) return;
    const rect = trigger.getBoundingClientRect();
    // Temporarily show to measure
    el.style.visibility = 'hidden';
    el.style.display = 'block';
    const { offsetWidth: w, offsetHeight: h } = el;
    el.style.display = '';
    el.style.visibility = '';

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const fitsBelow = rect.bottom + offset + h <= vh;
    const top = fitsBelow ? rect.bottom + offset : rect.top - offset - h;
    const left = Math.min(Math.max(rect.left + rect.width / 2 - w / 2, 8), vw - w - 8);
    setStyle({ position: 'fixed', top, left, zIndex: 50 });
  }, [offset]);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex"
      >
        {children}
      </span>
      {open
        ? createPortal(
            <div
              ref={contentRef}
              style={style}
              className={cn(
                'max-h-80 w-72 overflow-auto rounded-md border border-gray-700 bg-gray-900 p-3 text-xs text-gray-100 shadow-lg',
                className,
              )}
              role="tooltip"
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

