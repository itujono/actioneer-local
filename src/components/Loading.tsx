import { Loader2 } from "lucide-react";

export default function Loading({ message }: { message: string }) {
  return (
    <div className="bg-concrete rounded-xl p-12 mt-12">
      <div className="flex justify-center items-center">
        <Loader2 className="h-6 w-6 text-gray animate-spin" />
        <span className="ml-4 text-lg text-gray">{message}</span>
      </div>
    </div>
  );
}
