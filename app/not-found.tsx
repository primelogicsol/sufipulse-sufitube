import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black/40 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        {/* Decorative element */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-amber-400/10 flex items-center justify-center border border-amber-400/30">
            <span className="text-5xl font-serif text-amber-400">404</span>
          </div>
        </div>

        <h1 className="text-4xl font-serif font-light text-neutral-100 mb-4">
          Page Not Found
        </h1>

        <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
          The kalam you're looking for seems to have wandered into silence.
          Let us guide you back to the music.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium"
          >
            Return Home
          </Link>
          <Link
            href="/releases"
            className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors font-medium"
          >
            Browse Releases
          </Link>
        </div>
      </div>
    </div>
  );
}
