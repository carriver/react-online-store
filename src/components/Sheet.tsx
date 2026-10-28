import { useEffect, useId, useRef, type ReactNode } from 'react';

import './Sheet.css';

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  placement?: 'side' | 'center';
  closeLabel?: string;
  children: ReactNode;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Sheet({ open, onClose, title, placement = 'side', closeLabel = 'Close', children }: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () => [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    focusables()[0]?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.body.style.overflow = '';
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`sheet sheet--${placement}`}>
      <div className='sheet__backdrop' onClick={onClose} />
      <div ref={panel} className='sheet__panel' role='dialog' aria-modal='true' aria-labelledby={titleId}>
        <header className='sheet__header'>
          <h2 id={titleId}>{title}</h2>
          <button type='button' className='sheet__close' onClick={onClose} aria-label={closeLabel}>
            <svg viewBox='0 0 24 24' aria-hidden='true'>
              <path d='M6 6l12 12M18 6L6 18' stroke='currentColor' strokeWidth='3' strokeLinecap='round' />
            </svg>
          </button>
        </header>
        <div className='sheet__body'>{children}</div>
      </div>
    </div>
  );
}

export default Sheet;
