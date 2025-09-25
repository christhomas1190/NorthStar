 import { NavLink } from "react-router-dom";

 export default function Sidebar() {
   const link = "block px-4 py-2 rounded-lg hover:bg-slate-100";
   const active = "bg-slate-200 font-medium";
   return (
     <aside className="p-4 space-y-2">
       <NavLink to="/admin" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Admin</NavLink>
       <NavLink to="/teacher" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Teacher</NavLink>
       <NavLink to="/reports" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Reports</NavLink>
     </aside>
   );
 }
