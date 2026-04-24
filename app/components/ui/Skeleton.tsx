"use client";

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  lines = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-[var(--color-midnight)] border border-[var(--color-border)] rounded';

  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return { borderRadius: '50%' };
      case 'avatar':
        return { width: width || 40, height: height || 40, borderRadius: '50%' };
      case 'card':
        return {
          width: width || '100%',
          height: height || 200,
          borderRadius: 'var(--radius-lg, 8px)',
        };
      case 'rectangular':
        return {
          width: width || '100%',
          height: height || 16,
          borderRadius: 'var(--radius-sm, 4px)',
        };
      default: // text
        return {
          width: width || '100%',
          height: height || 16,
          borderRadius: 'var(--radius-sm, 4px)',
        };
    }
  };

  const style = getVariantStyles();

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={baseClasses}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%',
              height: style.height || 16,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={style}
      aria-busy="true"
      aria-label="Loading"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--color-slate)] border border-[var(--color-border-strong)] rounded-lg p-6 space-y-4">
      <Skeleton variant="rectangular" height={160} />
      <Skeleton variant="text" lines={2} />
      <div className="flex gap-2">
        <Skeleton variant="text" width="30%" height={12} />
        <Skeleton variant="text" width="20%" height={12} />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <Skeleton variant="text" width="40%" height={32} className="mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 border border-[var(--color-border)] rounded"
        >
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
