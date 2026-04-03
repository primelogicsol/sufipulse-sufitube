'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function AdoptionCancelPage() {
  const searchParams = useSearchParams();
  const adoptionId = searchParams.get('adoption_id');

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4 text-center space-y-6">
        <XCircle className="w-16 h-16 text-neutral-500 mx-auto" />
        <h1 className="text-2xl font-serif font-light text-neutral-100">Payment Cancelled</h1>
        <p className="text-neutral-400">
          No charge was made. Your adoption form was saved — you can return to
          complete payment at any time.
        </p>
        {adoptionId && (
          <p className="text-sm text-neutral-500">
            Adoption reference: <span className="font-mono text-neutral-300">{adoptionId}</span>
          </p>
        )}
        <Link href="/">
          <button className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl transition-colors">
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
