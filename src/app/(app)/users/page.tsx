import { getUsers } from "@/app/actions/users";
import { UserManagementClient } from "./UserManagementClient";
import { redirect } from "next/navigation";

export default async function UserManagement() {
  try {
    const rawUsers = await getUsers();
    const users = rawUsers.map(user => ({
      ...user,
      createdAt: new Date(user.createdAt).toISOString()
    }));
    return <UserManagementClient initialUsers={users} />;
  } catch (error) {
    console.error("Error in UsersPage:", error);
    redirect("/dashboard");
  }
}

