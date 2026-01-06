// services/apiGet.js
import apiFetch from './apiFetch.js';
import { getHeaders } from './apiHeaders.js';

export function apiGet(url, auth = false) {
  return apiFetch(url, {
    method: 'GET',
    headers: getHeaders(auth)
  });
}

/* uso get

apiGet('/api/public')
apiGet('/api/usuarios', true)

*/
