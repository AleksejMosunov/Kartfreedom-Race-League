interface LoaderProps {
  className?: string;
}

export function Loader({ className = "" }: LoaderProps) {
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      <div className="h-7 w-56 rounded bg-zinc-800" />
      <div className="h-4 w-80 rounded bg-zinc-900" />
      <div className="h-36 rounded-xl bg-zinc-900 border border-zinc-800" />
    </div>
  );
}
