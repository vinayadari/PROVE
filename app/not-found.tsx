import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#090a12] text-white grid place-items-center px-6">
      <div className="text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">PROVE / 404</div>
        <h1 className="mt-3 font-display text-4xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-white/45">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium hover:bg-violet-500"
        >
          Back to PROVE
        </Link>
      </div>
    </main>
  );
}
