import React, { ReactNode } from 'react';

type GlassPanelVariant = 'default' | 'elevated' | 'ghost';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassPanelVariant;
  interactive?: boolean;
  children: ReactNode;
  role?: string;
  'aria-label'?: string;
}

const clsx = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      variant = 'default',
      interactive = false,
      children,
      className,
      role,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'backdrop-blur-glass bg-mono-surface border border-mono-glass-border rounded-glass shadow-glass-sm',
      elevated: 'backdrop-blur-glass bg-mono-surface border border-mono-glass-border rounded-glass shadow-glass',
      ghost: 'backdrop-blur-glass-light bg-mono-surface-2 border border-transparent rounded-glass',
    };

    const interactiveStyles = interactive
      ? 'hover:translate-y-[-2px] active:scale-98 cursor-pointer'
      : '';

    const baseStyles = clsx(
      variants[variant],
      interactiveStyles,
      'transition-all duration-normal ease-glass',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mono-text/30',
      className
    );

    return (
      <div
        ref={ref}
        role={role}
        aria-label={ariaLabel}
        className={baseStyles}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

export default GlassPanel;
