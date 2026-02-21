export default function ProgressBarLogo({ size = 32 }) {
  return (
    <svg
      width={size * 2.5}
      height={size * 0.6}
      viewBox="0 0 80 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Progress Map logo"
    >
      <rect x="0" y="4" width="80" height="12" rx="6" fill="#E5E5E0" />
      <rect x="0" y="4" width="52" height="12" rx="6" fill="#2D6A4F" />
    </svg>
  );
}
