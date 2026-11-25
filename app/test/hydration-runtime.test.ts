import {createElement, version as reactVersion} from 'react';
import {version as reactDomVersion} from 'react-dom';
import {renderToString} from 'react-dom/server';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {describe, expect, it} from 'vitest';
import {getApparelCategory} from '~/lib/apparel-categories';
import ApparelPage from '~/routes/apparel_.$category';

vi.mock('@shopify/hydrogen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shopify/hydrogen')>()),
  Pagination: ({
    children,
    connection,
  }: {
    children: (data: {nodes: unknown[]}) => React.ReactNode;
    connection: {nodes: unknown[]};
  }) => children({nodes: connection.nodes}),
}));

describe('document hydration runtime', () => {
  it('uses the React 19 hydration engine supported by Hydrogen', () => {
    expect(reactVersion).toMatch(/^19\./);
    expect(reactDomVersion).toBe(reactVersion);
  });

  it('keeps an apparel card price inside its paragraph after the SSR HTML is parsed', () => {
    const amount = {amount: '79.00', currencyCode: 'USD'};
    const router = createMemoryRouter(
      [{id: 'apparel', path: '/apparel/:category', Component: ApparelPage}],
      {
        initialEntries: ['/apparel/hoodies'],
        hydrationData: {
          loaderData: {
            apparel: {
              category: getApparelCategory('hoodies'),
              hasPurchasableProducts: true,
              products: {
                nodes: [
                  {
                    id: 'hoodie',
                    handle: 'hoodie',
                    title: 'Graphic hoodie',
                    availableForSale: true,
                    priceRange: {minVariantPrice: amount, maxVariantPrice: amount},
                  },
                ],
                pageInfo: {hasPreviousPage: false, hasNextPage: false},
              },
            },
          },
        },
      },
    );
    const html = renderToString(createElement(RouterProvider, {router}));
    const document = new DOMParser().parseFromString(html, 'text/html');

    expect(
      document.querySelector('p.apparel-card__price > span')?.textContent,
    ).toBe('$79.00');
  });
});
