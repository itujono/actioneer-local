import { Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EditableCustomFieldCell } from "./custom-fields/CustomFieldInput";
import {
  getFlagEmoji,
  getStatusIcon,
  getStatusBadgeColor,
  GmailButton,
} from "./constants";
import type { JobTableRowProps } from "./types";

export function JobTableRow({
  application,
  columnOrder,
  customFields,
  getCustomFieldValue,
  updateJobApplicationMutation,
}: JobTableRowProps) {
  return (
    <tr key={application.id} className="hover:bg-concrete">
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
                      <span className="ml-2 text-base">
                        {getFlagEmoji(application.country_code)}
                      </span>
                    )}
                  </div>
                </div>
              </td>
            );

          case "position":
            return (
              <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-thunder">
                  {application.position}
                </div>
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
                      : application.status.charAt(0).toUpperCase() +
                        application.status.slice(1)}
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
              <td
                key={cellKey}
                className="px-6 py-4 whitespace-nowrap text-sm text-thunder"
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray mr-2" />
                  {new Date(application.applied_date).toLocaleDateString()}
                </div>
              </td>
            );

          case "created_at":
            return (
              <td
                key={cellKey}
                className="px-6 py-4 whitespace-nowrap text-sm text-thunder"
              >
                {formatDistanceToNow(new Date(application.created_at))}
              </td>
            );

          case "actions":
            return (
              <td
                key={cellKey}
                className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <GmailButton
                  emailId={application.email_id}
                  application={application}
                />
              </td>
            );

          default:
            // Handle custom fields
            if (column.id.startsWith("custom-")) {
              const fieldId = column.id.replace("custom-", "");
              const field = customFields.find((f) => f.id === fieldId);

              if (field) {
                return (
                  <td
                    key={cellKey}
                    className="px-6 py-4 whitespace-nowrap text-sm text-thunder"
                  >
                    <EditableCustomFieldCell
                      field={field}
                      value={getCustomFieldValue(
                        application.details,
                        field.field_name
                      )}
                      onSave={async (newValue) => {
                        await updateJobApplicationMutation.mutateAsync({
                          jobId: application.id,
                          fieldName: field.field_name,
                          newValue,
                        });
                      }}
                      disabled={updateJobApplicationMutation.isPending}
                    />
                  </td>
                );
              }
            }

            // Fallback for unknown columns
            return (
              <td
                key={cellKey}
                className="px-6 py-4 whitespace-nowrap text-sm text-thunder"
              >
                —
              </td>
            );
        }
      })}
    </tr>
  );
}
