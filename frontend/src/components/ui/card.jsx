import React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className = "", ...props }) {
  return (
    <div
      className={cx("rounded-xl bg-white", className)}
      style={{ border: "1.5px solid #e2e0d8" }}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return (
    <div
      className={cx("p-4 md:p-5", className)}
      style={{ borderBottom: "1px solid #e2e0d8" }}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }) {
  return (
    <h3
      className={cx("text-base font-semibold", className)}
      style={{ fontFamily: "'Lora', serif", color: "#1a1916" }}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }) {
  return <div className={cx("p-4 md:p-5", className)} {...props} />;
}

export function CardFooter({ className = "", ...props }) {
  return (
    <div
      className={cx("p-4 md:p-5", className)}
      style={{ borderTop: "1px solid #e2e0d8" }}
      {...props}
    />
  );
}

export default Card;
