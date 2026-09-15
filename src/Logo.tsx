export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M6 28 14.4 6.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26 28 17.6 6.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M16 8.2v2.4M16 13.2v2.2M16 18v2.1M16 22.8v2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path d="M16 3.6 18.15 8.4 16 7.35 13.85 8.4Z" fill="currentColor" />
    </svg>
  )
}
