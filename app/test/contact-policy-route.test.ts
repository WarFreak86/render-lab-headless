import {loader} from '~/routes/policies.$handle';

describe('published Contact information policy route', () => {
  it('redirects to the public contact page without querying an unsupported Storefront API policy', async () => {
    const query = vi.fn();

    try {
      await loader({
        params: {handle: 'contact-information'},
        context: {storefront: {query}},
      } as never);
      throw new Error('Expected contact-information redirect');
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      expect((error as Response).status).toBe(302);
      expect((error as Response).headers.get('Location')).toBe('/pages/contact');
      expect(query).not.toHaveBeenCalled();
    }
  });
});
