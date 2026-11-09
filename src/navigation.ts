import { useEffect, useState } from 'react';

const NAVIGATE_EVENT = 'shv:navigate';

/** Pushes a new path without reloading. The app has two routes, so this is all the router it needs. */
export const navigate = (path: string, { replace = false } = {}): void => {
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
};

export const usePathname = (): string => {
  const [pathname, setPathname] = useState(location.pathname);
  useEffect(() => {
    const update = () => setPathname(location.pathname);
    window.addEventListener('popstate', update);
    window.addEventListener(NAVIGATE_EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(NAVIGATE_EVENT, update);
    };
  }, []);
  return pathname;
};

export const roomUrl = (code: string): string => `${location.origin}/${code}`;
