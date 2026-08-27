import type {Route} from './+types/[robots.txt]';
import {getRobotsTxt} from '~/lib/seo';

export function loader({request}: Route.LoaderArgs) {
  const body = getRobotsTxt(request.url);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',

      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}
