export default function Heart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 62.62 67.43"
      fill="none"
      strokeWidth={4}
      className={`absolute top-0 left-0 ${props.className}`}
      {...props}
    >
      <path d="M15.13,39.69c-6.22-3.42-13.08-7.89-14.03-14.92-.74-5.51,2.84-11.09,7.87-13.48s11.12-1.86,16.13.58,9,6.6,12.09,11.23c-2.64-6.4-1.41-14.54,3.84-19.05S55.42,0,59.38,5.68c2.27,3.26,2.62,7.54,1.9,11.44s-2.41,7.55-3.96,11.2c-4.87,11.5-7.91,23.29-10.73,35.4-4.53-13.81-19.66-17.54-31.46-24.03Z" />
    </svg>
  );
}
