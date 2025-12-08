import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-md group-hover:shadow-lg transition-all duration-200 animate-pulse-glow">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">
                Podcast Archive
              </h1>
              <p className="text-xs sm:text-sm text-caption hidden sm:block">
                Explore insightful conversations
              </p>
            </div>
          </Link>

          <nav className="flex gap-1 sm:gap-2">
            <Link
              href="/"
              className="px-3 py-2 text-sm sm:text-base text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/episodes"
              className="px-3 py-2 text-sm sm:text-base text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
            >
              Episodes
            </Link>
            <Link
              href="/search"
              className="px-3 py-2 text-sm sm:text-base text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
            >
              Search
            </Link>
            <Link
              href="/extract"
              className="px-3 py-2 text-sm sm:text-base text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
            >
              Extract
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

