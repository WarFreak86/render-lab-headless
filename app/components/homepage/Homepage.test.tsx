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
  heroPrimaryCta: {label: 'Explore Echoes of War', to: '/collections/echoes-of-war'},
  heroSecondaryCta: {label: 'Shop All Wall Art', to: '/collections/wall-art'},
  categories: [
    {id: 'category-1', title: 'Metal Wall Art', to: '/collections/metal-wall-art', image},
    {id: 'category-2', title: 'Canvas Prints', to: '/collections/canvas-art', image},
    {id: 'category-3', title: 'Posters', to: '/collections/posters', image},
  ],
  featuredCollections: [
    {
      id: 'collection-1',
      title: 'Echoes of War',
      to: '/collections/echoes-of-war',
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
  it('renders the Echoes hero copy while preserving contextual destinations', () => {
    renderHomepage();
    expect(
      screen.getByRole('heading', {level: 1, name: 'Echoes of War'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Explore Echoes of War'})).toHaveAttribute(
      'href',
      '/collections/echoes-of-war',
    );
    expect(screen.getByRole('link', {name: 'View all wall art'})).toHaveAttribute(
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
    expect(screen.getByRole('link', {name: 'Echoes of War'})).toHaveAttribute(
      'href',
      '/collections/echoes-of-war',
    );
  });

  it('renders physical format studies for metal, canvas, and poster', () => {
    renderHomepage();
    expect(
      screen.getByRole('heading', {level: 2, name: 'Built to live on a wall.'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /explore metal/i})).toHaveAttribute(
      'href',
      '/collections/metal-wall-art',
    );
    expect(screen.getByRole('link', {name: /explore canvas/i})).toHaveAttribute(
      'href',
      '/collections/canvas-art',
    );
    expect(screen.getByRole('link', {name: /explore poster/i})).toHaveAttribute(
      'href',
      '/collections/posters',
    );
    expect(screen.getByText('Made to order')).toBeInTheDocument();
  });

  it('renders a transparent coming-soon drop state without optional product data', () => {
    renderHomepage({...data, featuredDrop: null});
    expect(screen.queryByRole('heading', {name: 'Real Work', level: 2})).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {name: 'Next limited drop', level: 2}),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Explore current work'})).toHaveAttribute(
      'href',
      '/collections/wall-art',
    );
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
