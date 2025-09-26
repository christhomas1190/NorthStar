export default function Page({ title, subtitle, actions, children }) {
  return (
    <div>
      {(title || subtitle || actions) && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {title && <h1 className="text-xl font-semibold text-slate-900">{title}</h1>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}