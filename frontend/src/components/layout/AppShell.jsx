import Header from "./Header";

export default function AppShell({ sidebar = null, children }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50">
      <Header />
      <main className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-2 w-full bg-emerald-500 rounded-full mb-4" />
        {sidebar ? (
          <div className="mx-auto max-w-7xl grid grid-cols-[240px_1fr] gap-6">
            <aside className="bg-white border rounded-2xl p-4">{sidebar}</aside>
            <section>{children}</section>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl">{children}</div>
        )}
      </main>
    </div>
  );
}