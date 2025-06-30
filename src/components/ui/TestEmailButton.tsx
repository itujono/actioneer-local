import { Send } from "lucide-react";
import { Button } from "./button";
import { useAuth } from "../../hooks/useAuth";

export type EmailCategory = "receipt" | "travel" | "job" | "revenue";

interface TestEmailButtonProps {
  category: EmailCategory;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const testEmailTemplates = {
  receipt: {
    subject: "Your Amazon Order Confirmation #123-4567890-1234567",
    body: `Thank you for your Amazon order!

Order Details:
- Order #: 123-4567890-1234567
- Order Date: ${new Date().toLocaleDateString()}
- Total: $89.99

Items Ordered:
• Wireless Bluetooth Headphones - $79.99
• USB-C Cable (3ft) - $9.99
• Shipping: FREE

Your order will be delivered by ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}.

Track your package: https://amazon.com/track

Thanks for shopping with Amazon!
The Amazon Team`,
  },
  travel: {
    subject: "🌴 Amazing Travel Deal: 60% Off Miami Beach Hotels This Weekend!",
    body: `Don't miss this incredible travel opportunity!

FLASH SALE: Miami Beach Getaway
🏖️ Up to 60% off luxury hotels
📅 Valid for travel: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ).toLocaleDateString()}
⏰ Book by: ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()} (Limited time!)

Featured Destinations:
• South Beach - Starting at $129/night (was $320)
• Downtown Miami - Starting at $89/night (was $220)
• Coral Gables - Starting at $159/night (was $380)

What's Included:
- Oceanview rooms with balcony
- Complimentary breakfast
- Pool and beach access
- Free WiFi

✈️ BONUS: Book now and get 25% off flights to Miami!
Flight deals from major cities starting at $199 roundtrip.

Ready for some sun and sand? This deal won't last long!

Book now: https://traveldeals.com/miami-flash-sale
Use code: MIAMI60

Happy travels!
The TravelDeals Team
deals@traveldeals.com`,
  },
  job: {
    subject: "Application Received: Senior Software Engineer - TechCorp",
    body: `Dear Candidate,

Thank you for applying to the Senior Software Engineer position at TechCorp!

Application Details:
• Position: Senior Software Engineer
• Department: Engineering
• Location: San Francisco, CA / Remote
• Application ID: TC-2024-ENG-001
• Submitted: ${new Date().toLocaleDateString()}

Next Steps:
Our recruiting team will review your application and reach out within 5-7 business days if your background aligns with our current needs.

In the meantime, feel free to explore our engineering blog at techcorp.com/blog to learn more about our technical culture and recent projects.

We appreciate your interest in joining our team!

Best regards,
Sarah Johnson
Senior Talent Acquisition Manager
TechCorp
careers@techcorp.com`,
  },
  revenue: {
    subject: "Payment Received: Freelance Project Invoice #INV-2024-001",
    body: `Payment Confirmation

Dear Freelancer,

We're pleased to confirm that your payment has been processed successfully.

Payment Details:
• Invoice #: INV-2024-001
• Project: Website Development for StartupX
• Amount: $2,500.00
• Payment Date: ${new Date().toLocaleDateString()}
• Payment Method: Bank Transfer
• Reference: PAY-${Date.now().toString().slice(-6)}

This payment covers:
- Frontend development (React/TypeScript)
- Backend API integration
- Mobile responsive design
- 2 rounds of revisions

The funds have been transferred to your account ending in ***1234 and should appear within 1-2 business days.

Thank you for your excellent work on this project! We look forward to collaborating again soon.

Best regards,
Alex Chen
Project Manager
StartupX Inc.
payments@startupx.com`,
  },
};

export function TestEmailButton({ category, className = "", variant = "outline", size = "md" }: TestEmailButtonProps) {
  const { user } = useAuth();

  const getCategoryLabel = (category: EmailCategory): string => {
    const labels = {
      receipt: "Receipt",
      travel: "Travel",
      job: "Job Application",
      revenue: "Payment",
    };
    return labels[category];
  };

  const handleSendTestEmail = () => {
    if (!user?.email) {
      alert("Please make sure you're logged in to send a test email.");
      return;
    }

    const template = testEmailTemplates[category];
    const encodedSubject = encodeURIComponent(template.subject);
    const encodedBody = encodeURIComponent(template.body);
    const encodedRecipient = encodeURIComponent(user.email);

    // Create mailto link with pre-filled content
    const mailtoLink = `mailto:${encodedRecipient}?subject=${encodedSubject}&body=${encodedBody}`;

    // Open default email client
    window.location.href = mailtoLink;
  };

  return (
    <Button
      onClick={handleSendTestEmail}
      variant={variant}
      size={size}
      className={`${className} flex items-center gap-2`}
    >
      <Send className="h-4 w-4" />
      Test {getCategoryLabel(category)}
    </Button>
  );
}

export default TestEmailButton;
