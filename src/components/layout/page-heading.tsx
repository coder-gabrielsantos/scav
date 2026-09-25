export function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
    </header>
  );
}
