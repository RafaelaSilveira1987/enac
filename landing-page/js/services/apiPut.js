// services/apiPut.js
import apiFetch from './apiFetch.js';
import { getHeaders } from './apiHeaders.js';

export function apiPut(url, body = {}, auth = true) {
  return apiFetch(url, {
    method: 'PUT',
    headers: getHeaders(auth),
    body: JSON.stringify(body)
  });
}

