import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { SiteContentProvider } from './hooks/useSiteContent';
import { ErrorPage } from './pages/ErrorPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// O painel é carregado sob demanda: visitantes do site não baixam esse código.
const AdminApp = lazy(() => import('./features/admin/AdminApp'));

function PublicLayout() {
  return (
    <SiteContentProvider>
      <Outlet />
    </SiteContentProvider>
  );
}

function AdminFallback() {
  return (
    <p role="status" style={{ padding: '2rem', textAlign: 'center' }}>
      Carregando painel…
    </p>
  );
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [{ path: '/', element: <HomePage /> }],
  },
  {
    path: '/admin/*',
    errorElement: <ErrorPage area="admin" />,
    element: (
      <Suspense fallback={<AdminFallback />}>
        <AdminApp />
      </Suspense>
    ),
  },
  { path: '*', element: <NotFoundPage />, errorElement: <ErrorPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
