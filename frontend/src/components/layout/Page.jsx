import React from "react";
import Footer from "@/components/layout/Footer";

export default function Page({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Content container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex-1 w-full">
        {(title || subtitle || actions) && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {title && (
                <h1 className="text-xl font-semibold text-slate-900">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {actions}
          </div>
        )}
        {children}
      </div>

      {/* Footer always at the bottom*/}
     <Footer />
    </div>
  );
}