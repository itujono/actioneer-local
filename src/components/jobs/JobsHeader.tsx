import React from "react";
import { Plus, Columns, GripVertical } from "lucide-react";
import { PageTitle } from "../ui";
import { Button } from "../ui/button";

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
      <Button
        onClick={onShowCustomFieldsManager}
        variant="outline"
        size="sm"
        title="Manage custom columns"
      >
        <Columns className="h-4 w-4 mr-2" />
        Manage Custom Fields
      </Button>
      <Button
        onClick={onResetColumnOrder}
        variant="outline"
        size="sm"
        title="Reset column order to default"
      >
        <GripVertical className="h-4 w-4" />
      </Button>
      <Button variant="primary" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Application
      </Button>
    </PageTitle>
  );
}
