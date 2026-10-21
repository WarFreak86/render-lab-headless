import {loader as blogIndexLoader} from '~/routes/blogs._index';
import {loader as singleBlogLoader} from '~/routes/blogs.$blogHandle._index';

describe('unpublished Render-Lab journal', () => {
  it('redirects the blog index to the active Collections page', () => {
    const response = blogIndexLoader();
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/collections');
  });

  it('redirects the empty News blog without making a Storefront API call', async () => {
    const query = vi.fn();

    try {
      await singleBlogLoader({
        params: {blogHandle: 'news'},
        request: new Request('https://render-lab.org/blogs/news'),
        context: {storefront: {query}},
      } as never);
      throw new Error('Expected News blog redirect');
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      expect((error as Response).status).toBe(302);
      expect((error as Response).headers.get('Location')).toBe('/collections');
    }

    expect(query).not.toHaveBeenCalled();
  });
});
