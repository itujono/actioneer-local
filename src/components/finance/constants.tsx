import React from "react";
import {
  DollarSign,
  ShoppingBag,
  Coffee,
  Plane,
  Home,
  ShoppingCart,
  Utensils,
  TrendingUp,
  Receipt as ReceiptIcon,
  Laptop,
  Zap,
  Car,
  Paperclip,
  FileText,
  Image,
  PiggyBank,
  ArrowUpRight,
  CircleDollarSign,
  Banknote,
  Building,
  Users,
  Landmark,
} from "lucide-react";

// Enhanced category icons mapping for expenses
export const categoryIcons: Record<string, React.ReactElement> = {
  software: <Laptop className="h-5 w-5" />,
  office_supplies: <ShoppingBag className="h-5 w-5" />,
  utilities: <Zap className="h-5 w-5" />,
  travel: <Plane className="h-5 w-5" />,
  entertainment: <Utensils className="h-5 w-5" />,
  food: <Utensils className="h-5 w-5" />,
  coffee: <Coffee className="h-5 w-5" />,
  shopping: <ShoppingCart className="h-5 w-5" />,
  groceries: <ShoppingBag className="h-5 w-5" />,
  housing: <Home className="h-5 w-5" />,
  transport: <Car className="h-5 w-5" />,
  other: <ReceiptIcon className="h-5 w-5" />,
  default: <DollarSign className="h-5 w-5" />,
};

// Revenue category icons
export const revenueIcons: Record<string, React.ReactElement> = {
  payment_received: <CircleDollarSign className="h-5 w-5" />,
  refund: <ArrowUpRight className="h-5 w-5" />,
  business_income: <Building className="h-5 w-5" />,
  investment: <TrendingUp className="h-5 w-5" />,
  government: <Landmark className="h-5 w-5" />,
  digital_platform: <Banknote className="h-5 w-5" />,
  sales: <Users className="h-5 w-5" />,
  default: <PiggyBank className="h-5 w-5" />,
};

// Category colors for visual distinction
export const categoryColors: Record<string, string> = {
  // Expense colors using our vibrant palette
  software: "bg-heliotrope text-white",
  office_supplies: "bg-jade/10 text-jade",
  utilities: "bg-gold/10 text-gold",
  travel: "bg-lavender/10 text-lavender",
  entertainment: "bg-bittersweet/10 text-bittersweet",
  food: "bg-lime/10 text-lime",
  coffee: "bg-sandy/10 text-thunder",
  shopping: "bg-heliotrope/10 text-heliotrope",
  groceries: "bg-jade/10 text-jade",
  housing: "bg-concrete/20 text-thunder",
  transport: "bg-gold/10 text-gold",
  other: "bg-thunder text-white",
  default: "bg-concrete text-thunder",
};

// Revenue colors using our vibrant palette
export const revenueColors: Record<string, string> = {
  payment_received: "bg-jade text-white",
  refund: "bg-lime/10 text-lime",
  business_income: "bg-gold/10 text-gold",
  investment: "bg-heliotrope/10 text-heliotrope",
  government: "bg-lavender/10 text-lavender",
  digital_platform: "bg-bittersweet/10 text-bittersweet",
  sales: "bg-jade/10 text-jade",
  default: "bg-jade/10 text-jade",
};

// Attachment icon mapping
export const getAttachmentIcon = (mimeType: string) => {
  if (mimeType.includes("pdf")) {
    return <FileText className="h-4 w-4 text-bittersweet" />;
  } else if (mimeType.includes("image")) {
    return <Image className="h-4 w-4 text-jade" />;
  } else {
    return <Paperclip className="h-4 w-4 text-black" />;
  }
};

// Utility functions
export const formatDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  }
};
