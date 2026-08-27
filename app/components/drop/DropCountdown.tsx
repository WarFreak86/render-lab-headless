import {useEffect, useRef, useState} from 'react';
import {useRevalidator} from 'react-router';
import {getDropCountdownValue} from '~/lib/drops';

const UNITS = [
  ['days', 'Days'],
  ['hours', 'Hours'],
  ['minutes', 'Minutes'],
  ['seconds', 'Seconds'],
] as const;

export function DropCountdown({
  initialNow,
  label,
  target,
}: {
  initialNow: number;
  label: string;
  target: number;
}) {
  const [now, setNow] = useState(initialNow);
  const [transitioning, setTransitioning] = useState(false);
  const revalidator = useRevalidator();
  const transitionRef = useRef(false);
  const remaining = getDropCountdownValue(target, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining.totalSeconds > 0 || transitionRef.current) return;
    transitionRef.current = true;
    setTransitioning(true);
    void revalidator.revalidate();
  }, [remaining.totalSeconds, revalidator]);

  return (
    <section className="drop-countdown" aria-label={label}>
      <p className="drop-countdown__label">{label}</p>
      <div className="drop-countdown__units" aria-hidden="true">
        {UNITS.map(([key, unit]) => (
          <div className="drop-countdown__unit" key={key}>
            <strong>{String(remaining[key]).padStart(2, '0')}</strong>
            <span>{unit}</span>
          </div>
        ))}
      </div>
      <p className="sr-only">
        {remaining.days} days, {remaining.hours} hours, {remaining.minutes}{' '}
        minutes and {remaining.seconds} seconds remaining.
      </p>
      <p className="sr-only" aria-live="polite">
        {transitioning ? 'Release status is updating.' : ''}
      </p>
    </section>
  );
}
