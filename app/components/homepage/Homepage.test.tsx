import {SERIES_COLLECTION_HANDLES} from '~/lib/catalog-collections';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import {HomepageView} from './HomepageView';
import {HomepageHero} from './HomepageHero';
import {CategoryRail} from './CategoryRail';
import {HOMEPAGE_EDITORIAL_FALLBACK, type HomepageData} from '~/lib/homepage';
import type {ArtistSpotlightItem} from './HomepageCinematicSections';

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

const artists: ArtistSpotlightItem[] = [
  {
    id: 'artist-jb',
    handle: 'jb-render',
    name: 'J.B. Render',
    biography: 'Visual artist and creative director of Render-Lab.',
    image: {...image, altText: 'J.B. Render portrait'},
  },
  {
    id: 'artist-studio',
    handle: 'render-lab-studio',
    name: 'Render-Lab Studio',
    biography: 'In-house creative studio under the direction of J.B. Render.',
    image: {...image, altText: 'Render-Lab Studio artwork'},
  },
];

const data: HomepageData = {
  editorial: HOMEPAGE_EDITORIAL_FALLBACK,
  hero: product,
  heroPrimaryCta: {
    label: 'Explore Echoes of War',
    to: '/collections/echoes-of-war',
  },
  heroSecondaryCta: {label: 'Shop All Wall Art', to: '/collections/wall-art'},
  categories: [
    {
      id: 'category-1',
      title: 'Metal Wall Art',
      to: '/collections/metal-wall-art',
      image,
    },
    {
      id: 'category-2',
      title: 'Canvas Prints',
      to: '/collections/canvas-art',
      image,
    },
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
  featuredProducts: [
    {...product, series: 'Echoes of War', materials: ['Metal', 'Canvas']},
  ],
};

function renderHomepage(
  homepage = data,
  homepageArtists: ReadonlyArray<ArtistSpotlightItem> = artists,
) {
  return render(
    <MemoryRouter>
      <HomepageView artists={homepageArtists} data={homepage} />
    </MemoryRouter>,
  );
}

describe('homepage presentation', () => {
  it('renders the cinematic hero with the wall-art destination', () => {
    const {container} = renderHomepage();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Modern Metal Wall Art & Canvas Prints for Unordinary Spaces',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', {name: 'Explore wall art'})[0],
    ).toHaveAttribute('href', '/collections/wall-art');
    const heroImage = container.querySelector('.home-hero__media img');
    expect(heroImage).toHaveAttribute('loading', 'eager');
    expect(heroImage).toHaveAttribute('sizes', '100vw');
    expect(heroImage).toHaveAttribute('fetchpriority', 'high');
    expect(heroImage).toHaveAttribute('width');
    expect(heroImage).toHaveAttribute('height');
    expect(heroImage).toHaveStyle({aspectRatio: '1672/941'});
    expect(heroImage).toHaveAttribute('srcset');
  });

  it('renders Shopify-backed featured collection destinations', () => {
    renderHomepage();
    expect(
      screen.getByRole('heading', {level: 2, name: 'Featured collections'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Echoes of War'})).toHaveAttribute(
      'href',
      '/collections/echoes-of-war',
    );
  });

  it('renders cinematic material studies for metal, canvas, and poster', () => {
    renderHomepage();
    expect(
      screen.getByRole('heading', {level: 2, name: 'Made for the wall.'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: 'Shop Aluminum Metal Wall Art'}),
    ).toHaveAttribute('href', '/collections/metal-wall-art');
    expect(
      screen.getByRole('link', {name: 'Shop Gallery-Wrapped Canvas Prints'}),
    ).toHaveAttribute('href', '/collections/canvas-art');
    expect(
      screen.getByRole('link', {name: 'Shop Archival Matte Art Posters'}),
    ).toHaveAttribute('href', '/collections/posters');
  });

  it('renders only the genuine artist and in-house studio credits', () => {
    renderHomepage();
    expect(
      screen.getByRole('heading', {level: 2, name: 'The artist & the studio.'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: 'View J.B. Render'}),
    ).toHaveAttribute('href', '/artists/jb-render');
    expect(
      screen.getByRole('link', {name: 'View Render-Lab Studio'}),
    ).toHaveAttribute('href', '/artists/render-lab-studio');
    expect(
      screen.queryByRole('link', {name: 'View Nico Vale'}),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', {name: 'View Mara Voss'}),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', {name: 'View Dante Mercer'}),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Meet our studio'})).toHaveAttribute(
      'href',
      '/artists',
    );
  });

  it('omits the artist spotlight cleanly when Shopify has no artists', () => {
    renderHomepage(data, []);
    expect(screen.queryByText('Meet Render-Lab')).not.toBeInTheDocument();
  });

  it('finishes with a cinematic wall-art call to action', () => {
    renderHomepage();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Find the piece that changes the room.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', {name: 'Explore wall art'}),
    ).toHaveLength(2);
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
        <CategoryRail
          categories={data.categories}
          title="Choose a format or set"
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: 'Metal Wall Art'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Next categories'}));
    expect(scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({behavior: 'auto'}),
    );
    vi.unstubAllGlobals();
  });
});

it('renders every live series, accessible hero and genuine product price/materials', () => {
  const {container} = renderHomepage({
    ...data,
    featuredCollections: SERIES_COLLECTION_HANDLES.map((handle) => ({
      id: handle,
      title: handle,
      to: `/collections/${handle}`,
      image,
      description: 'A complete collection sentence without truncation.',
    })),
  });
  expect(
    container.querySelectorAll('.featured-collections-grid a'),
  ).toHaveLength(9);
  expect(
    container.querySelectorAll('.featured-collections-grid h3'),
  ).toHaveLength(9);
  expect(
    screen.getAllByText('A complete collection sentence without truncation.'),
  ).toHaveLength(9);
  expect(container.querySelector('.home-hero__media')).not.toHaveAttribute(
    'aria-hidden',
  );
  expect(container.querySelector('.home-hero__media img')).toHaveAttribute(
    'alt',
    'Large-scale volcanic landscape metal wall art print displayed in a dark modern gallery living room',
  );
  expect(screen.getByText('From $80.00 — Metal · Canvas')).toBeInTheDocument();
  expect(container.querySelector('.home-v2-products a')).toHaveAttribute(
    'href',
    '/products/real-work',
  );
});
