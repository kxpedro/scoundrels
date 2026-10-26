export function NewsroomPageHeader({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-xl text-fg">{title}</h1>
        {lead && <p className="mt-1 max-w-xl text-[13px] text-muted">{lead}</p>}
      </div>
      {action}
    </div>
  );
}
