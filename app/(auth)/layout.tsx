import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-sans">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="text-sm font-medium opacity-70 hover:opacity-100 transition"
        >
          ← Back to home
        </Link>
      </div>
      {children}
    </div>
  );
}
