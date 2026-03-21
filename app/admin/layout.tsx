import { AdminSidebar as AdminSidebarClient } from "./AdminSidebar";
import AdminSidebarServer from "./AdminSidebarServer";

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="flex flex-col min-[800px]:flex-row min-h-[calc(100vh-64px)]">
      {/* server-rendered sidebar (fallback visible only when client JS is blocked) */}
      <noscript>
        <AdminSidebarServer />
      </noscript>

      {/* client sidebar will hydrate and render when JS runs */}
      <AdminSidebarClient />

      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
