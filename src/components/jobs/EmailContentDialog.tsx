import { Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { createSafeHtmlProps, EMAIL_PROSE_CLASSES } from "../../utils/htmlFormatter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui";

interface EmailContentDialogProps {
  emailId: string;
  isOpen: boolean;
  onClose: () => void;
  company: string;
  position: string;
}

export function EmailContentDialog({ emailId, isOpen, onClose, company, position }: EmailContentDialogProps) {
  const {
    data: emailContent,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["email-content", emailId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emails")
        .select("subject, from_email, email_body, date")
        .eq("message_id", emailId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!emailId && isOpen,
  });

  const emailNotFound = !isLoading && !error && emailContent === null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-left">
            <Mail className="h-5 w-5 mr-2 text-heliotrope" />
            Email Content - {company} ({position})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {isLoading && (
            <div className="space-y-6">
              <div className="bg-concrete/30 rounded-lg p-4">
                <div className="grid grid-cols-6 gap-2">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 bg-concrete rounded animate-pulse"></div>
                    <div className="h-4 bg-concrete rounded animate-pulse"></div>
                    <div className="h-4 bg-concrete rounded animate-pulse"></div>
                  </div>
                  <div className="col-span-5 flex flex-col gap-2">
                    <div className="h-4 bg-concrete rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-concrete rounded animate-pulse w-1/2"></div>
                    <div className="h-4 bg-concrete rounded animate-pulse w-1/3"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-concrete rounded animate-pulse w-24"></div>
                <div className="bg-concrete/50 border-2 border-concrete rounded-lg p-4 min-h-[280px]">
                  <div className="space-y-3">
                    <div className="h-4 bg-concrete rounded animate-pulse"></div>
                    <div className="h-4 bg-concrete rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-concrete rounded animate-pulse w-4/5"></div>
                    <div className="h-4 bg-concrete rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-concrete rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-concrete rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Failed to load email content due to a database error. Please try again later.
              </p>
            </div>
          )}

          {emailNotFound && (
            <div className="bg-bittersweet border border-bittersweet rounded-lg p-4">
              <h4 className="font-bold text-gold mb-2">Email Content Not Available</h4>
              <p className="text-sm text-white">
                The original email for this job application is no longer available. This can happen when:
              </p>
              <ul className="text-sm text-white mt-2 ml-4 list-disc space-y-1">
                <li>The email was processed before our email storage policy was implemented</li>
                <li>The job application was created manually or imported from another source</li>
                <li>The email has been removed due to storage cleanup policies</li>
              </ul>
              <p className="text-sm text-white mt-3">
                All other job application details remain intact and fully functional.
              </p>
            </div>
          )}

          {emailContent && (
            <div className="space-y-4">
              {/* Email metadata */}
              <div className="bg-concrete/30 rounded-lg p-4">
                <div className="grid grid-cols-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-thunder">Subject:</span>
                    <span className="text-sm font-medium text-thunder">From:</span>
                    <span className="text-sm font-medium text-thunder">Date:</span>
                  </div>
                  <div className="col-span-5 flex flex-col gap-2">
                    <span className="text-sm text-thunder/80">{emailContent.subject}</span>
                    <span className="text-sm text-thunder/80">{emailContent.from_email}</span>
                    <span className="text-sm text-thunder/80">{new Date(emailContent.date).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Email body */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-thunder">Email Body:</h4>
                <div className="bg-concrete/50 border-2 border-concrete rounded-lg p-4">
                  <div
                    className={`text-sm text-thunder/90 leading-relaxed ${EMAIL_PROSE_CLASSES}`}
                    {...createSafeHtmlProps(emailContent.email_body)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
