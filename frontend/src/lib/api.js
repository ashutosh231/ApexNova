import getEcho from './echo';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
      return `http://${hostname}:8000/api`;
    }
  }
  return 'https://apexnovaa.me/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const authHeaders = (token, extra = {}) => {
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...extra,
  };
  
  const echo = getEcho();
  if (echo && echo.socketId()) {
    headers['X-Socket-ID'] = echo.socketId();
  }
  
  return headers;
};
