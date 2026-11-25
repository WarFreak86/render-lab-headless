import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {HomepageQuery} from 'storefrontapi.generated';
import {Icon} from '~/components/Icon';
import {apparelCardPrice} from '~/lib/apparel';
import {SectionHeading} from './SectionHeading';

export type HomepageHoodies = NonNullable<
  HomepageQuery['hoodies']
>['products']['nodes'];

export function FeaturedApparel({hoodies}: {hoodies: HomepageHoodies}) {
  if (!hoodies.length) return null;
  const featured = hoodies.filter(
    ({handle}) => handle === 'sombrero' || handle === 'fighter-jet-graphic-hoodie',
  );

  return (
    <section className="home-v2-apparel" aria-labelledby="home-apparel-title">
      <div className="container container--wide">
        <SectionHeading
          id="home-apparel-title"
          title="Graphic hoodies"
          eyebrow={
            <Link to="/apparel" prefetch="intent">
              Render-Lab Apparel
            </Link>
          }
          action={
            <Link
              className="home-v2-button"
              to="/apparel/hoodies"
              prefetch="intent"
            >
              Explore Graphic Hoodies <Icon name="arrow-right" size={16} />
            </Link>
          }
        />
        {featured.length ? (
          <div className="home-v2-apparel__grid">
            {featured.map((product) => {
              const variant = product.selectedOrFirstAvailableVariant;
              const price = apparelCardPrice({
                min: product.priceRange.minVariantPrice,
                max: product.priceRange.maxVariantPrice,
                firstAvailable: variant?.availableForSale ? variant.price : null,
                availableForSale: product.availableForSale,
              });

              return (
                <Link
                  className="home-v2-apparel__card"
                  key={product.id}
                  to={`/products/${product.handle}`}
                  prefetch="intent"
                >
                  {product.featuredImage ? (
                    <div className="home-v2-apparel__media">
                      <Image
                        data={product.featuredImage}
                        alt=""
                        loading="lazy"
                        sizes="(min-width: 64rem) 9rem, (min-width: 43rem) 14vw, 6rem"
                      />
                    </div>
                  ) : null}
                  <div className="home-v2-apparel__details">
                    <h3>{product.title}</h3>
                    {price.amount ? (
                      <p>
                        {price.label ? `${price.label} ` : null}
                        <Money data={price.amount} as="span" />
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
