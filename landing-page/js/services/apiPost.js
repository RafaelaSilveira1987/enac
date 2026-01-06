// services/apiPost.js
import apiFetch from './apiFetch.js';
import { getHeaders } from './apiHeaders.js';

export function apiPost(url, body = {}, auth = false) {
  return apiFetch(url, {
    method: 'POST',
    headers: getHeaders(auth),
    body: JSON.stringify(body)
  });
}

/*
Uso post

apiPost('/api/login', { email, senha })
apiPost('/api/pedidos', dados, true)

*/