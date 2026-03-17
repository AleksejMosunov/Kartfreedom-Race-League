import React from "react";

interface FormRowProps {
  label?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormRow({ label, children, className = "" }: FormRowProps) {
  return (
    <div className={`sm:col-span-2 ${className}`}>
      {label ? <label className="text-zinc-400 text-sm mb-2 block">{label}</label> : null}
      {children}
    </div>
  );
}

export default FormRow;
