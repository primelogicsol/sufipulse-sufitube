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
        2xl:max-w-[1600px]
        mx-auto
        px-4
        md:px-6
        lg:px-8
        2xl:px-12
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
