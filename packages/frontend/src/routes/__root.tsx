import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Verokt
        </Link>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
