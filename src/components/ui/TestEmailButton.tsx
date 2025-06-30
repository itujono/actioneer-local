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
    subject: "Freelance Payment Deposited - Project Completed Successfully",
    body: `💰 Payment Deposited to Your Account

Dear Freelancer,

Excellent news! Your freelance payment has been successfully deposited to your bank account.

💸 Money Added to Your Account:
• Project: Website Development for StartupX
• Amount Deposited: $2,500.00
• Deposited On: ${new Date().toLocaleDateString()}
• Transfer Method: Direct Bank Deposit
• Your Earnings ID: EARN-${Date.now().toString().slice(-6)}
• Deposit Reference: FREELANCER-INCOME-${Date.now().toString().slice(-4)}

🎯 Work Completed & Paid:
- Frontend development (React/TypeScript)
- Backend API integration
- Mobile responsive design
- 2 rounds of revisions

✅ $2,500.00 has been added to your account ending in ***1234
✅ Funds are now available in your bank account
✅ This confirms your project earnings have been processed
✅ Payment completed - no further action needed

Congratulations on completing another successful project! Your technical expertise and professionalism made this collaboration outstanding. We're excited to work with you on future projects.

Your earnings summary:
- Base project fee: $2,200.00
- Bonus for early delivery: $300.00
- Total deposited: $2,500.00

Best regards,
Alex Chen
Project Manager & Finance
StartupX Inc.
freelancer-payments@startupx.com

---
💡 This is your income confirmation. Keep this email for tax records.`,
  },
};

export function TestEmailButton({ category, className = "", variant = "outline", size = "md" }: TestEmailButtonProps) {
  const { user } = useAuth();

  const getCategoryLabel = (category: EmailCategory): string => {
    const labels = {
      receipt: "Receipt",
      travel: "Travel Deal",
      job: "Job Application",
      revenue: "Revenue",
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
      Test send {getCategoryLabel(category).toLowerCase()} email
    </Button>
  );
}

export default TestEmailButton;
