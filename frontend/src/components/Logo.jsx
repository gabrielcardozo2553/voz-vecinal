function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path
        d="M18 20h60a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8H48L34 80V66H18a8 8 0 0 1-8-8V28a8 8 0 0 1 8-8z"
        fill="white"
      />
      <path
        d="M48 28c-8 0-14 6-14 13.5C34 51 48 62 48 62s14-11 14-20.5C62 34 56 28 48 28z"
        style={{ fill: 'var(--color-primario)' }}
      />
      <circle cx="48" cy="41" r="5" style={{ fill: 'var(--color-acento)' }} />
    </svg>
  );
}

export default Logo;
