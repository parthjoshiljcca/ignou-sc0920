import { requireStudent } from "@/lib/auth";
import { NotificationsList } from "@/components/notifications-list";

export const metadata = { title: "Notifications" };

export default async function Page() {
  const u = await requireStudent();
  return <NotificationsList user={u} />;
}
