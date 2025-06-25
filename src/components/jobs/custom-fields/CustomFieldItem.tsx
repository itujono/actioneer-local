import { Edit, Trash2 } from "lucide-react";
import { CustomFieldDefinition } from "../../../supabase/types";

interface CustomFieldItemProps {
  field: CustomFieldDefinition;
  onEdit: (field: CustomFieldDefinition) => void;
  onDelete: (
    fieldId: string,
    fieldName: string,
    fieldLabel: string
  ) => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function CustomFieldItem({
  field,
  onEdit,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: CustomFieldItemProps) {
  const handleDelete = async () => {
    try {
      await onDelete(field.id, field.field_name, field.field_label);
    } catch (error) {
      console.error("Error deleting field:", error);
      alert("Failed to delete field. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-concrete rounded-lg">
      <div className="flex items-center space-x-3">
        <div>
          <h4 className="font-medium text-thunder">{field.field_label}</h4>
          <p className="text-sm text-thunder">
            {field.field_type} • {field.field_name}
            {field.is_required && " • Required"}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onEdit(field)}
          className="p-2 text-thunder hover:text-heliotrope"
          disabled={isUpdating}
          title="Edit field"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-thunder hover:text-bittersweet disabled:opacity-50"
          title="Delete field"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
