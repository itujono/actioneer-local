import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import Bubble from "../illustrations/Bubble";

interface WelcomeOnboardingProps {
  open: boolean;
  onComplete?: () => void;
}

export default function WelcomeOnboarding({
  open,
  onComplete,
}: WelcomeOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Actioneer!",
      subtitle: "Your AI-powered email assistant is ready",
      description:
        "You've just unlocked the power to transform every email into actionable insights. Let's show you what's possible!",
      color: "from-heliotrope to-purple-600",
    },
    {
      title: "Smart Expense Tracking",
      subtitle: "Every receipt becomes instant data",
      description:
        "Amazon purchases, restaurant bills, subscription renewals - all automatically categorized and tracked. No more manual entry, ever.",
      color: "from-gold to-yellow-600",
    },
    {
      title: "Travel Intelligence",
      subtitle: "From booking chaos to trip clarity",
      description:
        "Travel promotional emails, destination deals, travel inspiration - automatically organized with smart destination recommendations and travel insights.",
      color: "from-jade to-green-600",
    },
    {
      title: "Job Application Tracker",
      subtitle: "Never lose track of opportunities",
      description:
        "Application confirmations, interview invites, status updates - all tracked in one intelligent dashboard.",
      color: "from-bittersweet to-red-600",
    },
    {
      title: "You're All Set!",
      subtitle: "Start receiving emails to see the magic",
      description:
        "Your dashboard will populate automatically as emails arrive. Send yourself a receipt or booking confirmation to test it out!",
      color: "from-lime to-green-500",
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-4xl max-h-[80vh] h-[60rem] overflow-y-hidden [&>button]:hidden bg-heliotrope border-daisy border-2 focus:outline-none focus:ring-0"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Welcome to Actioneer</DialogTitle>
          <DialogDescription>
            Get started with your AI-powered email assistant
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 relative">
          <Bubble
            size="small"
            className="absolute top-1/4 left-0 transform -translate-x-1/2 -translate-y-1/2 w-[14rem] h-[14rem] z-10 text-lavender"
          />
          <Bubble className="absolute top-[100%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] z-0 text-daisy" />

          <div className="text-center max-w-xl mx-auto relative bottom-10 h-full z-20 flex flex-col justify-center items-center">
            <div>
              <h2 className="text-3xl font-bold text-lavender">
                {currentStepData.title}
              </h2>
              <h3 className="text-xl text-white font-semibold">
                {currentStepData.subtitle}
              </h3>
              <p className="text-lg text-concrete leading-relaxed px-4 mt-8">
                {currentStepData.description}
              </p>
              <div className="flex flex-col gap-4 justify-center items-center mt-12">
                <Button
                  onClick={handleNext}
                  className="w-full max-w-sm mx-auto !bg-daisy hover:!bg-daisy/90"
                >
                  {currentStep < steps.length - 1 ? "Next" : "Get Started!"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {currentStep < steps.length - 1 && (
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip tour
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-8 absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index <= currentStep
                      ? "bg-heliotrope scale-110"
                      : "bg-concrete"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
