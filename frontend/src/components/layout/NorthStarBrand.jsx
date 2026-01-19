import React from "react";
import { useNavigate } from "react-router-dom";

export default function NorthStarBrand({ isAdmin = false }) {
  const nav = useNavigate();

  // Same visual layout for everyone
  const content = (
    <>
      <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-content-center font-bold">
        NS
      </div>
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
        NorthStar
      </h1>
    </>
  );

  // Only admin gets a clickable brand -> /admin
  if (!isAdmin) {
    return <div className="flex items-center gap-3">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => nav("/admin")}
      className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 hover:opacity-90"
      aria-label="Go to Admin Dashboard"
      title="Back to Admin Dashboard"
    >
      {content}
    </button>
  );
}
