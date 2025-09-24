import React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className = "", ...props }) {
  return <div className={cx("rounded-2xl border bg-white shadow-sm", className)} {...props} />;
}

export function CardHeader({ className = "", ...props }) {
  return <div className={cx("p-4 md:p-5 border-b border-slate-200/70", className)} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h3 className={cx("text-base font-semibold", className)} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={cx("p-4 md:p-5", className)} {...props} />;
}

export function CardFooter({ className = "", ...props }) {
  return <div className={cx("p-4 md:p-5 border-t border-slate-200/70", className)} {...props} />;
}

export default Card;
