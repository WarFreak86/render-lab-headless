import {Image} from '@shopify/hydrogen';
import {Accordion} from '~/components/Accordion';
import type {ProductEditorialData} from '~/lib/product';

export function ProductDetails({
  descriptionHtml,
  editorial,
}: {
  descriptionHtml: string;
  editorial: ProductEditorialData;
}) {
  const hasEdition = Boolean(
    editorial.editionSize || editorial.collectorInformation,
  );
  const hasSpecifications = Boolean(
    editorial.materialDescription ||
      editorial.careInstructions ||
      editorial.fitNotes ||
      editorial.fabricDetails,
  );

  return (
    <div className="product-details">
      {descriptionHtml ? (
        <section
          className="product-details__overview"
          aria-labelledby="product-overview-title"
        >
          <div className="product-details__section-heading">
            <p className="product-details__eyebrow">About the piece</p>
            <h2 id="product-overview-title">About the work</h2>
          </div>
          <div
            className="product-details__rich"
            dangerouslySetInnerHTML={{__html: descriptionHtml}}
          />
        </section>
      ) : null}

      {editorial.roomImages.length > 0 ? (
        <section className="product-room" aria-labelledby="product-room-title">
          <div>
            <p className="product-details__eyebrow">In a space</p>
            <h2 id="product-room-title">See the work at room scale.</h2>
          </div>
          <div className="product-room__grid">
            {editorial.roomImages.map((image) => (
              <Image
                alt={image.altText}
                data={image}
                key={image.id}
                loading="lazy"
                sizes="(min-width: 48rem) 50vw, 100vw"
              />
            ))}
          </div>
        </section>
      ) : null}

      {editorial.highlights.length > 0 ? (
        <section
          className="product-details__highlights"
          aria-labelledby="product-highlights-title"
        >
          <p className="product-details__eyebrow">Product highlights</p>
          <h2 id="product-highlights-title">Made to be considered closely.</h2>
          <ul>
            {editorial.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasSpecifications ? (
        <section
          className="product-details__specifications"
          aria-labelledby="product-specifications-title"
          id="product-materials"
        >
          <div className="product-details__section-heading">
            <p className="product-details__eyebrow">Specifications</p>
            <h2 id="product-specifications-title">Materials & care</h2>
          </div>
          <div className="product-details__accordions">
            {editorial.materialDescription ? (
              <Accordion defaultOpen title="Materials">
                <p>{editorial.materialDescription}</p>
              </Accordion>
            ) : null}
            {editorial.careInstructions ? (
              <Accordion title="Care">
                <p>{editorial.careInstructions}</p>
              </Accordion>
            ) : null}
            {editorial.fitNotes ? (
              <Accordion title="Fit notes">
                <p>{editorial.fitNotes}</p>
              </Accordion>
            ) : null}
            {editorial.fabricDetails ? (
              <Accordion title="Fabric details">
                <p>{editorial.fabricDetails}</p>
              </Accordion>
            ) : null}
          </div>
        </section>
      ) : null}

      {editorial.artworkStory || editorial.artistNote ? (
        <section
          className="product-story"
          aria-labelledby="product-story-title"
        >
          <p className="product-details__eyebrow">Behind the work</p>
          <h2 id="product-story-title">The artwork story</h2>
          {editorial.artworkStory ? <p>{editorial.artworkStory}</p> : null}
          {editorial.artistNote ? (
            <blockquote>{editorial.artistNote}</blockquote>
          ) : null}
        </section>
      ) : null}

      {hasEdition ? (
        <section
          className="product-edition"
          aria-labelledby="product-edition-title"
        >
          <p className="product-details__eyebrow">Edition information</p>
          <h2 id="product-edition-title">
            {editorial.editionSize || 'Collector information'}
          </h2>
          {editorial.collectorInformation ? (
            <p>{editorial.collectorInformation}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
