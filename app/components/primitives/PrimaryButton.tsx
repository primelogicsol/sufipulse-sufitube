import { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

type PrimaryButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  as?: 'button' | 'a';
} & (
  | ({ as?: 'button' } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as: 'a' } & AnchorHTMLAttributes<HTMLAnchorElement>)
);

export function PrimaryButton({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  as = 'button',
  ...props
}: PrimaryButtonProps) {
  const variantStyles = {
    primary: `
      bg-[var(--color-gold)]
      text-[var(--color-midnight)]
      border-[var(--color-gold)]
      hover:bg-[var(--color-gold-hover)]
      hover:border-[var(--color-gold-hover)]
    `,
    secondary: `
      bg-transparent
      text-[var(--color-text-primary)]
      border-[var(--color-text-primary)]
      hover:bg-[var(--color-slate)]
    `,
    outline: `
      bg-transparent
      text-[var(--color-gold)]
      border-[var(--color-gold)]
      hover:bg-[var(--color-gold-muted)]
    `
  };

  const sizeStyles = {
    small: 'px-4 py-2.5 text-xs md:text-sm min-h-[44px]',
    medium: 'px-5 md:px-6 py-3.5 text-sm md:text-base min-h-[48px]',
    large: 'px-6 md:px-8 py-4 text-base md:text-lg min-h-[52px]'
  };

  const baseStyles = `
    inline-block
    uppercase
    tracking-[var(--tracking-wider)]
    font-medium
    border-2
    rounded-[var(--radius-sm)]
    transition-all
    duration-[var(--transition-base)]
    hover:scale-[1.02]
    active:scale-[0.98]
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:scale-100
    cursor-pointer
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim();

  if (as === 'a') {
    return (
      <a
        className={baseStyles}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={baseStyles}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
