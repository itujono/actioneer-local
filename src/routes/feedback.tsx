import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { DashboardContainer } from "../components/dashboard";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { Button } from "../components/ui";
import { CheckCircle, MessageSquare, Send } from "lucide-react";

export const feedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feedback",
  component: FeedbackPage,
});

interface FeedbackCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  {
    id: "email-parsing",
    title: "Email Parsing Issues",
    description: "Problems with email classification or data extraction",
    icon: "📧",
  },
  {
    id: "multi-currency",
    title: "Multi-currency Problems",
    description: "Currency conversion or display issues",
    icon: "💱",
  },
  {
    id: "gmail-setup",
    title: "Gmail Setup Issues",
    description: "Keep getting asked to enable Gmail processing",
    icon: "🔄",
  },
  {
    id: "data-accuracy",
    title: "Data Accuracy",
    description: "Incorrect amounts, dates, or merchant information",
    icon: "🎯",
  },
  {
    id: "performance",
    title: "Performance Issues",
    description: "Slow loading, timeouts, or responsiveness problems",
    icon: "⚡",
  },
  {
    id: "feature-request",
    title: "Feature Request",
    description: "Suggestions for new features or improvements",
    icon: "💡",
  },
  {
    id: "ui-ux",
    title: "UI/UX Feedback",
    description: "Design, layout, or user experience suggestions",
    icon: "🎨",
  },
  {
    id: "other",
    title: "Other",
    description: "Something else not covered by the categories above",
    icon: "🤔",
  },
];

function FeedbackPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({
      category,
      feedback,
    }: {
      category: string;
      feedback: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        category,
        feedback_text: feedback,
        user_email: user.email,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        "Thank you! Your feedback has been submitted successfully."
      );
      setIsSubmitted(true);
      setSelectedCategory("");
      setFeedbackText("");
    },
    onError: (error) => {
      console.error("Feedback submission error:", error);
      toast.error("Failed to submit feedback. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) {
      toast.error("Please select a feedback category");
      return;
    }

    if (!feedbackText.trim()) {
      toast.error("Please provide detailed feedback");
      return;
    }

    submitFeedbackMutation.mutate({
      category: selectedCategory,
      feedback: feedbackText.trim(),
    });
  };

  if (isSubmitted) {
    return (
      <DashboardContainer
        title="Feedback Submitted"
        description="Thank you for helping us improve Actioneer!"
      >
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-jade/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-jade" />
          </div>
          <h2 className="text-2xl font-bold text-thunder mb-4">
            Feedback Received!
          </h2>
          <p className="text-thunder/70 mb-8">
            We appreciate you taking the time to share your thoughts. Your
            feedback helps us make Actioneer better for everyone.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="mr-4"
            >
              Submit More Feedback
            </Button>
            <Button onClick={() => (window.location.href = "/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer
      maxWidth="5xl"
      title="Share Your Feedback"
      description="Help us improve Actioneer by sharing your experience and suggestions"
      className="pb-16"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Feedback Categories */}
        <div>
          <h2 className="text-lg font-medium text-thunder mb-4">
            What type of feedback do you have?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEEDBACK_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 text-left border-2 rounded-lg transition-all duration-200 focus:ring-0 focus:outline-none ring-0 outline-none hover:shadow-md ${
                  selectedCategory === category.id
                    ? "border-heliotrope bg-heliotrope/5 shadow-md"
                    : "border-gray-light hover:border-thunder/20"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1">
                    <h3
                      className={`font-medium mb-1 ${
                        selectedCategory === category.id
                          ? "text-heliotrope"
                          : "text-thunder"
                      }`}
                    >
                      {category.title}
                    </h3>
                    <p className="text-sm text-thunder/70">
                      {category.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Feedback */}
        <div>
          <label
            htmlFor="feedback-text"
            className="block text-lg font-medium text-thunder mb-4"
          >
            Tell us more about your experience
          </label>
          <textarea
            id="feedback-text"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Please provide as much detail as possible. For bugs, include steps to reproduce the issue. For feature requests, describe what you'd like to see and how it would help you."
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-light rounded-lg focus:border-heliotrope focus:ring-0 ring-0 outline-none resize-none text-thunder placeholder-thunder/50 transition-all duration-200"
            required
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-thunder/70">
              {feedbackText.length}/1000 characters
            </p>
            {feedbackText.length > 1000 && (
              <p className="text-sm text-red-600">
                Please keep feedback under 1000 characters
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-6 border-t border-concrete">
          <div className="flex items-center space-x-2 text-sm text-thunder/70">
            <MessageSquare className="w-4 h-4" />
            <span>Your feedback is anonymous and helps improve Actioneer</span>
          </div>
          <Button
            type="submit"
            disabled={
              !selectedCategory ||
              !feedbackText.trim() ||
              feedbackText.length > 1000 ||
              submitFeedbackMutation.isPending
            }
            className="flex items-center space-x-2"
          >
            {submitFeedbackMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </DashboardContainer>
  );
}
