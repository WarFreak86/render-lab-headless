import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {HomepageData} from '~/lib/homepage';
import {SectionHeading} from './SectionHeading';

export function FeaturedProducts({
  products,
}: {
  products: HomepageData['featuredProducts'];
}) {
  if (!products.length) return null;
  return (
    <section
      className="home-v2-products section"
      aria-labelledby="home-products-title"
    >
      <div className="container container--wide">
        <SectionHeading
          id="home-products-title"
          title="Featured artworks"
          eyebrow="Explore the gallery"
        />
        <div className="home-v2-products__grid">
          {products.map((product) => (
            <Link
              className="home-v2-product"
              key={product.id}
              to={product.to}
              prefetch="intent"
            >
              <div className="home-v2-product__media">
                <Image
                  data={product.image}
                  alt={product.image.altText}
                  loading="lazy"
                  sizes="(min-width: 64rem) 23vw, (min-width: 40rem) 45vw, 90vw"
                />
              </div>
              <p className="home-v2-kicker">{product.series}</p>
              <h3>{product.title}</h3>
              <p>
                From{' '}
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: product.price!.currencyCode,
                }).format(Number(product.price!.amount))}
                {product.materials.length
                  ? ` — ${product.materials.join(' · ')}`
                  : ''}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
