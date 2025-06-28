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

interface WelcomeOnboardingProps {
  open: boolean;
  onComplete?: () => void;
}

export default function WelcomeOnboarding({
  open,
  onComplete,
}: WelcomeOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  console.log({ open });

  const steps = [
    {
      title: "🎉 Welcome to Actioneer!",
      subtitle: "Your AI-powered email assistant is ready",
      description:
        "You've just unlocked the power to transform every email into actionable insights. Let's show you what's possible!",
      color: "from-heliotrope to-purple-600",
    },
    {
      title: "💰 Smart Expense Tracking",
      subtitle: "Every receipt becomes instant data",
      description:
        "Amazon purchases, restaurant bills, subscription renewals - all automatically categorized and tracked. No more manual entry, ever.",
      color: "from-gold to-yellow-600",
    },
    {
      title: "✈️ Travel Intelligence",
      subtitle: "From booking chaos to trip clarity",
      description:
        "Hotel confirmations, flight details, rental cars - automatically organized with smart recommendations and price comparisons.",
      color: "from-jade to-green-600",
    },
    {
      title: "💼 Job Application Tracker",
      subtitle: "Never lose track of opportunities",
      description:
        "Application confirmations, interview invites, status updates - all tracked in one intelligent dashboard.",
      color: "from-bittersweet to-red-600",
    },
    {
      title: "⚡ You're All Set!",
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onComplete?.()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Welcome to Actioneer</DialogTitle>
          <DialogDescription>
            Get started with your AI-powered email assistant
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex justify-center mb-8">
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

          {/* Content */}
          <div className="text-center max-w-2xl mx-auto">
            {/* Title & Subtitle */}
            <h2 className="text-3xl font-bold text-thunder mb-2">
              {currentStepData.title}
            </h2>
            <h3 className="text-xl text-heliotrope font-semibold mb-4">
              {currentStepData.subtitle}
            </h3>

            {/* Description */}
            <p className="text-lg text-gray-600 leading-relaxed mb-8 px-4">
              {currentStepData.description}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-4 justify-center items-center">
              <Button onClick={handleNext} className="w-full max-w-sm mx-auto">
                {currentStep < steps.length - 1 ? "Next" : "Get Started!"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {currentStep < steps.length - 1 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip tour
                </Button>
              )}
            </div>

            {/* Fun fact for engagement */}
            {/* {currentStep === steps.length - 1 && (
              <div className="mt-8 p-4 bg-lime/10 border-2 border-lime/20 rounded-lg">
                <p className="text-sm text-gray-600">
                  💡 <strong>Pro tip:</strong> Forward old receipts or booking
                  confirmations to yourself to see instant results!
                </p>
              </div>
            )} */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
