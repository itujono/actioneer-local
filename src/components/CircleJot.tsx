interface CircleJotProps {
  color?: string;
}

export default function CircleJot({ color }: CircleJotProps) {
  return (
    <svg
      className={`absolute -top-2 left-24 w-36 h-16 stroke-[6px] ${
        color || "stroke-jade"
      }`}
      viewBox="0 0 270.01 97.06"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M130.4,27.9c-34.51-6.17-70.69-2.69-103.38,9.94-6.16,2.38-12.34,5.17-17.09,9.76s-7.89,11.32-6.65,17.81c2.16,11.33,15.34,16.31,26.6,18.8,64.69,14.29,132.76,13.01,196.86-3.7,9.27-2.42,18.66-5.25,26.46-10.81,7.8-5.57,13.87-14.38,13.81-23.97-.06-9.69-6.37-18.52-14.41-23.95-8.03-5.43-17.62-7.99-27.09-10.09C179.86,1.57,132.26.27,86.13,7.88"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
