import { Button } from "@/components/ui/button";
import { Database as DatabaseIcon, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Database() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-4 p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <DatabaseIcon className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Database Management</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Your data is now hosted on Turso. To view or edit your database tables directly, please use the Turso dashboard or Drizzle Studio.
      </p>
      
      <div className="flex gap-4 pt-4">
        <Link href="https://turso.tech/app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          Open Turso Dashboard <ExternalLink className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
