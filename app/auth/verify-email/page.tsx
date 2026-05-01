import { redirect } from "next/navigation";

// Email links go to /auth/verify-email?token=xxx
// We forward to the API route that handles actual verification
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (token) {
    redirect(`/api/auth/verify-email?token=${token}`);
  }
  redirect("/auth/login");
}
