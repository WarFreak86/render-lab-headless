import {Container} from '~/components/Container';
import {getProductionUrl} from '~/lib/config';

export const meta = () => {
  const canonical = getProductionUrl('/legal/rights-notice');
  const title = 'Rights & Intellectual Property Notice | Render-Lab';
  const description =
    'Information about independent artists, third-party rights, and rights-holder inquiries at Render-Lab.';

  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'article'},
    {property: 'og:url', content: canonical},
  ];
};

export default function RightsNotice() {
  return (
    <Container className="legal-page" size="wide">
      <header className="legal-page__header">
        <p className="legal-page__eyebrow">Legal</p>
        <h1>Rights &amp; Intellectual Property Notice</h1>
        <p className="legal-page__intro">
          Render-Lab offers artwork created by independent artists and presents it as
          part of curated collections and editions.
        </p>
      </header>

      <div className="legal-page__body">
        <section className="legal-page__section">
          <h2>Third-party subject matter</h2>
          <p>
            Some artworks may contain, depict, reference, or be inspired by names,
            trademarks, trade dress, copyrighted works, likenesses of public figures,
            or other subject matter in which third parties may hold rights.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>No implied affiliation</h2>
          <p>
            Unless a product page expressly states otherwise, neither Render-Lab nor
            the contributing artist claims any affiliation with, endorsement by,
            sponsorship by, or authorization from any third-party rights holder. The
            appearance of third-party subject matter does not by itself imply an
            official relationship.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Ownership of third-party rights</h2>
          <p>
            All third-party trademarks, copyrights, likeness rights, and other
            intellectual-property rights remain the property of their respective
            owners. Nothing on this site grants a license to any third-party right or
            limits the rights of a lawful rights holder.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Rights-holder inquiries</h2>
          <p>
            If you own or represent rights that you believe are implicated by a
            listing on Render-Lab, please contact us through the contact information
            provided in our store policies. Include the listing URL, identify the
            right or protected work at issue, and provide sufficient information for
            us to review the matter promptly.
          </p>
        </section>
      </div>
    </Container>
  );
}
