import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { SiteContentProvider } from './hooks/useSiteContent';
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
    children: [{ path: '/', element: <HomePage /> }],
  },
  {
    path: '/admin/*',
    element: (
      <Suspense fallback={<AdminFallback />}>
        <AdminApp />
      </Suspense>
    ),
  },
  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
