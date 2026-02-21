export default function ProgressBarLogo({ size = 24 }) {
  const width = size * 4.2;
  const height = size;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 168 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Progress Map logo"
    >
      {/* Full pill background */}
      <rect x="0" y="0" width="168" height="40" rx="20" fill="#E8E6E1" />
      {/* Green left portion */}
      <clipPath id="leftClip">
        <rect x="0" y="0" width="110" height="40" />
      </clipPath>
      <rect x="0" y="0" width="168" height="40" rx="20" fill="#2D6A4F" clipPath="url(#leftClip)" />
      {/* PROGRESS text */}
      <text
        x="14"
        y="26.5"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="700"
        fontSize="17"
        letterSpacing="0.5"
        fill="#ffffff"
      >PROGRESS</text>
      {/* MAP text */}
      <text
        x="117"
        y="26.5"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="700"
        fontSize="17"
        letterSpacing="0.5"
        fill="#2D6A4F"
      >MAP</text>
    </svg>
  );
}
