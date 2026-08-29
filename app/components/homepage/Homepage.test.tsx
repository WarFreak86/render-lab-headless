import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import {HomepageView} from './HomepageView';
import {HomepageHero} from './HomepageHero';
import {CategoryRail} from './CategoryRail';
import {
  HOMEPAGE_EDITORIAL_FALLBACK,
  type HomepageData,
} from '~/lib/homepage';

const image = {
  url: 'https://cdn.shopify.com/art.jpg',
  altText: 'Real Shopify artwork',
  width: 1600,
  height: 1000,
};

const product = {
  id: 'product-1',
  handle: 'real-work',
  title: 'Real Work',
  to: '/products/real-work',
  description: 'Printed on brushed aluminum.',
  productType: 'Aluminum',
  availableForSale: true,
  image,
  price: {amount: '80.0', currencyCode: 'USD'},
};

const data: HomepageData = {
  editorial: HOMEPAGE_EDITORIAL_FALLBACK,
  hero: product,
  heroPrimaryCta: {label: 'Explore Neon Memento', to: '/collections/neon-memento'},
  heroSecondaryCta: {label: 'Shop All Wall Art', to: '/collections/wall-art'},
  categories: [
    {id: 'category-1', title: 'Metal Wall Art', to: '/collections/metal-wall-art', image},
  ],
  featuredCollections: [
    {
      id: 'collection-1',
      title: 'Neon Memento',
      to: '/collections/neon-memento',
      image,
    },
  ],
  featuredDrop: product,
};

function renderHomepage(homepage = data) {
  return render(
    <MemoryRouter>
      <HomepageView data={homepage} />
    </MemoryRouter>,
  );
}

describe('homepage presentation', () => {
  it('renders contextual hero CTAs', () => {
    renderHomepage();
    expect(
      screen.getByRole('heading', {level: 1, name: 'Collect the Chaos.'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Explore Neon Memento'})).toHaveAttribute(
      'href',
      '/collections/neon-memento',
    );
    expect(screen.getByRole('link', {name: 'Shop All Wall Art'})).toHaveAttribute(
      'href',
      '/collections/wall-art',
    );
  });

  it('renders Shopify-backed format and featured collection destinations', () => {
    renderHomepage();
    expect(screen.getByRole('link', {name: 'Metal Wall Art'})).toHaveAttribute(
      'href',
      '/collections/metal-wall-art',
    );
    expect(screen.getByRole('link', {name: 'Neon Memento'})).toHaveAttribute(
      'href',
      '/collections/neon-memento',
    );
  });

  it('omits the featured release without optional product data', () => {
    renderHomepage({...data, featuredDrop: null});
    expect(screen.queryByRole('heading', {name: 'Real Work', level: 2})).not.toBeInTheDocument();
  });

  it('renders without throwing when optional editorial hero data is absent', () => {
    render(
      <MemoryRouter>
        <HomepageHero
          editorial={undefined}
          primaryCta={null}
          product={product}
          secondaryCta={null}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('heading', {level: 1})).not.toBeInTheDocument();
  });

  it('keeps category content visible and uses instant scrolling for reduced motion', async () => {
    const user = userEvent.setup();
    const scrollBy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({matches: true}));

    render(
      <MemoryRouter>
        <CategoryRail categories={data.categories} title="Choose a format or set" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: 'Metal Wall Art'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Next categories'}));
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({behavior: 'auto'}));
    vi.unstubAllGlobals();
  });
});
