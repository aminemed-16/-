export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Notice({ tone = 'success', children }: { tone?: 'success' | 'error'; children: React.ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mb-6 rounded-control px-4 py-3 text-sm ${tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}
    >
      {children}
    </p>
  );
}
