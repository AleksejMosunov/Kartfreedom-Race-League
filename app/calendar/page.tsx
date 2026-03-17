import Calendar from '@/app/components/championship/Calendar';

export const metadata = {
  title: 'Календар — KartFreedom Race League',
};

export default function CalendarPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Calendar />
    </main>
  );
}
