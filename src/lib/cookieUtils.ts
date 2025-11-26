// Cookie utility functions for temporary data storage

export const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
};

export const setCookie = (name: string, value: string, days: number = 1): void => {
  if (typeof window === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));

  const cookieValue = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${COOKIE_OPTIONS.path}; sameSite=${COOKIE_OPTIONS.sameSite}`;
  document.cookie = cookieValue;
};

export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;

  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
};

export const removeCookie = (name: string): void => {
  if (typeof window === 'undefined') return;

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${COOKIE_OPTIONS.path}; sameSite=${COOKIE_OPTIONS.sameSite}`;
};

export const setDropPointDataCookie = (data: {
  customerName: string;
  customerPhone: string;
  items: Array<{
    code: string;
    shoeName: string;
    color: string;
    size: string;
    services: Array<{ name: string; amount: number }>;
    totalPrice: number;
  }>;
  subtotal: number;
  total: number;
  verificationCode: string;
}): void => {
  setCookie('dropPointData', JSON.stringify(data), 1); // Store for 1 day
};

export const getDropPointDataCookie = () => {
  const data = getCookie('dropPointData');
  return data ? JSON.parse(data) : null;
};

export const clearDropPointDataCookie = (): void => {
  removeCookie('dropPointData');
};