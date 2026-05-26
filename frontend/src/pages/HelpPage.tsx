import { Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HELP_SECTIONS = [
  {
    title: 'Getting Started',
    description: 'Learn how to create projects, organize tasks, and collaborate with your workspace.',
    articles: ['Creating projects', 'Managing tasks', 'Working with teams']
  },
  {
    title: 'Account',
    description: 'Manage profile information, preferences, and account settings.',
    articles: ['Profile editing', 'Password help', 'Notifications']
  },
  {
    title: 'Workspace',
    description: 'Manage access, roles, and collaboration.',
    articles: ['Permissions', 'Roles', 'Collaboration']
  }
];

const FAQS = [
  {
    question: 'Can I change my email?',
    answer: 'Email and security changes are managed through account settings.'
  },
  {
    question: 'How do I enable dark mode?',
    answer: 'Use the appearance controls available in settings.'
  },
  {
    question: 'Why are some actions restricted?',
    answer: 'Permissions depend on your workspace role.'
  }
];

export function HelpPage() {
  return (
    <AppShell title="Help Center" subtitle="Find guidance and answers for using Mini Jira.">
      <div className="space-y-6">
        <Card className="border-border/50 bg-[var(--surface)]">
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-[14px] border border-border bg-[var(--input)] px-3 py-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <input
                className="w-full bg-transparent text-sm text-foreground placeholder:text-[var(--placeholder)] focus:outline-none"
                placeholder="Search help topics..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {HELP_SECTIONS.map((section) => (
            <Card key={section.title} className="border-border/50 bg-[var(--surface)]">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.articles.map((article) => (
                    <li key={article} className="rounded-lg border border-border/50 bg-[var(--surface-muted)] px-3 py-2">
                      {article}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50 bg-[var(--surface)]">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {FAQS.map((item) => (
              <details key={item.question} className="rounded-lg border border-border/50 bg-[var(--surface-muted)] px-4 py-3">
                <summary className="cursor-pointer font-semibold text-foreground">{item.question}</summary>
                <p className="mt-2 text-xs text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-[var(--surface-muted)]">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">Support contact</p>
              <p className="text-xs text-muted-foreground">support@minijira.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
