import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import Shell from "@/components/Shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const session = readSession();
  if (!session) redirect("/auth/login");
  return <Shell>{children}</Shell>;
}
