import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface WaitlistFormProps {
  onSwitchToLogin: () => void;
}

interface WaitlistResponse {
  success: boolean;
  message: string;
  error?: string;
  position?: number;
  totalSignups?: number;
  isExistingUser?: boolean;
  waitlistFull?: boolean;
  alreadyExists?: boolean;
}

const joinWaitlist = async (email: string): Promise<WaitlistResponse> => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/join-waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  console.log({ data });

  if (!response.ok) {
    if (data.isExistingUser) {
      throw new Error("You already have access to Actioneer. Please sign in instead.");
    }
    if (data.waitlistFull) {
      throw new Error("Sorry, the beta waitlist is now full (40/40). Thank you for your interest!");
    }
    throw new Error(data.error || "Failed to join waitlist");
  }

  return data;
};

export function WaitlistForm({ onSwitchToLogin }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [waitlistData, setWaitlistData] = useState<WaitlistResponse | null>(null);

  const waitlistMutation = useMutation({
    mutationFn: joinWaitlist,
    onSuccess: (data) => {
      console.log("✅ Successfully joined waitlist:", data);
      toast.success(data.message);
      setWaitlistData(data);
      setSubmitted(true);
    },
    onError: (error) => {
      console.error("❌ Waitlist signup error:", error);
      if (error instanceof Error) {
        if (error.message.includes("already have access")) {
          toast.error(error.message);
          // Redirect to login after a short delay
          setTimeout(() => {
            onSwitchToLogin();
          }, 2000);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to join waitlist. Please try again.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    waitlistMutation.mutate(email.trim().toLowerCase());
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-jade">
            <svg className="h-6 w-6 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-thunder mb-2">You're on the list! 🎉</h3>

        {waitlistData?.position && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-heliotrope/10 text-heliotrope mb-3">
            Position #{waitlistData.position} of 40
          </div>
        )}

        <p className="text-sm text-thunder/70 mb-6">
          We'll send you an email within the next 1-2 hours with access instructions.
        </p>

        <Button onClick={onSwitchToLogin} variant="ghost" size="sm">
          Already have access? Sign in →
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-heliotrope/10 text-heliotrope mb-4">
          Beta Access Required
        </div>

        <h2 className="text-3xl font-extrabold text-thunder mb-2">Join the Actioneer Beta</h2>

        <p className="text-sm text-thunder/70">Get early access to transform your emails into actionable insights</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          required
          autoComplete="email"
          size="lg"
          helperText="Gmail or Google Workspace accounts only • Limited to 40 users"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={waitlistMutation.isPending}
          disabled={waitlistMutation.isPending}
          className="w-full"
        >
          {waitlistMutation.isPending ? "Joining waitlist..." : "Join Beta Waitlist"}
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-concrete"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-concrete text-thunder/60">or</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Button onClick={onSwitchToLogin} variant="ghost" size="sm">
          Already have access? Sign in with Google →
        </Button>
      </div>

      {/* <div className="mt-8">
        <div className="bg-heliotrope/5 border border-heliotrope/20 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-heliotrope" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-heliotrope">Beta Program Details</h3>
              <div className="mt-1 text-sm text-heliotrope/80">
                <p>Early access includes all core features with priority support and direct feedback channels.</p>
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}
