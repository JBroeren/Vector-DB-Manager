import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        <Link className="underline" href="/">Go back home</Link>
      </div>
    </div>
  );
}

