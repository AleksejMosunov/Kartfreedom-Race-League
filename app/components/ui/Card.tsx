import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
