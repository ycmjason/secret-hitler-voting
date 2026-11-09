const PATHS = {
  ledger: (
    <>
      <path d="M6 3.5h10.5A2.5 2.5 0 0 1 19 6v14.5H8.5A2.5 2.5 0 0 1 6 18z" />
      <path d="M6 18a2.5 2.5 0 0 1 2.5-2.5H19M10 8h5M10 11h3" />
    </>
  ),
  invite: (
    <>
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3 20c0-3.6 2.9-6.5 6.5-6.5S16 16.4 16 20M19 7.5v6M16 10.5h6" />
    </>
  ),
  moon: <path d="M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" />
      <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
    </>
  ),
  share: <path d="M12 3.5v11M7.5 8 12 3.5 16.5 8M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />,
  sliders: (
    <>
      <path d="M4 7h9M17.5 7H20M4 17h3M11.5 17H20" />
      <circle cx="15.5" cy="7" r="2" />
      <circle cx="9.5" cy="17" r="2" />
    </>
  ),
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  back: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  pen: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  erase: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />,
};

export type IconName = keyof typeof PATHS;

export const Icon = ({ name, small = false }: { name: IconName; small?: boolean }) => (
  <svg className={small ? 'icon icon-sm' : 'icon'} viewBox="0 0 24 24" aria-hidden="true">
    {PATHS[name]}
  </svg>
);
