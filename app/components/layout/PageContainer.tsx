import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div
      className={`
        w-full
        max-w-[1200px]
        mx-auto
        px-4
        md:px-6
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
