const TRUSTED_TEAMS = ['Acme Corp', 'Globex', 'Initech', 'Umbrella'];

export function AuthFooter() {
  return (
    <footer className="mt-8 w-full max-w-[520px] text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
        Trusted by teams at
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {TRUSTED_TEAMS.map((name) => (
          <span key={name} className="text-xs font-semibold text-muted-foreground/60">
            {name}
          </span>
        ))}
      </div>
      <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-2 text-xs text-muted-foreground">
        <a href="#" className="hover:text-primary">Privacy Policy</a>
        <span className="text-border">·</span>
        <a href="#" className="hover:text-primary">Terms of Service</a>
        <span className="text-border">·</span>
        <a href="#" className="hover:text-primary">Security</a>
      </nav>
    </footer>
  );
}
