import React from "react";
import { CustomFieldDefinition } from "../supabase/types";

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
  const baseInputClasses = `w-full px-3 py-2 border rounded-md focus:ring-heliotrope focus:border-heliotrope disabled:bg-gray-50 disabled:text-gray-500 ${
    error ? "border-red-300" : "border-gray-300"
  }`;

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const renderInput = () => {
    switch (field.field_type) {
      case "text":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.field_options.placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) =>
              handleChange(e.target.value ? Number(e.target.value) : null)
            }
            min={field.field_options.min}
            max={field.field_options.max}
            disabled={disabled}
            className={baseInputClasses}
          />
        );

      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500 text-sm">
              {field.field_options.currency || "USD"}
            </span>
            <input
              type="number"
              value={value || ""}
              onChange={(e) =>
                handleChange(e.target.value ? Number(e.target.value) : null)
              }
              min={field.field_options.min || 0}
              max={field.field_options.max}
              step="0.01"
              disabled={disabled}
              className={`${baseInputClasses} pl-12`}
              placeholder="0.00"
            />
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          />
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            <option value="">Select an option...</option>
            {field.field_options.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "boolean":
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-heliotrope focus:ring-heliotrope border-gray-300 rounded disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">
              {value === true ? "Yes" : "No"}
            </span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {field.field_label}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Table cell renderer for custom fields
interface CustomFieldCellProps {
  field: CustomFieldDefinition;
  value: any;
}

export function CustomFieldCell({ field, value }: CustomFieldCellProps) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">—</span>;
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

  return <span className="text-sm text-gray-900">{formatValue()}</span>;
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
  const inputRef = React.useRef<HTMLInputElement | HTMLSelectElement>(null);

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
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
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
      return <span className="text-gray-400">—</span>;
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

  const renderEditInput = () => {
    const baseInputClasses = `w-full px-2 py-1 text-sm border rounded focus:ring-heliotrope focus:border-heliotrope bg-white min-h-[28px] ${
      error ? "border-red-300" : "border-gray-300"
    }`;

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
            className={baseInputClasses}
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
            className={baseInputClasses}
          />
        );

      case "currency":
        return (
          <div className="relative w-full h-full">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs z-10">
              {field.field_options.currency || "USD"}
            </span>
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
              className={`${baseInputClasses} pl-10`}
              placeholder="0.00"
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
            className={baseInputClasses}
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
            className={baseInputClasses}
          >
            <option value="">Select an option...</option>
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
            className={baseInputClasses}
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
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div
      className={`group flex items-center space-x-2 min-h-[28px] relative ${
        disabled ? "" : "cursor-pointer hover:bg-gray-50 rounded px-1 py-1"
      }`}
      onClick={handleEdit}
    >
      {isEditing ? (
        // Edit mode - replace the content entirely
        <div className="flex-1 min-w-0">{renderEditInput()}</div>
      ) : (
        // Display mode
        <>
          <span className="text-sm text-gray-900 min-w-0 flex-1 py-1">
            {formatDisplayValue()}
          </span>
          {!disabled && (
            <svg
              className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
