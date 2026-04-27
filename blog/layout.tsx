export default function BlogLayout({ children }: { children: React.ReactNode }) {
  // Blog pages have ZERO shell, ZERO sidebar — fully isolated marketing route
  return <>{children}</>;
}
