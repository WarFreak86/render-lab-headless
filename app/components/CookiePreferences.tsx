import {useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import {Drawer} from '~/components/Drawer';

type Choice = '' | 'yes' | 'no';
const PURPOSES = ['analytics', 'marketing', 'preferences'] as const;
type Purpose = (typeof PURPOSES)[number];
type Choices = Record<Purpose, Choice>;
type ConsentUpdate = Partial<Record<Purpose | 'sale_of_data', boolean>>;

// Hydrogen 2026.4 types omit saleOfDataRegion and model the SDK's yes/no/''
// decisions as booleans. Normalize the documented runtime API here.
interface PrivacyApi {
  currentVisitorConsent(): Record<string, unknown>;
  analyticsProcessingAllowed(): boolean;
  marketingAllowed(): boolean;
  preferencesProcessingAllowed(): boolean;
  saleOfDataAllowed(): boolean;
  saleOfDataRegion(): boolean;
  setTrackingConsent(
    update: ConsentUpdate,
    callback: (result?: {error?: string}) => void,
  ): void;
}
interface Snapshot {
  choices: Choices;
  allowed: Record<Purpose, boolean>;
  sale: Choice;
  saleAllowed: boolean;
  saleRegion: boolean;
  gpc: boolean;
}
const LABELS: Record<Purpose, string> = {
  analytics: 'Analytics',
  marketing: 'Marketing',
  preferences: 'Preferences',
};
function choice(value: unknown): Choice {
  if (value === 'yes' || value === true) return 'yes';
  if (value === 'no' || value === false) return 'no';
  if (value === '' || value === undefined) return '';
  throw new Error('Unrecognized privacy decision');
}
function readPrivacy(api: PrivacyApi): Snapshot {
  const explicit = api.currentVisitorConsent();
  return {
    choices: {
      analytics: choice(explicit.analytics),
      marketing: choice(explicit.marketing),
      preferences: choice(explicit.preferences),
    },
    allowed: {
      analytics: api.analyticsProcessingAllowed(),
      marketing: api.marketingAllowed(),
      preferences: api.preferencesProcessingAllowed(),
    },
    sale: choice(explicit.sale_of_data),
    saleAllowed: api.saleOfDataAllowed(),
    saleRegion: api.saleOfDataRegion(),
    gpc:
      (navigator as Navigator & {globalPrivacyControl?: boolean})
        .globalPrivacyControl === true,
  };
}
function decision(value: Choice) {
  return value === 'yes'
    ? 'Granted'
    : value === 'no'
      ? 'Denied'
      : 'No decision recorded';
}

export function CookiePreferences() {
  const {customerPrivacy} = useAnalytics();
  const api = customerPrivacy as unknown as PrivacyApi | null;
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [draft, setDraft] = useState<Choices>({
    analytics: '',
    marketing: '',
    preferences: '',
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  function refresh() {
    if (!api || pending.current) return;
    try {
      const next = readPrivacy(api);
      setSnapshot(next);
      setDraft(next.choices);
      setError('');
    } catch {
      setError('Shopify privacy settings could not be read. Please try again.');
    }
  }

  useEffect(() => {
    if (!open) return;
    refresh();
    document.addEventListener('visitorConsentCollected', refresh);
    document.addEventListener('shopifyCustomerPrivacyApiLoaded', refresh);
    return () => {
      document.removeEventListener('visitorConsentCollected', refresh);
      document.removeEventListener('shopifyCustomerPrivacyApiLoaded', refresh);
    };
    // Refresh when Hydrogen supplies the SDK, and when its consent state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, api]);

  function save(update: ConsentUpdate) {
    if (!api || !snapshot || pending.current) return;
    setError('');
    setStatus('');
    if (!Object.keys(update).length) {
      setStatus('No changes to save.');
      return;
    }
    pending.current = true;
    setSaving(true);
    let finished = false;
    function finish(result?: {error?: string}) {
      if (finished || !mounted.current) return;
      finished = true;
      clearTimeout(timer.current);
      pending.current = false;
      setSaving(false);
      try {
        if (result?.error) throw new Error('Save failed');
        const next = readPrivacy(api!);
        const confirmed = Object.entries(update).every(
          ([key, value]) =>
            (key === 'sale_of_data'
              ? next.sale
              : next.choices[key as Purpose]) === (value ? 'yes' : 'no'),
        );
        if (!confirmed) throw new Error('Save not confirmed');
        setSnapshot(next);
        setDraft(next.choices);
        setStatus('Your privacy choices have been saved.');
      } catch {
        setError(
          'Your changes could not be confirmed. Last confirmed choices are shown. Reopen to check Shopify’s current settings, or try again.',
        );
      }
    }
    timer.current = setTimeout(() => finish({error: 'Timed out'}), 15000);
    try {
      api.setTrackingConsent(update, finish);
    } catch {
      finish({error: 'Save failed'});
    }
  }

  function saveChoices() {
    if (!snapshot) return;
    const update: ConsentUpdate = {};
    for (const purpose of PURPOSES) {
      if (
        draft[purpose] !== '' &&
        draft[purpose] !== snapshot.choices[purpose]
      ) {
        update[purpose] = draft[purpose] === 'yes';
      }
    }
    save(update);
  }

  return (
    <>
      <button
        type="button"
        className="site-footer__cookie-preferences"
        aria-haspopup="dialog"
        onClick={() => {
          setStatus('');
          setError('');
          setOpen(true);
        }}
      >
        Cookie preferences
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Cookie preferences"
        className="cookie-preferences"
      >
        <p>
          Choose which optional cookies to allow. Required cookies keep the
          store and cart working.
        </p>
        {!api && (
          <p role="status">
            Shopify privacy controls are loading. Please try again shortly.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        {api && !snapshot && (
          <button
            type="button"
            className="button button--secondary"
            onClick={refresh}
          >
            Try again
          </button>
        )}
        {snapshot && (
          <>
            <p>
              Recorded decisions and effective permissions can differ because of
              your region or browser privacy signals. Closing without saving
              leaves your choices unchanged.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveChoices();
              }}
            >
              <fieldset disabled={saving || !api}>
                <legend>Optional cookies</legend>
                {PURPOSES.map((purpose) => (
                  <label className="cookie-preferences__choice" key={purpose}>
                    <span>{LABELS[purpose]}</span>
                    <select
                      aria-label={LABELS[purpose]}
                      value={draft[purpose]}
                      onChange={(event) => {
                        setStatus('');
                        setDraft({
                          ...draft,
                          [purpose]: event.target.value as Choice,
                        });
                      }}
                    >
                      <option
                        value=""
                        disabled={snapshot.choices[purpose] !== ''}
                      >
                        No decision recorded
                      </option>
                      <option value="yes">Allow</option>
                      <option value="no">Decline</option>
                    </select>
                    <span className="cookie-preferences__state">
                      Last confirmed: {decision(snapshot.choices[purpose])}.
                      Currently{' '}
                      {snapshot.allowed[purpose] ? 'allowed' : 'blocked'} by
                      Shopify.
                    </span>
                  </label>
                ))}
                <div className="cookie-preferences__actions">
                  <button type="submit" className="button button--primary">
                    Save choices
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() =>
                      save({
                        analytics: true,
                        marketing: true,
                        preferences: true,
                      })
                    }
                  >
                    Accept optional cookies
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() =>
                      save({
                        analytics: false,
                        marketing: false,
                        preferences: false,
                      })
                    }
                  >
                    Decline optional cookies
                  </button>
                </div>
              </fieldset>
            </form>
            {(snapshot.saleRegion ||
              snapshot.gpc ||
              snapshot.sale === 'no') && (
              <section
                aria-label="Data sale and sharing"
                className="cookie-preferences__sale"
              >
                <h3>Data sale and sharing</h3>
                <p>
                  This is separate from optional cookies. Last confirmed:{' '}
                  {decision(snapshot.sale)}. Currently{' '}
                  {snapshot.saleAllowed ? 'allowed' : 'blocked'} by Shopify.
                </p>
                {snapshot.gpc && (
                  <p>
                    Your browser sends Global Privacy Control. We do not
                    override that signal.
                  </p>
                )}
                {snapshot.saleRegion && (
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={saving || !api || snapshot.sale === 'no'}
                    onClick={() => save({sale_of_data: false})}
                  >
                    Do not sell or share my data
                  </button>
                )}
              </section>
            )}
          </>
        )}
        <p role="status" aria-live="polite">
          {saving ? 'Saving your choices…' : status}
        </p>
        <p>
          <a href="/policies/privacy-policy">Read the privacy policy</a>
        </p>
      </Drawer>
    </>
  );
}
