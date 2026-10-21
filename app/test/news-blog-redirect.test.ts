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

    await expect(
      singleBlogLoader({
        params: {blogHandle: 'news'},
        request: new Request('https://render-lab.org/blogs/news'),
        context: {storefront: {query}},
      } as never),
    ).rejects.toMatchObject({
      status: 302,
      headers: expect.objectContaining({}),
    });

    expect(query).not.toHaveBeenCalled();
  });
});
