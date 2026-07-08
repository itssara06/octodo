import { getSession } from "@/lib/session";
import { SidebarNav } from './SidebarNav';

export async function Sidebar() {
  const { user } = await getSession();
  console.log('DEBUG USER MODEL:', user);
  const userRole = user?.role || user?.Role;
  const isSuperAdmin = typeof userRole === 'string' && userRole.toLowerCase() === 'admin';

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background px-4 py-6">
      <div className="flex items-center gap-2 px-2 pb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          OS
        </div>
        <span className="text-lg font-semibold tracking-tight">Personal OS</span>
      </div>

      <SidebarNav isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
