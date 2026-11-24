import type {Route} from './+types/sitemap.storefront[.xml]';
import {getProductionUrl} from '~/lib/config';
import {loader as loadApparel} from './apparel';
import {loader as loadHoodies} from './apparel_.$category';
import {loader as loadArtist} from './artists.$handle';
import {loader as loadPolicy} from './policies.$handle';

const ARTIST_HANDLES = ['jb-render', 'render-lab-studio'];
const POLICY_HANDLES = [
  'privacy-policy',
  'refund-policy',
  'shipping-policy',
  'terms-of-service',
];

async function getEligiblePath(path: string, check: () => Promise<boolean>) {
  try {
    return (await check()) ? path : null;
  } catch (error) {
    if (
      error instanceof Response &&
      (error.status === 404 || (error.status >= 300 && error.status < 400))
    ) {
      return null;
    }
    throw error;
  }
}

export async function loader(args: Route.LoaderArgs) {
  const paths = [
    '/',
    '/materials',
    '/collections',
    '/artists',
    '/policies',
    '/legal/rights-notice',
  ];
  const apparelPath = '/apparel';
  const hoodiesPath = '/apparel/hoodies';
  const candidates = await Promise.all([
    getEligiblePath(apparelPath, async () => {
      const data = await loadApparel({
        ...args,
        request: new Request(getProductionUrl(apparelPath)),
      });
      return data.categories.length > 0;
    }),
    getEligiblePath(hoodiesPath, async () => {
      const data = await loadHoodies({
        ...args,
        params: {...args.params, category: 'hoodies'},
        request: new Request(getProductionUrl(hoodiesPath)),
      });
      return data.hasPurchasableProducts;
    }),
    ...ARTIST_HANDLES.map((handle) =>
      getEligiblePath(`/artists/${handle}`, async () => {
        const data = await loadArtist({
          ...args,
          params: {...args.params, handle},
        });
        return data.artist.handle === handle && data.collections.length > 0;
      }),
    ),
    ...POLICY_HANDLES.map((handle) =>
      getEligiblePath(`/policies/${handle}`, async () => {
        const data = await loadPolicy({
          ...args,
          params: {...args.params, handle},
        });
        return data.policy.handle === handle;
      }),
    ),
  ]);

  paths.push(...candidates.filter((path) => path !== null));

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${getProductionUrl(path)}</loc></url>`).join('\n')}
</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=86400',
      },
    },
  );
}
