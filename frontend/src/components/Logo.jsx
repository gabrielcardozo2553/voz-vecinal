function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      
      <path
        d="M8 8h32a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H26l-9 8v-8H8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z"
        fill="white"
        fillOpacity="0.95"
      />
      
      <path
        d="M24 12c-4.4 0-8 3.4-8 7.6 0 5.4 8 12.4 8 12.4s8-7 8-12.4C32 15.4 28.4 12 24 12z"
        style={{ fill: 'var(--color-primario)' }}
      />
      <circle cx="24" cy="19.6" r="3" fill="white" />
    </svg>
  );
}

export default Logo;