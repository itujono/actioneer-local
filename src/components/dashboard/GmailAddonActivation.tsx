import {
  CheckCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Mail,
  Zap,
} from "lucide-react";
import { useGmailAddonStatus } from "../../hooks/useGmailAddonStatus";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui";

interface GmailAddonActivationProps {
  className?: string;
}

export default function GmailAddonActivation({
  className = "",
}: GmailAddonActivationProps) {
  const { isActivated, activatedAt, isLoading, error } = useGmailAddonStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["gmail-addon-status"] });
    // Add a small delay to show the refresh animation
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // For Gmail add-ons, there's no direct installation URL
  // Users need to install via Apps Script test deployment or marketplace
  const GMAIL_URL = "https://mail.google.com";

  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-md border border-concrete ${className}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-heliotrope mr-2" />
            <span className="text-sm text-thunder">
              Checking Gmail add-on status...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white rounded-lg shadow-md border border-concrete ${className}`}
      >
        <div className="p-6">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Status Check Failed</h3>
          </div>
          <p className="text-sm text-thunder mb-4">
            Unable to check Gmail add-on status. Please try refreshing or
            contact support if the issue persists.
          </p>
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="btn-secondary text-sm"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (isActivated) {
    return (
      <div
        className={`bg-gradient-to-r from-jade to-lime rounded-lg shadow-md border border-jade/20 ${className}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-white">
              <CheckCircle className="w-6 h-6 mr-3" />
              <div>
                <h3 className="font-semibold text-lg">
                  Gmail Add-on Activated! 🎉
                </h3>
                <p className="text-white/90 text-sm">
                  {activatedAt && (
                    <>
                      Activated{" "}
                      {formatDistanceToNow(new Date(activatedAt), {
                        addSuffix: true,
                      })}
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="text-white/80 hover:text-white transition-colors"
              title="Refresh status"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
            <p className="text-white/90 text-sm">
              🚀 Your emails are now being processed automatically! Open any
              receipt, travel booking, or job application email in Gmail to see
              smart actions in action.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-daisy rounded-lg shadow-md border border-daisy/20 ${className}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-white">
            <Mail className="w-6 h-6 mr-3" />
            <div>
              <h3 className="font-semibold text-lg">Activate Gmail Add-on</h3>
              <p className="text-white/90 text-sm">
                Enable automatic email processing in just one click
              </p>
            </div>
          </div>
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="text-white/80 hover:text-white transition-colors"
            title="Refresh status"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-white/90">
            <div className="flex-shrink-0 w-6 h-6 bg-heliotrope rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <strong>Find the Actioneer icon</strong> - Look for the
                Actioneer icon in your Gmail right sidebar
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-white/90">
            <div className="flex-shrink-0 w-6 h-6 bg-heliotrope rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <strong>Open any email in Gmail</strong> - Look for the
                Actioneer icon in your Gmail sidebar
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-white/90">
            <div className="flex-shrink-0 w-6 h-6 bg-heliotrope rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              3
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <strong>Click the add-on once</strong> - This activates
                automatic processing for your account
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href={GMAIL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary bg-white text-heliotrope hover:bg-white/90 flex items-center justify-center rounded-md"
          >
            Open Gmail
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>

          <Button
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            variant="outline"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                I've Installed It
              </>
            )}
          </Button>
        </div>

        <div className="mt-8 p-4 bg-bittersweet rounded-lg">
          <p className="text-white text-sm">
            Pro tip: The add-on only needs to be opened once to activate
            automatic processing. After that, all your emails will be processed
            automatically without any manual action required!
          </p>
        </div>
      </div>
    </div>
  );
}
