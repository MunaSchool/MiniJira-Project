import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'btn-primary-gradient hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(59,130,246,0.25)] active:translate-y-0 active:scale-[0.98]',
        outline:
          'border border-border/50 bg-[var(--button-secondary)] text-foreground shadow-sm hover:bg-[var(--button-secondary-hover)] active:scale-[0.98]',
        ghost: 'bg-transparent text-foreground hover:bg-[var(--surface-muted)] active:scale-[0.98]'
      },
      size: {
        default: 'h-11 px-4 py-2',
        lg: 'h-12 rounded-lg px-8',
        sm: 'h-9 px-3',
        icon: 'h-9 w-9 p-0'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
