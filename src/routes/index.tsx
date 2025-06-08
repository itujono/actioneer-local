import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { Mail, Shield, ZapIcon, LineChart, BarChart4, Briefcase } from 'lucide-react';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Index,
});

function Index() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:top-0">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Turn your emails into instant actions
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Actioneer transforms your static emails into smart, actionable experiences. 
              Parse receipts, track expenses, compare travel options, and manage job applications automatically.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a 
                href="/auth" 
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200"
              >
                Get started
              </a>
              <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Intelligent Email Processing</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to get more from your inbox
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Actioneer automatically detects different types of emails and provides smart actions to help you manage your life more efficiently.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Mail className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Receipt Parsing
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Automatically extract merchant, amount, and category from receipt emails and organize them in a personal expense tracker.
                </dd>
              </div>
              
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <LineChart className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Financial Intelligence
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  View monthly spending dashboards, track expenses by category, and gain insights into your financial habits.
                </dd>
              </div>
              
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <BarChart4 className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Travel Intelligence
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Compare hotel and flight prices from travel emails, add trips to your calendar, and get the best deals on your bookings.
                </dd>
              </div>
              
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Briefcase className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Job Application Tracking
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Automatically organize job application emails and track your application status in one convenient dashboard.
                </dd>
              </div>
              
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <ZapIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Interactive Actions
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Take action directly from your inbox with smart buttons tailored to each email type - no more copy/pasting or manual data entry.
                </dd>
              </div>
              
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Privacy First
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Your email data is processed securely, and we never store the full content of your emails - only the extracted information you need.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your inbox?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Get started with Actioneer today and experience the power of intelligent email actions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a 
                href="/auth" 
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors duration-200"
              >
                Get started
              </a>
              <a href="#features" className="text-sm font-semibold leading-6 text-white">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}