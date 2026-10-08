import type { CSSProperties } from "react";

const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  layers: "m12 3 9 5-9 5-9-5 9-5Z M3 12l9 5 9-5 M3 16l9 5 9-5",
  chart: "M4 20h16 M7 16V9 M12 16V4 M17 16v-5",
  book: "M12 5v16 M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3V3Z",
  plus: "M12 5v14 M5 12h14",
  arrow: "M5 12h14 m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  check: "m5 12 4 4L19 6",
  clock: "M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  repo: "M5 3h14v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M3 17h16 M8 7h6",
  terminal: "m5 7 5 5-5 5 M13 17h6",
  code: "m8 6-6 6 6 6 m8-12 6 6-6 6 M14 3l-4 18",
  close: "m6 6 12 12 M6 18 18 6",
  external: "M14 3h7v7 M21 3 10 14 M10 3H3v18h18v-7",
  copy: "M9 9h12v12H9z M15 9V3H3v12h6",
  download: "M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5",
  bolt: "m13 2-9 12h7l-1 8L21 9h-8l0-7Z",
  info: "M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  branch:
    "M6 3v12 M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M18 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M18 9a9 9 0 0 1-9 9",
  dollar: "M12 2v20 M17 6H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H6",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z m-4 9 3 3 5-6",
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 18,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
