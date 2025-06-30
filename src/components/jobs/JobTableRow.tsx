import { Calendar, Trash2, ChevronDown, ChevronRight, Users, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EditableCustomFieldCell } from "./custom-fields/CustomFieldInput";
import { getFlagEmoji, getStatusIcon, getStatusBadgeColor } from "./constants";
import { EmailContentDialog } from "./EmailContentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui";
import type { JobTableRowProps, JobApplicationGroup } from "./types";
import React from "react";

// EmailContentDialog moved to separate file: ./EmailContentDialog.tsx

// New props for grouped row
export interface GroupedJobTableRowProps {
  group: JobApplicationGroup;
  columnOrder: any[];
  customFields: any[];
  getCustomFieldValue: (details: any, fieldName: string) => any;
  updateJobApplicationMutation: any;
  onDeleteApplication?: (applicationId: string) => void;
}

// New component for grouped rows
export function GroupedJobTableRow({
  group,
  columnOrder,
  customFields,
  getCustomFieldValue,
  updateJobApplicationMutation,
  onDeleteApplication,
}: GroupedJobTableRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const latestApplication = group.applications[0];

  // Helper function to update custom field for all applications in the group
  const updateGroupCustomField = async (fieldName: string, newValue: any) => {
    // Update all applications in the group
    const updatePromises = group.applications.map((application) =>
      updateJobApplicationMutation.mutateAsync({
        jobId: application.id,
        fieldName,
        newValue,
      })
    );

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error updating group custom field:", error);
      throw error;
    }
  };

  // Main grouped row
  const renderGroupRow = () => (
    <tr
      className={`hover:bg-concrete/20 ${group.isGrouped ? "cursor-pointer" : ""}`}
      onClick={group.isGrouped ? () => setIsExpanded(!isExpanded) : undefined}
    >
      {/* Tree connector column */}
      <td className="w-8 border-b border-concrete/20 relative">
        {group.isGrouped && isExpanded && (
          <div className="flex items-center justify-center h-full relative">
            {/* Vertical line going down to sub-rows */}
            <div
              className="absolute left-1/2 bottom-0 w-0.5 h-1/2 bg-thunder"
              style={{ transform: "translateX(-50%)" }}
            ></div>
            {/* Root indicator */}
            <div
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-thunder rounded-full"
              style={{ transform: "translate(-50%, -50%)" }}
            ></div>
          </div>
        )}
      </td>
      {columnOrder.map((column) => {
        const cellKey = `${group.groupKey}-${column.id}`;

        switch (column.id) {
          case "company":
            return (
              <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {group.isGrouped && (
                    <div className="mr-1 p-1 relative right-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-thunder/70" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-thunder/70" />
                      )}
                    </div>
                  )}
                  <div className="text-sm font-medium text-thunder flex items-center">
                    {latestApplication.company}
                    {getFlagEmoji(latestApplication.country_code) && (
                      <span className="ml-2 text-base">{getFlagEmoji(latestApplication.country_code)}</span>
                    )}
                    {group.isGrouped && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-heliotrope/10 text-heliotrope rounded-full">
                        <Users className="h-3 w-3 mr-1" />
                        {group.applications.length}
                      </span>
                    )}
                  </div>
                </div>
              </td>
            );

          case "position":
            return (
              <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-thunder">{latestApplication.position}</div>
              </td>
            );

          case "status":
            return (
              <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getStatusIcon(latestApplication.status)}
                  <span
                    className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                      latestApplication.status
                    )}`}
                  >
                    {latestApplication.status === "next_step"
                      ? "Next Step"
                      : latestApplication.status.charAt(0).toUpperCase() + latestApplication.status.slice(1)}
                  </span>
                  {group.isGrouped && <span className="ml-2 text-xs text-thunder/60">Latest</span>}
                </div>
              </td>
            );

          case "website":
            return (
              <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-thunder">
                  {latestApplication.website && latestApplication.website !== "-" ? (
                    <a
                      href={"https://" + latestApplication.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-heliotrope underline"
                      title={`Visit ${latestApplication.company} website`}
                    >
                      {latestApplication.website}
                    </a>
                  ) : (
                    <span className="text-concrete">—</span>
                  )}
                </div>
              </td>
            );

          case "applied_date":
            return (
              <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-thunder">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray mr-2" />
                  {new Date(latestApplication.applied_date).toLocaleDateString()}
                  {/* {group.isGrouped && (
                    <span className="ml-2 text-xs text-thunder/60">
                      (Latest)
                    </span>
                  )} */}
                </div>
              </td>
            );

          case "created_at":
            return (
              <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-thunder">
                {formatDistanceToNow(new Date(latestApplication.created_at))}
              </td>
            );

          case "actions":
            return (
              <td
                key={cellKey}
                className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-end space-x-2">
                  {group.isGrouped && (
                    <span className="text-xs text-thunder/60 mr-2">{group.applications.length} entries</span>
                  )}

                  {/* See Email Content button */}
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEmailDialogOpen(true)}
                        className="text-heliotrope hover:text-heliotrope/80"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      <p>View original email content</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Show delete only for single applications */}
                  {!group.isGrouped && onDeleteApplication && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-bittersweet hover:text-bittersweet/80"
                          title="Delete job application"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Job Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the job application for{" "}
                            <strong>{latestApplication.position}</strong> at{" "}
                            <strong>{latestApplication.company}</strong>?
                            <br />
                            <br />
                            This action cannot be undone and will permanently remove the application from your records.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteApplication(latestApplication.id)}
                            className="bg-bittersweet hover:bg-bittersweet/80"
                          >
                            Delete Application
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </td>
            );

          default:
            // Handle custom fields using latest application
            if (column.id.startsWith("custom-")) {
              const fieldId = column.id.replace("custom-", "");
              const field = customFields.find((f) => f.id === fieldId);

              if (field) {
                return (
                  <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-thunder">
                    <EditableCustomFieldCell
                      field={field}
                      value={getCustomFieldValue(latestApplication.details, field.field_name)}
                      onSave={async (newValue) => {
                        await updateGroupCustomField(field.field_name, newValue);
                      }}
                      disabled={updateJobApplicationMutation.isPending}
                      isGrouped={group.isGrouped}
                      groupCount={group.applications.length}
                    />
                  </td>
                );
              }
            }

            return (
              <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-thunder">
                —
              </td>
            );
        }
      })}
    </tr>
  );

  // Expanded sub-rows showing all applications in the group
  const renderExpandedRows = () => {
    if (!isExpanded || !group.isGrouped) return null;

    return group.applications.map((application, index) => (
      <tr key={application.id} className="bg-concrete/30">
        {/* Tree connector column */}
        <td className="w-8 border-b border-concrete/20 relative">
          <div className="flex items-center justify-center h-full relative">
            {/* Vertical line from main row */}
            <div
              className="absolute left-1/2 w-0.5 bg-thunder"
              style={{
                top: index === 0 ? "0px" : "-100%",
                height: index === group.applications.length - 1 ? "50%" : "200%",
                transform: "translateX(-50%)",
              }}
            ></div>
            {/* Horizontal branch pointing to this row */}
            <div
              className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-thunder"
              style={{ transform: "translateY(-50%)" }}
            ></div>
            {/* Small circle at the end of branch */}
            <div
              className="absolute top-1/2 right-0 w-1.5 h-1.5 bg-thunder rounded-full"
              style={{ transform: "translateY(-50%)" }}
            ></div>
          </div>
        </td>
        {columnOrder.map((column) => {
          const cellKey = `${application.id}-${column.id}`;

          switch (column.id) {
            case "company":
              return (
                <td key={cellKey} className="px-6 py-2 whitespace-nowrap">
                  <div className="flex items-center pl-8">
                    <div className="text-xs text-thunder/70">#{index + 1}</div>
                  </div>
                </td>
              );

            case "position":
              return (
                <td key={cellKey} className="px-6 py-2 whitespace-nowrap">
                  <div className="text-xs text-thunder/70">{application.position}</div>
                </td>
              );

            case "status":
              return (
                <td key={cellKey} className="px-6 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(application.status)}
                    <span
                      className={`ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(
                        application.status
                      )}`}
                    >
                      {application.status === "next_step"
                        ? "Next Step"
                        : application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                </td>
              );

            case "applied_date":
              return (
                <td key={cellKey} className="px-6 py-2 whitespace-nowrap text-xs text-thunder/70">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 text-gray mr-1" />
                    {new Date(application.applied_date).toLocaleDateString()}
                  </div>
                </td>
              );

            case "created_at":
              return (
                <td key={cellKey} className="px-6 py-2 whitespace-nowrap text-xs text-thunder/70">
                  {formatDistanceToNow(new Date(application.created_at))}
                </td>
              );

            case "actions":
              return (
                <td
                  key={cellKey}
                  className="px-6 py-2 whitespace-nowrap text-right text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onDeleteApplication && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-thunder hover:text-bittersweet/80 h-6 w-6 p-0"
                          title="Delete this specific application"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Job Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this specific job application for{" "}
                            <strong>{application.position}</strong> at <strong>{application.company}</strong>?
                            <br />
                            <br />
                            This action cannot be undone and will permanently remove this application from your records.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteApplication(application.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Application
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </td>
              );

            default:
              // Handle custom fields for individual applications
              if (column.id.startsWith("custom-")) {
                const fieldId = column.id.replace("custom-", "");
                const field = customFields.find((f) => f.id === fieldId);

                if (field) {
                  return (
                    <td key={cellKey} className="px-6 py-2 whitespace-nowrap text-xs text-thunder">
                      <EditableCustomFieldCell
                        field={field}
                        value={getCustomFieldValue(application.details, field.field_name)}
                        onSave={async (newValue) => {
                          await updateGroupCustomField(field.field_name, newValue);
                        }}
                        disabled={updateJobApplicationMutation.isPending}
                        isGrouped={group.isGrouped}
                        groupCount={group.applications.length}
                      />
                    </td>
                  );
                }
              }

              return (
                <td key={cellKey} className="px-6 py-2 whitespace-nowrap text-xs text-thunder/70">
                  —
                </td>
              );
          }
        })}
      </tr>
    ));
  };

  return (
    <TooltipProvider>
      {renderGroupRow()}
      {renderExpandedRows()}

      {/* Email Content Dialog */}
      <EmailContentDialog
        emailId={latestApplication.email_id}
        isOpen={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        company={latestApplication.company}
        position={latestApplication.position}
      />
    </TooltipProvider>
  );
}

// Original component for individual rows (non-grouped)
export function JobTableRow({
  application,
  columnOrder,
  customFields,
  getCustomFieldValue,
  updateJobApplicationMutation,
  onDeleteApplication,
}: JobTableRowProps) {
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <tr className="hover:bg-concrete/20">
        {/* Empty tree connector column for alignment */}
        <td className="w-8 border-b border-concrete/20"></td>
        {columnOrder.map((column) => {
          const cellKey = `${application.id}-${column.id}`;

          // Render different cell types based on column
          switch (column.id) {
            case "company":
              return (
                <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                  <div className="flex">
                    <div className="text-sm font-medium text-thunder flex items-center">
                      {application.company}
                      {getFlagEmoji(application.country_code) && (
                        <span className="ml-2 text-base">{getFlagEmoji(application.country_code)}</span>
                      )}
                    </div>
                  </div>
                </td>
              );

            case "position":
              return (
                <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-thunder">{application.position}</div>
                </td>
              );

            case "status":
              return (
                <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(application.status)}
                    <span
                      className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        application.status
                      )}`}
                    >
                      {application.status === "next_step"
                        ? "Next Step"
                        : application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                </td>
              );

            case "website":
              return (
                <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-thunder">
                    {application.website && application.website !== "-" ? (
                      <a
                        href={"https://" + application.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-heliotrope underline"
                        title={`Visit ${application.company} website`}
                      >
                        {application.website}
                      </a>
                    ) : (
                      <span className="text-concrete">—</span>
                    )}
                  </div>
                </td>
              );

            case "applied_date":
              return (
                <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-thunder">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray mr-2" />
                    {new Date(application.applied_date).toLocaleDateString()}
                  </div>
                </td>
              );

            case "created_at":
              return (
                <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-thunder">
                  {formatDistanceToNow(new Date(application.created_at))}
                </td>
              );

            case "actions":
              return (
                <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {/* See Email Content button */}
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEmailDialogOpen(true)}
                          className="text-heliotrope hover:text-heliotrope/80"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center">
                        <p>View original email content</p>
                      </TooltipContent>
                    </Tooltip>

                    {onDeleteApplication && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-bittersweet hover:text-bittersweet/80"
                            title="Delete job application"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Job Application</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the job application for{" "}
                              <strong>{application.position}</strong> at <strong>{application.company}</strong>?
                              <br />
                              <br />
                              This action cannot be undone and will permanently remove the application from your
                              records.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteApplication(application.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Application
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </td>
              );

            default:
              // Handle custom fields
              if (column.id.startsWith("custom-")) {
                const fieldId = column.id.replace("custom-", "");
                const field = customFields.find((f) => f.id === fieldId);

                if (field) {
                  return (
                    <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-thunder">
                      <EditableCustomFieldCell
                        field={field}
                        value={getCustomFieldValue(application.details, field.field_name)}
                        onSave={async (newValue) => {
                          await updateJobApplicationMutation.mutateAsync({
                            jobId: application.id,
                            fieldName: field.field_name,
                            newValue,
                          });
                        }}
                        disabled={updateJobApplicationMutation.isPending}
                        isGrouped={false}
                        groupCount={0}
                      />
                    </td>
                  );
                }
              }

              // Fallback for unknown columns
              return (
                <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-thunder">
                  —
                </td>
              );
          }
        })}
      </tr>

      {/* Email Content Dialog */}
      <EmailContentDialog
        emailId={application.email_id}
        isOpen={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        company={application.company}
        position={application.position}
      />
    </TooltipProvider>
  );
}
