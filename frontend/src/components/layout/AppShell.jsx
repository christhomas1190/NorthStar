import Header from "./Header";

export default function AppShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--ns-bg)",
      }}
    >
      <Header />
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
