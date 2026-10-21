// Re-mounted on every navigation between top-level pages, so each one fades
// in (the .fade-in animation in globals.css; off with reduced motion).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="fade-in">{children}</div>;
}
