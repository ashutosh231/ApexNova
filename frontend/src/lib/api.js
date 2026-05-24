import getEcho from './echo';

export const API_BASE_URL = 'https://apexnovaa.me/api';

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
