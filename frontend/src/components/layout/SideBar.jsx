export default function Sidebar({ children }) {
  return (
    <aside className="hidden lg:block w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-60px)]">
      {/* nav items go here */}
      {children}
    </aside>
  );
}