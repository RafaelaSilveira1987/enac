// services/apiDelete.js
import apiFetch from './apiFetch.js';
import { getHeaders } from './apiHeaders.js';

export function apiDelete(url, auth = true) {
  return apiFetch(url, {
    method: 'DELETE',
    headers: getHeaders(auth)
  });
}
