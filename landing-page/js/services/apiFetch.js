// services/apiFetch.js
import ApiConfig from './config.js';

async function apiFetch(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ApiConfig.timeout);

  console.log('BASE:', ApiConfig.baseURL);
  console.log('ENDPOINT:', endpoint);
  console.log('FINAL:', new URL(endpoint, ApiConfig.baseURL).href);

  try {
    const response = await fetch(ApiConfig.baseURL + endpoint, {
      ...options,
      signal: controller.signal
    });

    const contentType = response.headers.get('content-type');

    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw {
        status: response.status,
        data
      };
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw { message: 'Tempo de requisição excedido' };
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export default apiFetch;
