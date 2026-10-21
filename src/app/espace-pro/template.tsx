// Inside the espace pro only the page content fades in on navigation; the
// sidebar and top bar (the layout) stay put.
export default function EspaceProTemplate({ children }: { children: React.ReactNode }) {
  return <div className="fade-in flex flex-col gap-8">{children}</div>;
}
