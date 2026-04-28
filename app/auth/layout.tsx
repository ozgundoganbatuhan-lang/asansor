export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Auth pages have ZERO shell, ZERO sidebar — fully isolated
  return <>{children}</>;
}
