export function CatalogSkeleton() {
  return (
    <div className="animate-pulse pt-6" aria-hidden>
      <div className="h-8 w-48 bg-panel" />
      <div className="my-4 h-6 w-2/3 bg-panel" />
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="chamfer aspect-[3/4] bg-panel" />
        ))}
      </div>
    </div>
  );
}
