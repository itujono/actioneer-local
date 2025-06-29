import { LucideIcon } from "lucide-react";

interface NavButtonProps {
  id: string;
  title: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: (id: string) => void;
}

export function NavButton({
  id,
  title,
  icon: Icon,
  isActive,
  onClick,
}: NavButtonProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
        isActive
          ? "bg-heliotrope/10 text-heliotrope font-medium"
          : "text-gray hover:bg-concrete"
      }`}
    >
      <Icon className="h-4 w-4" />
      {title}
    </button>
  );
}
