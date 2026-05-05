export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b bg-background px-6 py-5">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{description}</p>
      )}
    </div>
  );
}