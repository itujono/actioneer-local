import { Bubble, Fling, Heart, Spiral, ThreeSplashes } from "../illustrations";

export function GridIllustrations() {
  const cardStyle = `
    @keyframes fadeInScale {
      0% {
        opacity: 0;
        transform: scale(0.8) translateY(10px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `;
  return (
    <>
      <style>{cardStyle}</style>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 grid-rows-5 sm:grid-rows-4 lg:grid-rows-3 gap-1 sm:gap-2 lg:gap-0 w-full max-w-sm sm:max-w-md lg:max-w-none h-3/4 lg:w-full lg:h-1/2 sm:h-80">
        {/* Row 1 */}
        <div
          className="bg-heliotrope rounded-3xl overflow-hidden"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 0.2s forwards",
          }}
        >
          <Fling className="w-[10rem] h-[10rem] lg:w-[16rem] lg:h-[16rem] stroke-lavender stroke-[70px] sm:stroke-[40px] lg:stroke-[70px] stroke-offset-2 lg:bottom-10 lg:right-10 relative" />
        </div>
        <div
          className="bg-gold bg-[url('/heart.svg')] bg-contain bg-no-repeat bg-center bg-blend-multiply rounded-3xl"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 0.8s forwards",
          }}
        ></div>
        <div
          className="bg-lime bg-[url('/circle-jot.svg')] bg-[length:80%] bg-repeat-y bg-center bg-blend-overlay rounded-3xl"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 0.4s forwards",
          }}
        ></div>
        <div
          className="bg-jade bg-[url('/3-splashes.svg')] bg-cover bg-center bg-blend-soft-light rounded-3xl"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 1.2s forwards",
          }}
        ></div>
        <div
          className="bg-lavender bg-[url('/bubble-large.svg')] bg-contain bg-no-repeat bg-center bg-blend-color-dodge rounded-3xl"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 0.6s forwards",
          }}
        ></div>

        {/* Row 2 */}
        <div
          className="bg-bittersweet rounded-3xl overflow-hidden"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 1.4s forwards",
          }}
        >
          <div className="text-gold text-xl lg:text-4xl leading-none lg:leading-7 font-bold italic">automate</div>
          <div className="text-gold text-xl lg:text-4xl leading-none lg:leading-7 font-bold italic">your</div>
          <div className="text-gold text-xl lg:text-4xl leading-none lg:leading-7 font-bold italic">receipts</div>
          <div className="text-gold text-xl lg:text-4xl leading-none lg:leading-7 font-bold italic">automate</div>
          <div className="text-gold text-xl lg:text-4xl leading-none lg:leading-7 font-bold italic">your</div>
          <div className="text-gold text-xl lg:text-4xl leading-none lg:leading-7 font-bold italic">receipts</div>
        </div>
        <div
          className="bg-daisy rounded-3xl"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 0.1s forwards",
          }}
        >
          <Spiral className="w-full h-full stroke-lavender" />
        </div>
        <div
          className="bg-sandy bg-[url('/circle-jot.svg')] bg-[length:70%] bg-no-repeat bg-center bg-blend-multiply rounded-3xl"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 1.0s forwards",
          }}
        >
          <div className="flex justify-center items-center h-full">
            <h3 className="text-bittersweet text-base lg:text-lg font-bold">actioneer</h3>
          </div>
        </div>
        <div
          className="bg-heliotrope bg-[url('/3-splashes.svg')] bg-cover bg-center bg-blend-color-dodge rounded-3xl"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 0.3s forwards",
          }}
        ></div>
        <div
          className="bg-lime rounded-3xl overflow-hidden"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 1.6s forwards",
          }}
        >
          <div className="flex flex-col gap-0 items-center justify-center h-full overflow-hidden">
            <div className="text-jade text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">actioneer</div>
            <div className="text-jade text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">actioneer</div>
            <div className="text-jade text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">actioneer</div>
            <div className="text-jade text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">actioneer</div>
            <div className="text-jade text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">actioneer</div>
            <div className="text-jade text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">actioneer</div>
            <div className="text-jade text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">actioneer</div>
          </div>
        </div>

        {/* Row 3 */}
        <div
          className="bg-jade rounded-3xl overflow-hidden"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 0.7s forwards",
          }}
        >
          <Bubble className="w-full h-full text-lime relative top-12" />
        </div>
        <div
          className="bg-lavender rounded-3xl overflow-hidden"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 1.3s forwards",
          }}
        >
          <div className="text-heliotrope text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">automate</div>
          <div className="text-white text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic whitespace-nowrap">
            job applications
          </div>
          <div className="text-heliotrope text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">automate</div>
          <div className="text-white text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic whitespace-nowrap">
            job applications
          </div>
          <div className="text-heliotrope text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic">automate</div>
          <div className="text-white text-xl lg:text-3xl leading-none lg:leading-6 font-bold italic whitespace-nowrap">
            job applications
          </div>
        </div>
        <div
          className="bg-gold overflow-hidden rounded-3xl"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 0.5s forwards",
          }}
        >
          <ThreeSplashes className="w-full h-full lg:w-[14rem] lg:h-[14rem] text-sandy" />
        </div>
        <div
          className="bg-bittersweet bg-[url('/bubble-small.svg')] bg-cover bg-center bg-blend-color-dodge rounded-3xl"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 0.9s forwards",
          }}
        ></div>
        <div
          className="bg-daisy rounded-3xl overflow-hidden"
          style={{
            opacity: 0,
            animation: "fadeInScale 0.6s ease-out 1.1s forwards",
          }}
        >
          <Heart className="w-full h-full stroke-heliotrope stroke-[20px]" />
        </div>
      </div>
    </>
  );
}
