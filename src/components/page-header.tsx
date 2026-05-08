type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, eyebrow, actions }: Props) {
  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-card/40 to-transparent px-6 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-texture opacity-40"
      />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow && (
            <div className="mb-2 inline-flex items-center gap-2">
              <span className="h-px w-6 bg-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                {eyebrow}
              </span>
            </div>
          )}
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
