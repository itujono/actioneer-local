import {
  CheckCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Mail,
  Zap,
  ArrowRight,
  Download,
  Check,
} from "lucide-react";
import { useGmailAddonStatus } from "../../hooks/useGmailAddonStatus";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface GmailAddonActivationProps {
  className?: string;
}

export default function GmailAddonActivation({
  className = "",
}: GmailAddonActivationProps) {
  const { isActivated, activatedAt, isLoading, error } = useGmailAddonStatus();
  const [hasInstalled, setHasInstalled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // For Gmail add-ons, there's no direct installation URL
  // Users need to install via Apps Script test deployment or marketplace
  const GMAIL_URL = "https://mail.google.com";
  const APPS_SCRIPT_URL = "https://script.google.com/home";

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["gmail-addon-status"] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleInstalledClick = () => {
    setHasInstalled(true);
  };

  // If user is already activated, show compact success state
  if (isActivated) {
    return (
      <div
        className={`bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-800">
              🎉 Gmail Add-on Activated!
            </h3>
            <p className="text-sm text-green-700">
              Email processing is live
              {activatedAt && (
                <span className="ml-2">
                  • Activated{" "}
                  {formatDistanceToNow(new Date(activatedAt), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </p>
          </div>
          <Zap className="w-5 h-5 text-green-600" />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`bg-gray-50 border-2 border-gray-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
          <span className="text-gray-600">Checking Gmail add-on status...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`bg-red-50 border-2 border-red-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Check Status
            </h3>
            <p className="text-red-700 mb-3">
              We couldn't verify your Gmail add-on status. Please try
              refreshing.
            </p>
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
            >
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine current step
  const currentStep = !hasInstalled ? 1 : 2;

  // Main onboarding flow - show all steps at once
  return (
    <div
      className={`bg-gradient-to-r from-heliotrope/10 to-purple-50 border-2 border-heliotrope/30 rounded-lg p-6 ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Gmail Add-on Setup
        </h3>
        <p className="text-gray-600">
          Follow these 3 simple steps to start automatic email processing
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Install */}
        <div
          className={`relative ${
            currentStep >= 1 ? "opacity-100" : "opacity-50"
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  hasInstalled
                    ? "bg-green-500 text-white"
                    : currentStep === 1
                    ? "bg-heliotrope text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {hasInstalled ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-bold text-sm">1</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h4
                className={`font-semibold mb-2 ${
                  hasInstalled ? "text-green-800" : "text-gray-800"
                }`}
              >
                {hasInstalled
                  ? "✓ Gmail Add-on Installed"
                  : "Install Gmail Add-on"}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {hasInstalled
                  ? "Great! The add-on is now available in your Gmail sidebar."
                  : "Install the Actioneer add-on through Google Apps Script."}
              </p>

              {!hasInstalled && (
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-heliotrope rounded-full"></div>
                    <span>
                      Visit Apps Script and find the Actioneer project
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-heliotrope rounded-full"></div>
                    <span>Run a test deployment to install the add-on</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-heliotrope rounded-full"></div>
                    <span>Verify the add-on appears in Gmail sidebar</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={APPS_SCRIPT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center px-3 py-2 text-sm rounded-md transition-colors ${
                    hasInstalled
                      ? "border border-gray-300 text-gray-500 cursor-not-allowed"
                      : "border border-heliotrope text-heliotrope hover:bg-heliotrope hover:text-white"
                  }`}
                  {...(hasInstalled && {
                    "aria-disabled": "true",
                    tabIndex: -1,
                  })}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Open Apps Script
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
                {!hasInstalled && (
                  <button
                    onClick={handleInstalledClick}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm bg-heliotrope text-white hover:bg-heliotrope/90 rounded-md transition-colors"
                  >
                    I've Installed It
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Connecting line */}
        <div className="flex justify-start ml-4">
          <div
            className={`w-px h-4 ${
              hasInstalled ? "bg-green-300" : "bg-gray-300"
            }`}
          ></div>
        </div>

        {/* Step 2: Activate */}
        <div
          className={`relative ${
            currentStep >= 2 ? "opacity-100" : "opacity-50"
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActivated
                    ? "bg-green-500 text-white"
                    : currentStep === 2
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isActivated ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-bold text-sm">2</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h4
                className={`font-semibold mb-2 ${
                  isActivated
                    ? "text-green-800"
                    : currentStep === 2
                    ? "text-blue-800"
                    : "text-gray-500"
                }`}
              >
                {isActivated ? "✓ Add-on Activated" : "Activate Your Add-on"}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {isActivated
                  ? "Perfect! Your account is created and email processing has begun."
                  : "Open the add-on once in Gmail to create your account and start processing."}
              </p>

              {!isActivated && currentStep === 2 && (
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Open Gmail in your browser</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Find the Actioneer icon in the right sidebar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Click the icon once to activate</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={GMAIL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center px-3 py-2 text-sm rounded-md transition-colors ${
                    currentStep < 2 || isActivated
                      ? "border border-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  {...(currentStep < 2 && {
                    "aria-disabled": "true",
                    tabIndex: -1,
                  })}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Open Gmail
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
                {currentStep === 2 && !isActivated && (
                  <button
                    onClick={handleRefreshStatus}
                    disabled={isRefreshing}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isRefreshing ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Check Status
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Connecting line */}
        <div className="flex justify-start ml-4">
          <div
            className={`w-px h-4 ${
              isActivated ? "bg-green-300" : "bg-gray-300"
            }`}
          ></div>
        </div>

        {/* Step 3: Enjoy */}
        <div
          className={`relative ${isActivated ? "opacity-100" : "opacity-50"}`}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActivated
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isActivated ? (
                  <Zap className="w-5 h-5" />
                ) : (
                  <span className="font-bold text-sm">3</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h4
                className={`font-semibold mb-2 ${
                  isActivated ? "text-green-800" : "text-gray-500"
                }`}
              >
                {isActivated
                  ? "🎉 Email Processing Live!"
                  : "Enjoy Automatic Processing"}
              </h4>
              <p className="text-sm text-gray-600">
                {isActivated
                  ? "Your emails are now being processed automatically. Check your dashboard for insights!"
                  : "Once activated, all your receipt, travel, and job emails will be processed automatically."}
              </p>

              {isActivated && (
                <div className="mt-3 p-3 bg-green-100 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800 font-medium">
                      Ready to go! Open any receipt, travel booking, or job
                      email in Gmail to see smart actions.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
