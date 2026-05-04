import getEcho from './echo';

export const API_BASE_URL = 'http://127.0.0.1:8000/api';

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
