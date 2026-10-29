import {redirect} from 'react-router';

export function loader() {
  return redirect('/collections/wall-art', 301);
}
