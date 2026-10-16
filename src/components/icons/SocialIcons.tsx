/** Ícones de redes sociais (o Lucide 1.x não inclui logotipos de marcas). */
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  focusable: false,
} as const;

export function InstagramIcon() {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg {...base} fill="currentColor">
      <path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.6V4.46A21 21 0 0 0 14.27 4.3c-2.3 0-3.87 1.4-3.87 3.97v2.23H7.8v3h2.6V21h3.1Z" />
    </svg>
  );
}

export function TikTokIcon() {
  return (
    <svg {...base} fill="currentColor">
      <path d="M16.6 3c.3 2.1 1.6 3.5 3.7 3.7v3a7 7 0 0 1-3.6-1.1v6.2a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v3.1a2.8 2.8 0 1 0 1.9 2.6V3h2.9Z" />
    </svg>
  );
}
