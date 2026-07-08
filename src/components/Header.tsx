import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getSession } from '@/lib/session';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { UserDropdown } from '@/components/UserDropdown';

export async function Header() {
  const session = await getSession();
  let userName = "User";
  let userEmail = "";
  
  if (session.isValid && session.user) {
    userEmail = session.user.email;
    const db = getDb();
    const [dbUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, session.user.id)).limit(1);
    if (dbUser) {
      userName = dbUser.name || session.user.email.split('@')[0];
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex w-full max-w-sm items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search everything..." 
          className="h-9 w-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </button>
        <UserDropdown userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}
