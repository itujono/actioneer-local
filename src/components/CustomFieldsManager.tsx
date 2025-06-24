import { useState } from "react";
import { X, Plus, Trash2, Edit, GripVertical } from "lucide-react";
import { CustomFieldType } from "../supabase/types";
import { useCustomFields } from "../hooks/useCustomFields";
import { Select, Input, Button, Checkbox } from "./ui";

interface CustomFieldsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: "job_applications" | "receipts" | "travel";
  userId: string;
}

interface NewFieldForm {
  field_name: string;
  field_label: string;
  field_type: CustomFieldType;
  field_options: {
    options?: string[];
    currency?: string;
    min?: number;
    max?: number;
    placeholder?: string;
  };
  is_required: boolean;
}

const defaultNewField: NewFieldForm = {
  field_name: "",
  field_label: "",
  field_type: "text",
  field_options: {},
  is_required: false,
};

type FieldTypeOption = {
  value: CustomFieldType;
  label: string;
  description: string;
};

const fieldTypeOptions: FieldTypeOption[] = [
  { value: "text", label: "Text", description: "Single line text input" },
  { value: "number", label: "Number", description: "Numeric value" },
  { value: "currency", label: "Currency", description: "Monetary amount" },
  { value: "date", label: "Date", description: "Date picker" },
  {
    value: "select",
    label: "Select",
    description: "Dropdown with predefined options",
  },
  {
    value: "boolean",
    label: "Yes/No",
    description: "Checkbox for true/false values",
  },
];

export function CustomFieldsManager({
  isOpen,
  onClose,
  tableName,
  userId,
}: CustomFieldsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newField, setNewField] = useState<NewFieldForm>(defaultNewField);
  const [editingField, setEditingField] = useState<string | null>(null);

  const {
    customFields,
    isLoadingFields,
    createField,
    updateField,
    deleteField,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCustomFields({ tableName, userId });

  const handleAddField = () => {
    if (!newField.field_label.trim() || !newField.field_name.trim()) return;

    // Generate field_name from label if not provided
    const fieldName =
      newField.field_name ||
      newField.field_label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_");

    const fieldData = {
      user_id: userId,
      table_name: tableName,
      field_name: fieldName,
      field_label: newField.field_label,
      field_type: newField.field_type,
      field_options: newField.field_options,
      is_required: newField.is_required,
      display_order: customFields.length,
      is_active: true,
    };

    createField(fieldData);
    setNewField(defaultNewField);
    setShowAddForm(false);
  };

  const handleSelectOptionsChange = (options: string) => {
    const optionsArray = options
      .split("\n")
      .filter((opt) => opt.trim())
      .map((opt) => opt.trim());
    setNewField((prev) => ({
      ...prev,
      field_options: { ...prev.field_options, options: optionsArray },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-concrete">
          <div>
            <h2 className="text-xl font-semibold text-thunder">
              Custom Fields -{" "}
              {tableName
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </h2>
            <p className="text-sm text-thunder mt-1">
              Add custom columns to track additional information that matters to
              you
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-concrete hover:text-thunder"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
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
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-4 bg-concrete rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-4 w-4 text-concrete" />
                      <div>
                        <h4 className="font-medium text-thunder">
                          {field.field_label}
                        </h4>
                        <p className="text-sm text-thunder">
                          {field.field_type} • {field.field_name}
                          {field.is_required && " • Required"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingField(field.id)}
                        className="p-2 text-concrete hover:text-thunder"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        disabled={isDeleting}
                        className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Field Form */}
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
              <div className="space-y-4 bg-concrete p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Field Label"
                      type="text"
                      value={newField.field_label}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          field_label: e.target.value,
                        }))
                      }
                      placeholder="e.g., Salary Range"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-thunder mb-1">
                      Field Type *
                    </label>
                    <Select
                      value={newField.field_type}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          field_type: e.target.value as CustomFieldType,
                        }))
                      }
                      options={fieldTypeOptions.map((option) => ({
                        value: option.value,
                        label: `${option.label} - ${option.description}`,
                      }))}
                    />
                  </div>
                </div>

                {/* Type-specific options */}
                {newField.field_type === "select" && (
                  <div>
                    <label className="block text-sm font-medium text-thunder mb-1">
                      Options (one per line)
                    </label>
                    <textarea
                      value={newField.field_options.options?.join("\n") || ""}
                      onChange={(e) =>
                        handleSelectOptionsChange(e.target.value)
                      }
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      rows={3}
                      className="w-full px-3 py-2 border border-concrete rounded-md focus:ring-jade focus:border-jade"
                    />
                  </div>
                )}

                {newField.field_type === "currency" && (
                  <div>
                    <Input
                      label="Currency Code"
                      type="text"
                      value={newField.field_options.currency || "USD"}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          field_options: {
                            ...prev.field_options,
                            currency: e.target.value,
                          },
                        }))
                      }
                      placeholder="USD"
                    />
                  </div>
                )}

                {(newField.field_type === "number" ||
                  newField.field_type === "currency") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Minimum Value"
                        type="number"
                        value={newField.field_options.min || ""}
                        onChange={(e) =>
                          setNewField((prev) => ({
                            ...prev,
                            field_options: {
                              ...prev.field_options,
                              min: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Input
                        label="Maximum Value"
                        type="number"
                        value={newField.field_options.max || ""}
                        onChange={(e) =>
                          setNewField((prev) => ({
                            ...prev,
                            field_options: {
                              ...prev.field_options,
                              max: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                <Checkbox
                  id="is_required"
                  label="Required field"
                  checked={newField.is_required}
                  onChange={(checked) =>
                    setNewField((prev) => ({
                      ...prev,
                      is_required: checked,
                    }))
                  }
                  variant="primary"
                />

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewField(defaultNewField);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddField}
                    disabled={isCreating || !newField.field_label.trim()}
                    className="px-4 py-2 text-sm font-medium text-white"
                  >
                    {isCreating ? "Adding..." : "Add Field"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-concrete px-6 py-4 bg-concrete">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-thunder bg-white border border-concrete rounded-md hover:bg-concrete"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
