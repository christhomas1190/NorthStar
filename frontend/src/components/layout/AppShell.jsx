import Header from "./Header";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50">
      <Header />
      <main className="p-6">{children}</main>
    </div>
  );
}
