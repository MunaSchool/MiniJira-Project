import { useEffect, useRef } from 'react';

function DashboardIllustration() {
  return (
    <svg
      className="pointer-events-none absolute right-[4%] top-1/2 hidden h-[min(520px,55vh)] w-[min(480px,42vw)] -translate-y-1/2 opacity-[0.22] lg:block"
      viewBox="0 0 480 420"
      fill="none"
      aria-hidden
    >
      <rect x="40" y="60" width="200" height="140" rx="12" stroke="#4f46e5" strokeWidth="1.5" fill="white" fillOpacity="0.5" />
      <rect x="60" y="85" width="80" height="8" rx="4" fill="#dce9ff" />
      <rect x="220" y="100" width="180" height="200" rx="12" stroke="#4f46e5" strokeWidth="1.5" fill="white" fillOpacity="0.45" />
      <rect x="240" y="130" width="140" height="10" rx="5" fill="#4f46e5" fillOpacity="0.2" />
    </svg>
  );
}

export function AuthBackground({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      container.style.setProperty('--parallax-x', `${x}px`);
      container.style.setProperty('--parallax-y', `${y}px`);
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="auth-mesh relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10"
      style={{ '--parallax-x': '0px', '--parallax-y': '0px' } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl transition-transform duration-700"
        style={{ transform: 'translate(var(--parallax-x), var(--parallax-y))' }}
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-secondary blur-3xl transition-transform duration-700"
        style={{ transform: 'translate(calc(var(--parallax-x) * -0.6), calc(var(--parallax-y) * -0.6))' }}
      />
      <DashboardIllustration />
      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center">
        {children}
      </div>
    </div>
  );
}
