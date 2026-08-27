import {useEffect, useId, useRef, useState} from 'react';
import {Icon} from '~/components/Icon';

export function Accordion({
  children,
  defaultOpen = false,
  title,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  title: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const buttonId = useId();
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (open) panel.removeAttribute('inert');
    else panel.setAttribute('inert', '');
  }, [open]);

  return (
    <div className="accordion" data-state={open ? 'open' : 'closed'}>
      <h3 className="accordion__heading">
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="accordion__trigger"
          id={buttonId}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span>{title}</span>
          <Icon name="chevron-down" size={18} />
        </button>
      </h3>
      <div
        aria-hidden={!open}
        aria-labelledby={buttonId}
        className="accordion__panel"
        id={panelId}
        ref={panelRef}
        role="region"
      >
        <div className="accordion__panel-inner">{children}</div>
      </div>
    </div>
  );
}
