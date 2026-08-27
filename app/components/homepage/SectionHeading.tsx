import type {ReactNode} from 'react';

export function SectionHeading({
  title,
  eyebrow,
  action,
  id,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  id: string;
}) {
  return (
    <header className="home-section-heading">
      <div>
        {eyebrow ? <p className="home-eyebrow">{eyebrow}</p> : null}
        <h2 id={id}>{title}</h2>
      </div>
      {action ? <div className="home-section-heading__action">{action}</div> : null}
    </header>
  );
}
