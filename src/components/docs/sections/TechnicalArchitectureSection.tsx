export function TechnicalArchitectureSection() {
  return (
    <section className="pt-12 mb-12" data-section="technical-architecture">
      <h2 className="text-3xl font-bold text-thunder mb-6">
        Technical Architecture
      </h2>
      <p className="text-gray mb-8">
        Actioneer is built on a modern, scalable architecture designed for
        performance and reliability:
      </p>

      <div className="space-y-8">
        {/* Frontend Stack */}
        <div data-section="frontend-stack">
          <h3 className="text-2xl font-semibold text-thunder mb-4">
            Frontend Stack
          </h3>
          <div className="bg-white p-6 rounded-lg border border-concrete">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray">
              <li>
                • <strong>React 18</strong> with TypeScript for type-safe
                component development
              </li>
              <li>
                • <strong>TanStack Router</strong> for modern, type-safe routing
              </li>
              <li>
                • <strong>TanStack Query</strong> for efficient data fetching
                and caching
              </li>
              <li>
                • <strong>Tailwind CSS</strong> for utility-first styling and
                responsive design
              </li>
              <li>
                • <strong>Shadcn UI</strong> components for consistent,
                accessible interface elements
              </li>
              <li>
                • <strong>Lucide React</strong> for beautiful, consistent
                iconography
              </li>
            </ul>
          </div>
        </div>

        {/* Backend Infrastructure */}
        <div data-section="backend-infrastructure">
          <h3 className="text-2xl font-semibold text-thunder mb-4">
            Backend Infrastructure
          </h3>
          <div className="bg-white p-6 rounded-lg border border-concrete">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray">
              <li>
                • <strong>Supabase</strong> as the primary backend-as-a-service
                platform
              </li>
              <li>
                • <strong>PostgreSQL</strong> database with Row Level Security
                (RLS)
              </li>
              <li>
                • <strong>Supabase Edge Functions</strong> for serverless API
                endpoints
              </li>
              <li>
                • <strong>Deno runtime</strong> for modern JavaScript/TypeScript
                execution
              </li>
              <li>
                • <strong>OpenAI GPT-4</strong> for intelligent email
                classification and data extraction
              </li>
            </ul>
          </div>
        </div>

        {/* Email Processing Pipeline */}
        <div data-section="email-processing">
          <h3 className="text-2xl font-semibold text-thunder mb-4">
            Email Processing Pipeline
          </h3>
          <div className="bg-white p-6 rounded-lg border border-concrete">
            <ul className="space-y-3 text-gray">
              <li>
                • <strong>Gmail API</strong> integration for real-time email
                monitoring
              </li>
              <li>
                • <strong>Gmail Push Notifications</strong> for instant email
                processing
              </li>
              <li>
                • <strong>Gmail OAuth</strong> integration for secure email
                access
              </li>
              <li>
                • <strong>OAuth 2.0</strong> with refresh token management for
                secure authentication
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
