import { DollarSign, Plane, Briefcase } from "lucide-react";

export function SupportedCategoriesSection() {
  return (
    <section className="pt-12 mb-12" data-section="supported-categories">
      <h2 className="text-3xl font-bold text-thunder mb-6">
        Supported Categories
      </h2>
      <p className="text-gray mb-8">
        Actioneer currently excels at processing three major email categories,
        with intelligent extraction and organization for each:
      </p>

      {/* Finance & Expenses */}
      <div className="mb-10" data-section="finance-expenses">
        <div className="bg-white rounded-lg border border-concrete overflow-hidden">
          <div className="bg-jade rounded-t-lg p-6 text-lime">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-white" />
              <h3 className="text-2xl font-bold">Finance & Expenses</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray mb-6">
              Imagine when you receive a receipt from your favorite coffee shop,
              and within seconds, it's automatically categorized as "Food &
              Dining," added to your monthly expense tracker, and factored into
              your spending analytics—all without you touching a single button.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-thunder mb-3">
                  What it handles:
                </h4>
                <ul className="space-y-2 text-sm text-gray">
                  <li>• Purchase receipts and invoices</li>
                  <li>• Subscription billing notifications</li>
                  <li>• Refunds and reimbursements</li>
                  <li>• Revenue and income notifications</li>
                  <li>• Business payment confirmations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-thunder mb-3">
                  What you get:
                </h4>
                <ul className="space-y-2 text-sm text-gray">
                  <li>• Automatic expense categorization and tracking</li>
                  <li>• Revenue vs. expense analytics with visual charts</li>
                  <li>• Detailed transaction history with date grouping</li>
                  <li>• Merchant and vendor organization</li>
                  <li>• Real-time financial insights and spending patterns</li>
                  <li>• Currency breakdown and multi-currency support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Travel & Promotional Emails */}
      <div className="mb-10" data-section="travel-promotional">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-jade/20 rounded-lg">
            <Plane className="h-6 w-6 text-jade" />
          </div>
          <h3 className="text-2xl font-bold">Travel & Promotional Emails</h3>
        </div>

        <p className="text-lg text-thunder mb-6">
          Imagine when you receive an email about "75% off hotels in NYC this
          weekend" or "Flash sale: flights to Tokyo starting at $299," and
          instead of letting these deals get buried in your inbox, Actioneer
          automatically captures and organizes them into your travel
          dashboard—no manual sorting, no forgotten deals, no effort required.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-thunder mb-3">
              What it handles:
            </h4>
            <ul className="space-y-2 text-thunder">
              <li>• Travel promotional emails and deals</li>
              <li>• Destination-specific travel offers</li>
              <li>• Flight and hotel sale notifications</li>
              <li>• Travel inspiration and deal alerts</li>
              <li>• Tourism board promotional content</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-thunder mb-3">What you get:</h4>
            <ul className="space-y-2 text-thunder">
              <li>• Centralized travel promotional email dashboard</li>
              <li>• Smart destination extraction and formatting</li>
              <li>• Travel recommendation engine with real-time data</li>
              <li>• Hotel and attraction insights for destinations</li>
              <li>• Trip planning assistance with AI-powered suggestions</li>
              <li>• Quick access to travel deals and offers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Job Applications */}
      <div className="mb-10" data-section="job-applications">
        <div className="bg-white rounded-lg border border-concrete overflow-hidden">
          <div className="bg-jade rounded-t-lg p-6 text-lime">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-white" />
              <h3 className="text-2xl font-bold">Job Applications & Career</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray mb-6">
              Imagine when you're juggling applications for your dream job at
              multiple companies, and every application confirmation, interview
              invitation, and status update is automatically organized into a
              comprehensive tracking system.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-thunder mb-3">
                  What it handles:
                </h4>
                <ul className="space-y-2 text-sm text-gray">
                  <li>• Job application confirmations</li>
                  <li>• Interview scheduling emails</li>
                  <li>• Application status updates</li>
                  <li>• Offer letters and rejections</li>
                  <li>• Career-related correspondence</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-thunder mb-3">
                  What you get:
                </h4>
                <ul className="space-y-2 text-sm text-gray">
                  <li>
                    • Complete application tracking system with status
                    management
                  </li>
                  <li>• Company and position organization</li>
                  <li>• Interview scheduling and follow-up reminders</li>
                  <li>• Application timeline and progress tracking</li>
                  <li>• Success rate analytics and insights</li>
                  <li>• Customizable fields for personal notes and rankings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
