import { AdminSidebar } from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="flex flex-col min-[800px]:flex-row min-h-[calc(100vh-64px)]">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
