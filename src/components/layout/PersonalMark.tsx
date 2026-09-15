const HOOD_OPENING =
  "M10.3 26.5C11.3 19.8 16.1 17.9 20 13.7C23.9 17.9 28.7 19.8 29.7 26.5L24.5 31.1Q20 35 15.5 31.1L10.3 26.5Z";

/** A small hooded signature, drawn for the header from the author's portrait. */
const PersonalMark = () => (
  <svg
    className="personal-mark"
    width="36"
    height="36"
    viewBox="0 0 40 40"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      className="personal-mark__cloak"
      d="M20 3.5C12.5 7 8.7 13.3 7.4 21L6 30.2L20 37L34 30.2L32.6 21C31.3 13.3 27.5 7 20 3.5Z"
      fill="currentColor"
      fillOpacity=".1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d={HOOD_OPENING}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      opacity=".65"
    />
    <path
      className="personal-mark__trace"
      d={HOOD_OPENING}
      pathLength="1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 30.2L10.3 26.5M29.7 26.5L34 30.2"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      opacity=".5"
    />
    <path
      d="M17.6 8.8C17.8 12.1 22.2 12.1 22.4 8.8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <circle cx="20" cy="7.5" r=".75" fill="currentColor" />
    <path
      className="personal-mark__eyes"
      d="M14.2 22.7L17.8 23.5M22.2 23.5L25.8 22.7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default PersonalMark;
