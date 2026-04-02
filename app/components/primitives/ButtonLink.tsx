// import Link from 'next/link';
// import { ReactNode } from 'react';
// // import { Link, LinkProps } from 'react-router-dom';


// type ButtonLinkProps = LinkProps & {
//   children: ReactNode;
//   variant?: 'primary' | 'secondary' | 'outline';
//   size?: 'small' | 'medium' | 'large';
//   className?: string;
// };

// export function ButtonLink({
//   children,
//   variant = 'primary',
//   size = 'medium',
//   className = '',
//   ...linkProps
// }: ButtonLinkProps) {
//   const variantStyles = {
//     primary: `
//       bg-[var(--color-gold)]
//       text-[var(--color-midnight)]
//       border-[var(--color-gold)]
//       hover:bg-[var(--color-gold-hover)]
//       hover:border-[var(--color-gold-hover)]
//     `,
//     secondary: `
//       bg-transparent
//       text-[var(--color-text-primary)]
//       border-[var(--color-text-primary)]
//       hover:bg-[var(--color-slate)]
//     `,
//     outline: `
//       bg-transparent
//       text-[var(--color-gold)]
//       border-[var(--color-gold)]
//       hover:bg-[var(--color-gold-muted)]
//     `
//   };

//   const sizeStyles = {
//     small: 'px-4 py-2 text-sm',
//     medium: 'px-6 py-3 text-base',
//     large: 'px-8 py-4 text-lg'
//   };

//   const baseStyles = `
//     inline-block
//     uppercase
//     tracking-[var(--tracking-wider)]
//     font-medium
//     border-2
//     rounded-[var(--radius-sm)]
//     transition-all
//     duration-[var(--transition-base)]
//     hover:scale-[1.02]
//     active:scale-[0.98]
//     no-underline
//     ${variantStyles[variant]}
//     ${sizeStyles[size]}
//     ${className}
//   `.trim().replace(/\s+/g, ' ');

//   return (
//     <Link
//       className={baseStyles}
//       {...linkProps}
//     >
//       {children}
//     </Link>
//   );
// }
