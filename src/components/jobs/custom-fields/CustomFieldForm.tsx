import { useState, useEffect } from "react";
import { Save, XCircle } from "lucide-react";
import {
  CustomFieldType,
  CustomFieldDefinition,
} from "../../../supabase/types";
import { Select, Input, Button, Checkbox } from "../../ui";

interface CustomFieldFormData {
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

interface CustomFieldFormProps {
  mode: "add" | "edit";
  field?: CustomFieldDefinition; // For edit mode
  onSave: (data: CustomFieldFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  tableName: "job_applications" | "receipts" | "travel";
}

const defaultFormData: CustomFieldFormData = {
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

export function CustomFieldForm({
  mode,
  field,
  onSave,
  onCancel,
  isLoading = false,
  tableName,
}: CustomFieldFormProps) {
  const [formData, setFormData] =
    useState<CustomFieldFormData>(defaultFormData);

  // Initialize form data based on mode
  useEffect(() => {
    if (mode === "edit" && field) {
      setFormData({
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        field_options: field.field_options || {},
        is_required: field.is_required,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [mode, field]);

  const handleSave = () => {
    if (!formData.field_label.trim()) return;

    // For add mode, generate field_name from label if not provided
    if (mode === "add" && !formData.field_name.trim()) {
      const generatedFieldName = formData.field_label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_");

      onSave({
        ...formData,
        field_name: generatedFieldName,
      });
    } else {
      onSave(formData);
    }
  };

  const handleSelectOptionsChange = (options: string) => {
    const optionsArray = options
      .split("\n")
      .filter((opt) => opt.trim())
      .map((opt) => opt.trim());

    setFormData((prev) => ({
      ...prev,
      field_options: { ...prev.field_options, options: optionsArray },
    }));
  };

  const isEditMode = mode === "edit";
  const formTitle = isEditMode
    ? `Edit Field: ${field?.field_label}`
    : "Add New Field";
  const saveButtonText = isEditMode
    ? isLoading
      ? "Saving..."
      : "Save"
    : isLoading
    ? "Adding..."
    : "Add Field";

  return (
    <div
      className={`space-y-4 p-4 rounded-lg ${
        isEditMode ? "bg-jade/10 border-2 border-jade" : "bg-concrete"
      }`}
    >
      {isEditMode && (
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-thunder">{formTitle}</h4>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSave}
              disabled={isLoading || !formData.field_label.trim()}
              variant="primary"
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            autoFocus
            label="Field Label"
            type="text"
            value={formData.field_label}
            onChange={(e) =>
              setFormData((prev) => ({
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
            value={formData.field_type}
            onChange={(e) =>
              setFormData((prev) => ({
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
      {formData.field_type === "select" && (
        <div>
          <label className="block text-sm font-medium text-thunder mb-1">
            Options (one per line)
          </label>
          <textarea
            value={formData.field_options.options?.join("\n") || ""}
            onChange={(e) => handleSelectOptionsChange(e.target.value)}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            rows={3}
            className="w-full px-3 py-2 border border-concrete rounded-md focus:ring-jade focus:border-jade"
          />
        </div>
      )}

      {formData.field_type === "currency" && (
        <div>
          <Input
            label="Currency Code"
            type="text"
            value={formData.field_options.currency || "USD"}
            onChange={(e) =>
              setFormData((prev) => ({
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

      {(formData.field_type === "number" ||
        formData.field_type === "currency") && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Minimum Value"
              type="number"
              value={formData.field_options.min || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  field_options: {
                    ...prev.field_options,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  },
                }))
              }
            />
          </div>
          <div>
            <Input
              label="Maximum Value"
              type="number"
              value={formData.field_options.max || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  field_options: {
                    ...prev.field_options,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  },
                }))
              }
            />
          </div>
        </div>
      )}

      <Checkbox
        id={`${mode}_is_required_${field?.id || "new"}`}
        label="Required field"
        checked={formData.is_required}
        onChange={(checked) =>
          setFormData((prev) => ({
            ...prev,
            is_required: checked,
          }))
        }
        variant="primary"
      />

      {/* Action buttons for add mode */}
      {!isEditMode && (
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel} variant="outline" size="sm">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.field_label.trim()}
            variant="primary"
            size="sm"
          >
            {saveButtonText}
          </Button>
        </div>
      )}
    </div>
  );
}
