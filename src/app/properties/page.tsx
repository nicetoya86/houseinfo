// Design Ref: §5.1/§11.1 — 매물 리스트 페이지
import { PropertyFilterPanel } from '@/features/properties/components/PropertyFilterPanel';
import { PropertyList } from '@/features/properties/components/PropertyList';

export default function PropertiesPage() {
  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[260px_1fr]">
      <aside>
        <PropertyFilterPanel />
      </aside>
      <section>
        <h1 className="mb-4 text-xl font-bold">경매·공매 매물</h1>
        <PropertyList />
      </section>
    </main>
  );
}
