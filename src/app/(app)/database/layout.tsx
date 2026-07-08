import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DatabaseLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  
  const userRole = user?.role;
  if (typeof userRole !== 'string' || userRole.toLowerCase() !== 'admin') {
    redirect('/dashboard');
  }

  return children;
}
