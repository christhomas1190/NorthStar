export function Checkbox({ id, checked, onCheckedChange, disabled, className = "" }) {
  return (
    <input
      id={id}
      type="checkbox"
      className={`h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-400 ${className}`}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
    />
  );
}