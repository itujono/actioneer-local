interface CurlyArrowProps {
  color?: string;
  className?: string;
}

export default function CurlyArrow({ color, className }: CurlyArrowProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 98.25 232.1"
      fill="none"
      className={`absolute top-0 -left-16 sm:-left-20 w-20 h-64 stroke-[6px] ${
        color || "stroke-thunder"
      } ${className}`}
    >
      <g strokeLinecap="round">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M96.75,1.5c-20.53,2.28-39.82,14-51.31,31.16-11.49,17.17-14.97,39.47-9.25,59.32,3.29,11.43,10.26,22.67,21.31,27.07,11.05,4.4,26.15-1.03,28.72-12.65,2.05-9.27-4.55-18.92-13.3-22.62-8.74-3.7-18.88-2.46-27.8.78C14.22,95.77-4.93,132.38,3.49,164.15c8.41,31.77,43.17,54.11,75.57,48.56"
        />
        <path d="M60.18,194.92c4.38,7.61,11.07,13.86,18.97,17.7-9.34,4.44-17.88,10.57-25.09,17.99" />
      </g>
    </svg>
  );
}
