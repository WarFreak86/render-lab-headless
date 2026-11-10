import {loader, meta} from '~/routes/policies.$handle';
import {getReturnTermsParagraph} from '~/lib/return-policy';

describe('refund and return policy', () => {
  it('serves the proposed policy at the existing canonical route without Shopify data', async () => {
    const query = vi.fn();
    const data = await loader({
      params: {handle: 'refund-policy'},
      context: {storefront: {query}},
    } as never);

    expect(query).not.toHaveBeenCalled();
    expect(meta({data} as never)).toContainEqual({
      rel: 'canonical',
      tagName: 'link',
      href: 'https://render-lab.org/policies/refund-policy',
    });
    expect(data.policy.body).toContain('within 14 calendar days of confirmed delivery');
    expect(data.policy.body).toContain('You buy your own return postage for non-defective items');
    expect(data.policy.body).toContain('We charge no restocking fee');
    expect(data.policy.body).toContain('send the return address and mailing instructions privately');
    expect(data.policy.body).toContain('Do not mail your return to the fulfillment partner or to the sender address on the package');
    expect(data.policy.body).toContain('cover the return shipping cost');
    expect(data.policy.body).toContain('within 30 calendar days of delivery');
    expect(data.policy.body).toContain('within 5 business days after receiving the return');
    expect(data.policy.body).toContain('sooner if required by law');
    expect(data.policy.body).not.toMatch(/final sale/i);
  });

  it('removes the live Terms exclusion while preserving unrelated Terms and shipping policy text', async () => {
    const policy = {
      title: 'Terms of Service',
      handle: 'terms-of-service',
      body: '<p>Shipping, taxes, duties, and other charges are shown or calculated as applicable during checkout.</p><p>Because many products are made to order, they are generally not eligible for return or exchange solely because of change of mind, buyer preference, or an incorrect product option selected by the customer.</p><p>Nothing in these Terms limits rights that cannot legally be waived.</p>',
    };
    const shipping = {
      title: 'Shipping Policy',
      handle: 'shipping-policy',
      body: '<p>Shipping charges are displayed at checkout.</p>',
    };
    const query = vi.fn().mockResolvedValue({
      shop: {termsOfService: policy, shippingPolicy: shipping},
    });
    const context = {storefront: {query}};

    const terms = await loader({
      params: {handle: 'terms-of-service'},
      context,
    } as never);
    expect(terms.policy.body).toContain('href="/policies/refund-policy"');
    expect(terms.policy.body).not.toContain('generally not eligible for return');
    expect(terms.policy.body).toContain('Shipping, taxes, duties');
    expect(terms.policy.body).toContain('rights that cannot legally be waived');

    const checkoutTerms = getReturnTermsParagraph(
      'https://render-lab.org/policies/refund-policy',
    );
    expect(terms.policy.body.replace(
      'href="/policies/refund-policy"',
      'href="https://render-lab.org/policies/refund-policy"',
    )).toContain(checkoutTerms);

    const result = await loader({
      params: {handle: 'shipping-policy'},
      context,
    } as never);
    expect(result.policy).toEqual(shipping);
  });
});
