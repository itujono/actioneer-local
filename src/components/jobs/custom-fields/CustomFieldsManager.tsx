import { useState } from "react";
import { Plus } from "lucide-react";
import { CustomFieldDefinition } from "../../../supabase/types";
import { useCustomFields } from "../../../hooks/useCustomFields";
import { Button } from "../../ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { CustomFieldForm } from "./CustomFieldForm";
import { CustomFieldItem } from "./CustomFieldItem";

interface CustomFieldsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: "job_applications" | "receipts" | "travel";
  userId: string;
}

interface CustomFieldFormData {
  field_name: string;
  field_label: string;
  field_type: any;
  field_options: any;
  is_required: boolean;
}

export function CustomFieldsManager({
  isOpen,
  onClose,
  tableName,
  userId,
}: CustomFieldsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] =
    useState<CustomFieldDefinition | null>(null);

  const {
    customFields,
    isLoadingFields,
    createField,
    updateField,
    deleteFieldWithConfirmation,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCustomFields({ tableName, userId });

  const handleAddField = (formData: CustomFieldFormData) => {
    const fieldData = {
      user_id: userId,
      table_name: tableName,
      field_name: formData.field_name,
      field_label: formData.field_label,
      field_type: formData.field_type,
      field_options: formData.field_options,
      is_required: formData.is_required,
      display_order: customFields.length,
      is_active: true,
    };

    createField(fieldData);
    setShowAddForm(false);
  };

  const handleUpdateField = (formData: CustomFieldFormData) => {
    if (!editingField) return;

    const updates = {
      field_label: formData.field_label,
      field_type: formData.field_type,
      field_options: formData.field_options,
      is_required: formData.is_required,
    };

    updateField({ id: editingField.id, updates });
    setEditingField(null);
  };

  const handleStartEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  const handleDeleteField = async (
    fieldId: string,
    fieldName: string,
    fieldLabel: string
  ) => {
    await deleteFieldWithConfirmation(fieldId, fieldName, fieldLabel);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Manage Custom Fields for{" "}
            {tableName
              .replace("_", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </DialogTitle>
          <DialogDescription className="max-w-xl">
            Custom fields are used to track additional information Actioneer
            doesn't automatically track, such as salary range, interview date,
            etc.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Existing Fields */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium text-thunder">
              Current Custom Fields
            </h3>

            {isLoadingFields ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-jade"></div>
                <p className="mt-2 text-sm text-thunder">Loading fields...</p>
              </div>
            ) : customFields.length === 0 ? (
              <div className="text-center py-8 bg-concrete rounded-lg">
                <p className="text-thunder">
                  No custom fields yet. Add your first one below!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {customFields.map((field) => (
                  <div key={field.id}>
                    {editingField?.id === field.id ? (
                      <CustomFieldForm
                        mode="edit"
                        field={editingField}
                        onSave={handleUpdateField}
                        onCancel={handleCancelEdit}
                        isLoading={isUpdating}
                        tableName={tableName}
                      />
                    ) : (
                      <CustomFieldItem
                        field={field}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteField}
                        isUpdating={isUpdating}
                        isDeleting={isDeleting}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Field Form */}
          {!editingField && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-thunder">
                  Add New Field
                </h3>
                {!showAddForm && (
                  <Button
                    onClick={() => setShowAddForm(true)}
                    variant="primary"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                )}
              </div>

              {showAddForm && (
                <CustomFieldForm
                  mode="add"
                  onSave={handleAddField}
                  onCancel={handleCancelAdd}
                  isLoading={isCreating}
                  tableName={tableName}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
