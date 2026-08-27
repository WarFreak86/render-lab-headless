import {Image} from '@shopify/hydrogen';
import {useState} from 'react';
import {Drawer} from '~/components/Drawer';
import type {ProductImageData} from '~/lib/product';
import type {
  DropCollectorBenefit,
  DropEditionConfig,
  DropSizeGuideConfig,
} from '~/lib/drops';

export function DropSizeGuide({guide}: {guide?: DropSizeGuideConfig}) {
  const [open, setOpen] = useState(false);
  if (!guide?.notes.length) return null;

  return (
    <>
      <button
        className="drop-size-guide__trigger"
        onClick={() => setOpen(true)}
        type="button"
      >
        Size guide
      </button>
      <Drawer
        className="drop-size-guide__drawer"
        onClose={() => setOpen(false)}
        open={open}
        title={guide.title}
      >
        <div className="drop-size-guide__content">
          {guide.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </Drawer>
    </>
  );
}

export function DropCollectorBenefits({
  benefits,
}: {
  benefits?: ReadonlyArray<DropCollectorBenefit>;
}) {
  if (!benefits?.length) return null;

  return (
    <section
      className="drop-benefits"
      aria-labelledby="drop-benefits-title"
    >
      <p className="drop-section__eyebrow">Collector notes</p>
      <h2 id="drop-benefits-title">Release details</h2>
      <div className="drop-benefits__grid">
        {benefits.map((benefit) => (
          <article key={benefit.title}>
            <h3>{benefit.title}</h3>
            <p>{benefit.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DropEdition({edition}: {edition?: DropEditionConfig}) {
  if (!edition) return null;

  return (
    <section className="drop-edition" aria-labelledby="drop-edition-title">
      <p className="drop-section__eyebrow">Edition information</p>
      <h2 id="drop-edition-title">{edition.label}</h2>
      {edition.size ? <p>Edition size: {edition.size}</p> : null}
      {edition.description ? <p>{edition.description}</p> : null}
    </section>
  );
}

export function DropStory({
  body,
  bodyHtml,
  heading,
  image,
}: {
  body?: string;
  bodyHtml?: string;
  heading?: string;
  image?: ProductImageData;
}) {
  if (!heading || (!body && !bodyHtml)) return null;

  return (
    <section className="drop-story" aria-labelledby="drop-story-title">
      <div className="drop-story__content">
        <p className="drop-section__eyebrow">Inside the release</p>
        <h2 id="drop-story-title">{heading}</h2>
        {body ? <p>{body}</p> : null}
        {bodyHtml ? (
          <div
            className="drop-story__rich"
            dangerouslySetInnerHTML={{__html: bodyHtml}}
          />
        ) : null}
      </div>
      {image ? (
        <div className="drop-story__media">
          <Image
            alt={image.altText}
            data={image}
            loading="lazy"
            sizes="(min-width: 64rem) 50vw, 100vw"
          />
        </div>
      ) : null}
    </section>
  );
}
