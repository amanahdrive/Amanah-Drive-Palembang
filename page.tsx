import { CalendarDays, Car, ClipboardList, Users } from "lucide-react";
import StatCard from "@/components/stat-card";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm text-[#005B93]">Amanah Drive Console</p>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Ringkasan operasional hari ini.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Siswa Aktif" value="0" subtitle="Belum terhubung ke database" icon={Users} />
        <StatCard title="Pendaftaran Baru" value="0" subtitle="Data akan muncul setelah database aktif" icon={ClipboardList} />
        <StatCard title="Jadwal Hari Ini" value="0" subtitle="Belum ada jadwal" icon={CalendarDays} />
        <StatCard title="Armada Aktif" value="0" subtitle="Belum ada data armada" icon={Car} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Jadwal Hari Ini</h2>
          <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">
            Belum ada data jadwal.
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Aktivitas Terbaru</h2>
          <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">
            Aktivitas akan tampil setelah modul database diaktifkan.
          </div>
        </section>
      </div>
    </div>
  );
}