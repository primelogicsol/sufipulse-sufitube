"use client";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-[var(--color-gold)] border-t-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface ButtonWithLoadingProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export function ButtonWithLoading({
  children,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
}: ButtonWithLoadingProps) {
  const variantClasses = {
    primary: 'bg-[var(--color-gold)] text-[var(--color-midnight)] hover:bg-[var(--color-gold)]/90',
    secondary: 'bg-[var(--color-midnight)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-slate)]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-2 px-6 py-2.5 rounded font-medium transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `.trim()}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}

export default LoadingSpinner;
