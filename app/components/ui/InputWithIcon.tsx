import React from 'react';

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  containerClassName?: string;
}

/**
 * Input with optional left/right icon. Automatically applies padding so
 * icon never overlaps text. Icon must be a 16px (w-4 h-4) element.
 *
 * Padding logic:
 *   no icon      → px-4
 *   left only    → pl-10 pr-4
 *   right only   → pl-4 pr-10
 *   both         → pl-10 pr-10
 */
export function InputWithIcon({
  leftIcon,
  rightIcon,
  error,
  containerClassName = '',
  className = '',
  ...props
}: InputWithIconProps) {
  const pl = leftIcon ? 'pl-10' : 'pl-4';
  const pr = rightIcon ? 'pr-10' : 'pr-4';

  return (
    <div className={`relative ${containerClassName}`}>
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
          {leftIcon}
        </span>
      )}
      <input
        className={`w-full ${pl} ${pr} py-3 rounded-lg bg-neutral-900 border ${
          error ? 'border-red-500' : 'border-neutral-800'
        } text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 transition-colors ${className}`}
        {...props}
      />
      {rightIcon && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
          {rightIcon}
        </span>
      )}
    </div>
  );
}

interface CurrencyInputProps extends Omit<InputWithIconProps, 'leftIcon' | 'type'> {
  currency?: string;
}

/**
 * Number input with currency symbol. Uses InputWithIcon with correct
 * left-padding so the symbol never overlaps the typed value.
 */
export function CurrencyInput({ currency = '$', ...props }: CurrencyInputProps) {
  return (
    <InputWithIcon
      type="number"
      leftIcon={<span className="text-sm font-medium">{currency}</span>}
      {...props}
    />
  );
}
