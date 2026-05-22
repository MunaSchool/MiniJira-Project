import { Bell, KeyRound, LifeBuoy, Mail, Palette, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export function SettingsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const { useSystemTheme, setUseSystemTheme } = useTheme();

  useEffect(() => {
    const stored = localStorage.getItem('mini_jira_density');
    if (stored === 'compact' || stored === 'comfortable') {
      setDensity(stored);
      document.documentElement.dataset.density = stored;
    }
  }, []);

  const handleDensityChange = (next: 'comfortable' | 'compact') => {
    setDensity(next);
    localStorage.setItem('mini_jira_density', next);
    document.documentElement.dataset.density = next;
  };

  return (
    <AppShell title="Settings" subtitle="Manage preferences, notifications, and appearance.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border-border/50 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <p className="text-xs text-muted-foreground">Profile identity and security controls.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                icon={UserRound}
                label="Profile"
                description="Manage your name, avatar, and basic details."
                action="Edit"
                onClick={() => navigate('/profile')}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                description="Primary contact for notifications."
                value={session?.user?.email || 'Not available'}
              />
              <StaticRow
                icon={KeyRound}
                label="Security"
                description="Password and sign-in controls."
                value="Managed by backend"
              />
              <SettingToggle
                label="Two-factor authentication"
                description="Requires backend support to enable."
                checked={twoFactor}
                onCheckedChange={setTwoFactor}
                disabled
              />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <p className="text-xs text-muted-foreground">Control alerts, updates, and summaries.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingToggle
                label="Task updates"
                description="Get alerts for status changes and mentions."
                checked={alertsEnabled}
                onCheckedChange={setAlertsEnabled}
              />
              <SettingToggle
                label="Weekly digest"
                description="Summary of team activity each week."
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
              />
              <SettingToggle
                label="Product notifications"
                description="Local notifications for product updates."
                checked={productUpdates}
                onCheckedChange={setProductUpdates}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <p className="text-xs text-muted-foreground">Theme and interface preferences.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
                </div>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-[var(--surface-muted)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/30 text-primary">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Theme follows system</p>
                    <p className="text-xs text-muted-foreground">Match your OS appearance preference.</p>
                  </div>
                </div>
                <Switch checked={useSystemTheme} onCheckedChange={setUseSystemTheme} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-[var(--surface-muted)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/30 text-primary">
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">UI density</p>
                    <p className="text-xs text-muted-foreground">Adjust spacing for compact layouts.</p>
                  </div>
                </div>
                <Switch
                  checked={density === 'compact'}
                  onCheckedChange={(checked) => handleDensityChange(checked ? 'compact' : 'comfortable')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <p className="text-xs text-muted-foreground">Permissions and access details.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                icon={ShieldCheck}
                label="Role"
                description="Role-based controls are enforced by the backend."
                action="Member"
              />
              <SettingRow
                icon={ShieldCheck}
                label="Permissions"
                description="View access level and workspace rules."
                action="View"
                onClick={() => navigate('/permissions')}
              />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <p className="text-xs text-muted-foreground">Help center and legal information.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                icon={LifeBuoy}
                label="Help Center"
                description="Browse guides and FAQs."
                action="Open"
                onClick={() => navigate('/help')}
              />
              <SettingRow
                icon={ShieldCheck}
                label="Privacy"
                description="Review data and privacy policies."
                action="View"
                onClick={() => navigate('/privacy')}
              />
              <SettingRow
                icon={ShieldCheck}
                label="About"
                description="Product version and status."
                action="Details"
                onClick={() => navigate('/about')}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function SettingRow({
  icon: Icon,
  label,
  description,
  action,
  onClick,
  disabled = false
}: {
  icon: typeof UserRound;
  label: string;
  description: string;
  action: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  if (!onClick) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-[var(--surface-muted)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/30 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{action}</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-border/40 bg-[var(--surface-muted)] px-4 py-3 text-left transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/30 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <span className="text-xs font-semibold text-primary">{action}</span>
    </button>
  );
}

function InfoRow({
  icon: Icon,
  label,
  description,
  value
}: {
  icon: typeof Mail;
  label: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-[var(--surface-muted)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/30 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

function StaticRow({
  icon: Icon,
  label,
  description,
  value
}: {
  icon: typeof UserRound;
  label: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-[var(--surface-muted)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/30 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{value}</span>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
