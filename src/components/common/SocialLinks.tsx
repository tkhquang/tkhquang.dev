type SocialLink = "Github" | "LinkedIn" | "freeCodeCamp";

interface SocialLinksProps extends React.ComponentProps<"ul"> {
  entities?: SocialLink[];
}

const SocialLinks = ({
  entities = ["Github", "LinkedIn", "freeCodeCamp"],
  ...props
}: SocialLinksProps) => {
  function checkIfShouldShow(link: SocialLink) {
    return entities.includes(link);
  }

  return (
    <ul {...props}>
      {checkIfShouldShow("Github") && (
        <li>
          <a
            href="https://github.com/tkhquang"
            target="_blank"
            rel="noopener noreferrer"
            title="Github"
            className="hover:opacity-75"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0"
              viewBox="0 0 496 512"
            >
              <path
                stroke="none"
                d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
              ></path>
            </svg>
          </a>
        </li>
      )}
      {checkIfShouldShow("LinkedIn") && (
        <li>
          <a
            href="https://www.linkedin.com/in/tkhquang"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            className="hover:text-theme-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0"
              viewBox="0 0 448 512"
            >
              <path
                stroke="none"
                d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"
              ></path>
            </svg>
          </a>
        </li>
      )}
      {checkIfShouldShow("freeCodeCamp") && (
        <li>
          <a
            href="https://www.freecodecamp.org/forum/u/tkhquang/summary"
            target="_blank"
            rel="noopener noreferrer"
            title="freeCodeCamp"
            className="hover:text-theme-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0"
              viewBox="0 0 576 512"
            >
              <path
                stroke="none"
                d="M97.22 96.21c10.36-10.65 16-17.12 16-21.9 0-2.76-1.92-5.51-3.83-7.42a14.81 14.81 0 00-8.39-2.84c-8.48 0-20.92 8.79-35.84 25.69C23.68 137 2.51 182.81 3.37 250.34s17.47 117 54.06 161.87C76.22 435.86 90.62 448 100.9 448a13.55 13.55 0 008.37-3.84c1.91-2.76 3.81-5.63 3.81-8.38 0-5.63-3.86-12.2-13.2-20.55-44.45-42.33-67.32-97-67.48-165-.15-61.43 21.6-112.4 64.82-154.02zm142.25 323.86c.58.37.91.55.91.55zm93.79.55l.17-.13c-.19.13-.26.18-.17.13zm3.13-158.18c-16.24-4.15 50.41-82.89-68.05-177.17 0 0 15.54 49.38-62.83 159.57-74.27 104.35 23.46 168.73 34 175.23-6.73-4.35-47.4-35.7 9.55-128.64 11-18.3 25.53-34.87 43.5-72.16 0 0 15.91 22.45 7.6 71.13C287.7 364 354 342.91 355 343.94c22.75 26.78-17.72 73.51-21.58 76.55 5.49-3.65 117.71-78 33-188.1-5.99 6.01-13.8 34.2-30.03 30.05zM510.88 89.69C496 72.79 483.52 64 475 64a14.81 14.81 0 00-8.39 2.84c-1.91 1.91-3.83 4.66-3.83 7.42 0 4.78 5.6 11.26 16 21.9 43.23 41.61 65 92.59 64.82 154.06-.16 68-23 122.63-67.48 165-9.34 8.35-13.18 14.92-13.2 20.55 0 2.75 1.9 5.62 3.81 8.38a13.61 13.61 0 008.37 3.85c10.28 0 24.68-12.13 43.47-35.79 36.59-44.85 53.14-94.38 54.06-161.87S552.32 137 510.88 89.69z"
              ></path>
            </svg>
          </a>
        </li>
      )}
    </ul>
  );
};

export default SocialLinks;
