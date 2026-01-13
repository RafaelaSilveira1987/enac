const ApiConfig = {
  baseURL: (() => {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocal) {
      return 'http://localhost:80/enac/api/v1'; // porta 80 é padrão
      // se precisar:
      // return 'http://localhost:80';
    }

    return 'https://frontiers.org.br/enac/api/v1'; // produção
  })(),

  timeout: 15000
};

export default ApiConfig;
