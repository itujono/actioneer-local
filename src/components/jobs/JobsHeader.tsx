import React from "react";
import { Plus, Columns, GripVertical } from "lucide-react";
import { PageTitle } from "../ui";

interface JobsHeaderProps {
  onShowCustomFieldsManager: () => void;
  onResetColumnOrder: () => void;
}

export function JobsHeader({
  onShowCustomFieldsManager,
  onResetColumnOrder,
}: JobsHeaderProps) {
  return (
    <PageTitle
      title="Job Applications"
      description="Track and manage your job applications"
    >
      <button
        onClick={onShowCustomFieldsManager}
        type="button"
        className="inline-flex items-center px-4 py-2 border border-concrete rounded-md shadow-sm text-sm font-medium text-thunder bg-white hover:bg-concrete focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bittersweet"
        title="Manage custom columns"
      >
        <Columns className="h-4 w-4 mr-2" />
        Manage Custom Fields
      </button>
      <button
        onClick={onResetColumnOrder}
        type="button"
        className="inline-flex items-center px-3 py-2 border border-concrete rounded-md shadow-sm text-sm font-medium text-thunder bg-white hover:bg-concrete focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bittersweet"
        title="Reset column order to default"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border border-concrete rounded-md shadow-sm text-sm font-medium text-thunder bg-white hover:bg-concrete focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bittersweet"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Application
      </button>
    </PageTitle>
  );
}
