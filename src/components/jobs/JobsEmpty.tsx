import { BriefcaseIcon, Dot } from "lucide-react";
import { TestEmailButton } from "../ui";
import { Spiral } from "../illustrations";

export function JobsEmpty() {
  return (
    <div className="bg-daisy rounded-xl p-12 mt-8 text-lavender relative overflow-hidden">
      <div className="absolute -bottom-32 right-0 w-1/2 h-1/2 scale-x-[-1]">
        <Spiral className="text-heliotrope text-lg" />
      </div>
      <BriefcaseIcon className="h-16 w-16 mb-6" />
      <p className="text-lg mt-6 max-w-2xl leading-relaxed text-white">
        Track every opportunity and never lose sight of your job search progress! We automatically organize application
        confirmations, interview invites, and updates. The best part? You don't have to do anything.
      </p>

      <ul className="text-left text-white space-y-2 mt-6">
        <li className="flex items-start">
          <Dot className="text-lavender relative right-2" />
          <span>
            <strong className="text-lavender">Application confirmations</strong> from job boards and company portals
          </span>
        </li>
        <li className="flex items-start">
          <Dot className="text-lavender relative right-2" />
          <span>
            <strong className="text-lavender">Interview invitations</strong> and scheduling updates
          </span>
        </li>
        <li className="flex items-start">
          <Dot className="text-lavender relative right-2" />
          <span>
            <strong className="text-lavender">Status updates</strong> and rejection/acceptance notifications
          </span>
        </li>
        <li className="flex items-start">
          <Dot className="text-lavender relative right-2" />
          <span>
            <strong className="text-lavender">Add, edit, and delete custom fields</strong> for data Actioneer doesn't
            track automatically
          </span>
        </li>
      </ul>

      <div className="mb-6 pt-6 max-w-lg mt-6 border-t">
        <p className="text-white font-medium text-sm">
          <strong>Don't have any job application emails yet?</strong> Send yourself a test job application confirmation
          to experience the tracking magic.
        </p>
        <TestEmailButton category="job" variant="primary" className="mt-4" />
      </div>
    </div>
  );
}
