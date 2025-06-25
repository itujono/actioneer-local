import React from "react";
import { CustomFieldDefinition } from "../../../supabase/types";
import { Input, Select, Checkbox } from "../../ui";

interface CustomFieldInputProps {
  field: CustomFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function CustomFieldInput({
  field,
  value,
  onChange,
  error,
  disabled,
}: CustomFieldInputProps) {
  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const renderInput = () => {
    switch (field.field_type) {
      case "text":
        return (
          <Input
            label={field.field_label}
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_options.placeholder}
            disabled={disabled}
            required={field.is_required}
            error={error}
          />
        );

      case "number":
        return (
          <Input
            label={field.field_label}
            type="number"
            value={value || ""}
            onChange={(e) =>
              handleChange(e.target.value ? Number(e.target.value) : null)
            }
            min={field.field_options.min}
            max={field.field_options.max}
            disabled={disabled}
            required={field.is_required}
            error={error}
          />
        );

      case "currency":
        return (
          <Input
            label={field.field_label}
            type="number"
            value={value || ""}
            onChange={(e) =>
              handleChange(e.target.value ? Number(e.target.value) : null)
            }
            min={field.field_options.min || 0}
            max={field.field_options.max}
            step="0.01"
            disabled={disabled}
            leftAddon={field.field_options.currency || "USD"}
            placeholder="0.00"
            required={field.is_required}
            error={error}
          />
        );

      case "date":
        return (
          <Input
            label={field.field_label}
            type="date"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            required={field.is_required}
            error={error}
          />
        );

      case "select":
        return (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-thunder">
              {field.field_label}
              {field.is_required && (
                <span className="text-bittersweet ml-1">*</span>
              )}
            </label>
            <Select
              value={value || ""}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              placeholder="Select an option..."
              error={!!error}
              options={
                field.field_options.options?.map((option) => ({
                  value: option,
                  label: option,
                })) || []
              }
            />
            {error && <p className="text-sm text-bittersweet">{error}</p>}
          </div>
        );

      case "boolean":
        return (
          <div className="space-y-1">
            <Checkbox
              label={`${field.field_label} (${value === true ? "Yes" : "No"})`}
              checked={value === true}
              onChange={(checked) => handleChange(checked)}
              disabled={disabled}
              required={field.is_required}
              error={error}
            />
          </div>
        );

      default:
        return (
          <Input
            label={field.field_label}
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            required={field.is_required}
            error={error}
          />
        );
    }
  };

  return <div className="space-y-1">{renderInput()}</div>;
}

// Table cell renderer for custom fields
interface CustomFieldCellProps {
  field: CustomFieldDefinition;
  value: any;
}

export function CustomFieldCell({ field, value }: CustomFieldCellProps) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-concrete">—</span>;
  }

  const formatValue = () => {
    switch (field.field_type) {
      case "currency":
        const currency = field.field_options.currency || "USD";
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency.toUpperCase(),
        }).format(Number(value) || 0);

      case "number":
        return Number(value).toLocaleString();

      case "date":
        return new Date(value).toLocaleDateString();

      case "boolean":
        return value ? "Yes" : "No";

      case "select":
      case "text":
      default:
        return String(value);
    }
  };

  return <span className="text-sm text-thunder">{formatValue()}</span>;
}

// Enhanced editable table cell for custom fields
interface EditableCustomFieldCellProps {
  field: CustomFieldDefinition;
  value: any;
  onSave: (newValue: any) => Promise<void>;
  disabled?: boolean;
}

export function EditableCustomFieldCell({
  field,
  value,
  onSave,
  disabled = false,
}: EditableCustomFieldCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number | null>(
    null
  );
  const inputRef = React.useRef<HTMLInputElement | HTMLSelectElement>(null);
  const displayContainerRef = React.useRef<HTMLDivElement>(null);

  // Reset edit value when value prop changes
  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.type === "text") {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (disabled) return;

    // Capture the current width before switching to edit mode
    if (displayContainerRef.current) {
      const width = displayContainerRef.current.getBoundingClientRect().width;
      setContainerWidth(width);
    }

    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
    setContainerWidth(null);
  };

  const handleSave = async () => {
    setError(null);

    // If value hasn't changed, just cancel instead of saving
    if (editValue === value) {
      handleCancel();
      return;
    }

    try {
      await onSave(editValue);
      setIsEditing(false);
      setContainerWidth(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const formatDisplayValue = () => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-heliotrope font-medium">Set</span>;
    }

    switch (field.field_type) {
      case "currency":
        const currency = field.field_options.currency || "USD";
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency.toUpperCase(),
        }).format(Number(value) || 0);

      case "number":
        return Number(value).toLocaleString();

      case "date":
        return new Date(value).toLocaleDateString();

      case "boolean":
        return value ? "Yes" : "No";

      case "select":
      case "text":
      default:
        return String(value);
    }
  };

  // Shared classes for consistent dimensions between display and edit modes
  const containerBaseClasses = "group flex items-center space-x-2 relative";
  const cellBaseClasses =
    "w-full h-[34px] px-3 py-1.5 text-sm bg-white border-2 border-transparent rounded-md flex items-center";
  const inputClasses =
    "w-full h-[34px] px-3 py-1.5 text-sm bg-white border-2 border-concrete rounded-md focus:outline-none focus:ring-0 focus:border-heliotrope transition-colors";

  const renderEditInput = () => {
    switch (field.field_type) {
      case "text":
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder={field.field_options.placeholder}
            className={inputClasses}
          />
        );

      case "number":
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={editValue || ""}
            onChange={(e) =>
              setEditValue(e.target.value ? Number(e.target.value) : null)
            }
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            min={field.field_options.min}
            max={field.field_options.max}
            className={inputClasses}
          />
        );

      case "currency":
        return (
          <div className="relative w-full min-w-0 max-w-40">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-thunder text-sm font-medium">
                {field.field_options.currency || "$"}
              </span>
            </div>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="number"
              value={editValue || ""}
              onChange={(e) =>
                setEditValue(e.target.value ? Number(e.target.value) : null)
              }
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              min={field.field_options.min || 0}
              max={field.field_options.max}
              step="0.01"
              placeholder="0.00"
              className={`${inputClasses} pl-12`}
            />
          </div>
        );

      case "date":
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={inputClasses}
          />
        );

      case "select":
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={inputClasses}
          >
            <option value="">Select...</option>
            {field.field_options.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "boolean":
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={
              editValue === true ? "true" : editValue === false ? "false" : ""
            }
            onChange={(e) =>
              setEditValue(
                e.target.value === "true"
                  ? true
                  : e.target.value === "false"
                  ? false
                  : null
              )
            }
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={inputClasses}
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      default:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={inputClasses}
          />
        );
    }
  };

  return (
    <div
      className={`${containerBaseClasses} ${
        disabled ? "" : "cursor-pointer hover:bg-concrete rounded px-1"
      }`}
      onClick={handleEdit}
      ref={displayContainerRef}
      style={
        isEditing && containerWidth
          ? { width: `${containerWidth}px` }
          : undefined
      }
    >
      {isEditing ? (
        // Edit mode - maintain exact same width as display mode
        <>
          <div className="flex-1">{renderEditInput()}</div>
          {/* Invisible spacer to maintain consistent layout - matches icon width */}
          <div className="h-3 w-3 flex-shrink-0 opacity-0">
            <svg className="h-3 w-3" viewBox="0 0 24 24">
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </>
      ) : (
        // Display mode - natural width that gets measured
        <>
          <div
            className={`${cellBaseClasses} ${
              disabled ? "" : "hover:border-concrete"
            } min-w-0 max-w-40 flex-1`}
          >
            <span className="text-sm text-thunder truncate">
              {formatDisplayValue()}
            </span>
          </div>
          {!disabled && (
            <svg
              className="h-3 w-3 text-concrete opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          )}
          {/* Render invisible icon for disabled state to maintain consistent spacing */}
          {disabled && (
            <div className="h-3 w-3 flex-shrink-0 opacity-0">
              <svg className="h-3 w-3" viewBox="0 0 24 24">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </>
      )}

      {/* Error display - positioned outside to avoid layout shifts */}
      {error && isEditing && (
        <div className="absolute top-full left-0 mt-1 z-20">
          <p className="text-xs text-red-600 bg-white px-1 py-0.5 rounded shadow-sm border">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
