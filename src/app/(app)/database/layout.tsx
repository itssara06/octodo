import { getSession } from "@/lib/pb";
import { redirect } from "next/navigation";

export default async function DatabaseLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  
  const userRole = user?.role || user?.Role;
  if (typeof userRole !== 'string' || userRole.toLowerCase() !== 'admin') {
    redirect('/dashboard');
  }

  return children;
}
