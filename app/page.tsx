import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="relative text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          Multilinea
        </h1>
        <p className="text-slate-500 mt-3">WhatsApp multi-line redirector</p>
        <Link
          href="/login"
          className="inline-block mt-6 text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
        >
          Administrar →
        </Link>
      </div>
    </div>
  );
}
