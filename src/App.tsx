import React, {
  Suspense,
  lazy,
  useEffect,
  useState,
} from 'react';

import type { PropsWithChildren } from 'react';

import {
  BrowserRouter,
  NavLink,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

const DashboardPage = lazy(async () => ({
  default: function DashboardPage(): React.ReactElement {
    const metrics = [
      {
        label: 'Kubernetes Clusters',
        value: '12',
        status: 'healthy',
      },
      {
        label: 'Node Availability',
        value: '245',
        status: 'healthy',
      },
      {
        label: 'Critical Alerts',
        value: '03',
        status: 'warning',
      },
      {
        label: 'Deployment Failures',
        value: '01',
        status: 'critical',
      },
    ];

    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Enterprise Infrastructure Intelligence Platform
            </h1>

            <p className="mt-2 text-slate-400">
              Cloud operations, observability, Kubernetes intelligence,
              and GitOps monitoring.
            </p>
          </div>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              status={metric.status as MetricStatus}
            />
          ))}
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100">
              Platform Overview
            </h2>

            <div className="mt-6 space-y-4 text-sm text-slate-400">
              <div className="flex items-center justify-between">
                <span>Prometheus Targets</span>
                <span className="font-medium text-emerald-400">
                  142 Active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Grafana Dashboards</span>
                <span className="font-medium text-sky-400">
                  27 Configured
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>GitOps Pipelines</span>
                <span className="font-medium text-violet-400">
                  18 Synced
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Realtime Telemetry</span>
                <span className="font-medium text-amber-400">
                  Operational
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100">
              Infrastructure Services
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {[
                'Kubernetes',
                'Prometheus',
                'Grafana',
                'ArgoCD',
                'Terraform',
                'VMware',
                'Azure',
                'GitHub Actions',
              ].map((service) => (
                <div
                  key={service}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-300"
                >
                  {service}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  },
}));

type MetricStatus = 'healthy' | 'warning' | 'critical';

interface MetricCardProps {
  label: string;
  value: string;
  status: MetricStatus;
}

function MetricCard({
  label,
  value,
  status,
}: MetricCardProps): React.ReactElement {
  const statusStyles: Record<MetricStatus, string> = {
    healthy: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition-all duration-300 hover:border-slate-700">
      <div className="text-sm text-slate-400">
        {label}
      </div>

      <div className={`mt-4 text-4xl font-bold ${statusStyles[status]}`}>
        {value}
      </div>
    </div>
  );
}

function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
        />
      ))}
    </div>
  );
}

class GlobalErrorBoundary extends React.Component<
  PropsWithChildren,
  { hasError: boolean }
> {
  public state = {
    hasError: false,
  };

  public static getDerivedStateFromError(): {
    hasError: boolean;
  } {
    return {
      hasError: true,
    };
  }

  public componentDidCatch(error: Error): void {
    console.error(error);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h1 className="text-2xl font-bold">
              Infrastructure Platform Failure
            </h1>

            <p className="mt-3 text-slate-400">
              A rendering exception occurred inside the platform shell.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ThemeProvider({
  children,
}: PropsWithChildren): React.ReactElement {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.className = 'bg-slate-950';
  }, []);

  return <>{children}</>;
}

function AppProviders({
  children,
}: PropsWithChildren): React.ReactElement {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 60000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function AppLayout(): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed left-0 top-0 flex h-screen w-72 flex-col border-r border-slate-800 bg-slate-900 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            BVR Infra Platform
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Enterprise Operations Console
          </p>
        </div>

        <nav className="mt-10 flex flex-col gap-3 text-sm">
          {[
            'Dashboard',
            'Kubernetes',
            'Observability',
            'GitOps',
            'Identity',
            'Automation',
            'AI Insights',
          ].map((item) => (
            <NavLink
              key={item}
              to="/"
              className="rounded-xl border border-slate-800 px-4 py-3 text-slate-300 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800"
            >
              {item}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Environment
          </div>

          <div className="mt-3 text-sm text-emerald-400">
            Staging Operational
          </div>
        </div>
      </aside>

      <main className="ml-72 p-8">
        <Outlet />
      </main>
    </div>
  );
}

function AppRouter(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<DashboardSkeleton />}>
                <DashboardPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App(): React.ReactElement {
  return (
    <GlobalErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </GlobalErrorBoundary>
  );
}
