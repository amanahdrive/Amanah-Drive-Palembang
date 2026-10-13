import Sidebar from "./sidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 pt-20 md:p-8 md:pt-8">{children}</main>
    </div>
  );
}