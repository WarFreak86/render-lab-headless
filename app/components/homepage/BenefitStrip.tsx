import {Icon} from '~/components/Icon';
import type {HomepageEditorialConfig} from '~/lib/homepage';

export function BenefitStrip({
  benefits,
}: {
  benefits: HomepageEditorialConfig['benefits'];
}) {
  if (!benefits.length) return null;
  return (
    <section className="home-benefits" aria-label="Collector benefits">
      <div className="container container--wide home-benefits__grid">
        {benefits.map((benefit) => (
          <article className="benefit-item" key={benefit.title}>
            <span className="benefit-item__icon" aria-hidden="true">
              <Icon name={benefit.icon} size={26} />
            </span>
            <span>
              <strong>{benefit.title}</strong>
              <small>{benefit.description}</small>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
