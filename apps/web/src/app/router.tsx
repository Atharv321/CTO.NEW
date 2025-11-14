import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { MainLayout } from '@components/layout/MainLayout';
import { Home } from '@pages/Home';
import { Appointments } from '@pages/Appointments';
import { Settings } from '@pages/Settings';
import { NotFound } from '@pages/NotFound';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'appointments', element: <Appointments /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <NotFound /> },
];

export const router = createBrowserRouter(appRoutes);
