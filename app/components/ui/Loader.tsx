export function Loader({ className = "" }: { className?: string; }) {
  return (
    <div className={`flex justify-center items-center py-12 ${className}`}>
      <div className="w-8 h-8 border-4 border-zinc-600 border-t-red-500 rounded-full animate-spin" />
    </div>
  );
}
