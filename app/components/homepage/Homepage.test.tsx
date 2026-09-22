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
    id: 'artist-1',
    handle: 'nico-vale',
    name: 'Nico Vale',
    biography: 'Coastlines and cinematic light.',
    image: {...image, altText: 'Nico Vale portrait'},
  },
  {
    id: 'artist-2',
    handle: 'mara-voss',
    name: 'Mara Voss',
    biography: 'Botanical unease and synthetic life.',
    image: {...image, altText: 'Mara Voss portrait'},
  },
  {
    id: 'artist-3',
    handle: 'dante-mercer',
    name: 'Dante Mercer',
    biography: 'Street portraiture and urban mythology.',
    image: {...image, altText: 'Dante Mercer portrait'},
  },
  {
    id: 'artist-4',
    handle: 'fourth-artist',
    name: 'Fourth Artist',
    biography: 'A newly added Shopify artist.',
    image: {...image, altText: 'Fourth Artist portrait'},
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
        name: 'Modern Wall Art for Unordinary Spaces',
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
    expect(screen.getByRole('link', {name: 'Shop Metal'})).toHaveAttribute(
      'href',
      '/collections/metal-wall-art',
    );
    expect(screen.getByRole('link', {name: 'Shop Canvas'})).toHaveAttribute(
      'href',
      '/collections/canvas-art',
    );
    expect(screen.getByRole('link', {name: 'Shop Posters'})).toHaveAttribute(
      'href',
      '/collections/posters',
    );
  });

  it('renders the Shopify artist roster without a fixed artist count', () => {
    renderHomepage();
    expect(
      screen.getByRole('heading', {level: 2, name: 'Distinct visions.'}),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: 'Three distinct visions.',
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'View Nico Vale'})).toHaveAttribute(
      'href',
      '/artists/nico-vale',
    );
    expect(screen.getByRole('link', {name: 'View Mara Voss'})).toHaveAttribute(
      'href',
      '/artists/mara-voss',
    );
    expect(
      screen.getByRole('link', {name: 'View Dante Mercer'}),
    ).toHaveAttribute('href', '/artists/dante-mercer');
    expect(
      screen.getByRole('link', {name: 'View Fourth Artist'}),
    ).toHaveAttribute('href', '/artists/fourth-artist');
    expect(
      screen.getByRole('link', {name: 'View all artists'}),
    ).toHaveAttribute('href', '/artists');
  });

  it('omits the artist spotlight cleanly when Shopify has no artists', () => {
    renderHomepage(data, []);
    expect(screen.queryByText('Meet the artists')).not.toBeInTheDocument();
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
