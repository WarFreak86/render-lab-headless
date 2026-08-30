import {useRef} from 'react';
import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {IconButton} from '~/components/IconButton';
import {Icon, type IconName} from '~/components/Icon';
import type {HomepageCategory} from '~/lib/homepage';
import {SectionHeading} from './SectionHeading';

export function CategoryRail({
  categories,
  title,
  eyebrow,
}: {
  categories: HomepageCategory[];
  title: string;
  eyebrow?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  if (!categories.length) return null;

  const move = (direction: -1 | 1) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    railRef.current?.scrollBy({
      left: direction * Math.max(280, railRef.current.clientWidth * 0.72),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const iconFor = (to: string): IconName => {
    if (to.includes('metal-wall-art')) return 'metal';
    if (to.includes('canvas-art')) return 'canvas';
    if (to.includes('posters')) return 'poster';
    if (to.includes('bundles')) return 'bundle';
    if (to === '/collections') return 'collection';
    return 'frame';
  };

  return (
    <section className="home-categories section--compact" aria-labelledby="home-categories-title">
      <div className="container container--wide">
        <SectionHeading
          action={
            <div className="category-rail__controls" aria-label="Category rail controls">
              <IconButton icon="arrow-left" label="Previous categories" onClick={() => move(-1)} />
              <IconButton icon="arrow-right" label="Next categories" onClick={() => move(1)} />
            </div>
          }
          eyebrow={eyebrow}
          id="home-categories-title"
          title={title}
        />
      </div>
      <div className="category-rail" ref={railRef} aria-label="Categories">
        {categories.map((category) => (
          <Link
            aria-label={category.title}
            className="category-card"
            key={category.id}
            prefetch="intent"
            to={category.to}
          >
            <Image
              alt={category.image.altText}
              aspectRatio="4/3"
              data={category.image}
              loading="lazy"
              sizes="(max-width: 639px) 72vw, (max-width: 1023px) 38vw, 18vw"
            />
            <span className="category-card__shade" aria-hidden="true" />
            <span className="category-card__content">
              <span className="category-card__icon" aria-hidden="true">
                <Icon name={iconFor(category.to)} size={24} />
              </span>
              <span>
                <strong>{category.title}</strong>
                <small>{category.meta ?? 'Explore artwork'}</small>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
