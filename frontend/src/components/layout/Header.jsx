import { FileDown, Filter, ShieldCheck, LogOut, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/state/auth.jsx";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { user, logout, activeDistrictId, setActiveDistrictId, activeSchoolId, setActiveSchoolId } = useAuth();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-content-center font-bold">NS</div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">NorthStar</h1>
          <Badge variant="secondary" className="ml-2">Desktop • v0.1</Badge>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Input placeholder="Search students, incidents…" className="w-64" />
          <Button variant="outline" className="gap-2"><Filter size={16}/>Filters</Button>
          <Button className="gap-2"><FileDown size={16}/>Export</Button>

          {/* Context pickers */}
          <div className="flex items-center gap-2 ml-2">
            <MapPin size={16} className="text-slate-500" />
            <input
              className="h-8 w-20 rounded-lg border border-slate-300 px-2 text-sm"
              type="number"
              value={activeDistrictId || ""}
              onChange={(e) => setActiveDistrictId(Number(e.target.value || 0))}
              title="District ID"
              placeholder="Dist"
            />
            <input
              className="h-8 w-20 rounded-lg border border-slate-300 px-2 text-sm"
              type="number"
              value={activeSchoolId || ""}
              onChange={(e) => setActiveSchoolId(Number(e.target.value || 0))}
              title="School ID"
              placeholder="School"
            />
          </div>

          {user?.role === "Admin" && (
            <Button variant="outline" className="gap-2" onClick={() => nav("/admin")}><ShieldCheck size={16}/>Admin</Button>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{user.role}</Badge>
              <span className="text-sm text-slate-600">{user.name}</span>
              <Button variant="ghost" className="gap-1" onClick={() => { logout(); nav("/login"); }}>
                <LogOut size={16}/> Logout
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => nav("/login")}>Login</Button>
          )}
        </div>
      </div>
    </header>
  );
}
