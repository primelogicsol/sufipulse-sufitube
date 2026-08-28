import { Layout } from '@/app/components/layout/Layout';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}
