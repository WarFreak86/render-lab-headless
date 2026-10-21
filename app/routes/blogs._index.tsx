import {redirect} from 'react-router';

// Render-Lab does not currently publish journal articles.
// Preserve the Shopify blog records for a future editorial launch.
export function loader() {
  return redirect('/collections', 302);
}
