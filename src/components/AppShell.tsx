'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

import { MainSidebar } from './MainSidebar';
import { SaaSHomepage } from './SaaSHomepage';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';

import { useAuth } from '@/lib/auth-context';
import {
  MaterialReceiptsProvider,
  MaterialsProvider,
  ExpensesProvider,
  PaymentsProvider,
  SchedulingProvider,
  VendorsProvider,
  WorkProgressProvider,
  VehicleRefuelingProvider,
  VehiclesProvider,
  VehicleUsageProvider,
} from '@/lib/contexts';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isLoggedIn, user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Extract current page from pathname
  const getCurrentPage = () => {
    if (pathname === '/') return 'home';
    if (pathname === '/home') return 'home';
    if (pathname === '/login') return 'login';
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/sites') return 'sites';
    if (pathname === '/materials') return 'materials';
    if (pathname === '/masters') return 'masters';
    if (pathname === '/purchase') return 'purchase';
    if (pathname === '/purchase/receipt') return 'purchase';
    if (pathname === '/work-progress') return 'work-progress';
    if (pathname === '/work-progress/activity') return 'project-activity';
    if (pathname === '/vehicles') return 'vehicles';
    if (pathname === '/vendors') return 'vendors';
    if (pathname === '/expenses') return 'expenses';
    if (pathname === '/payments') return 'payments';
    if (pathname === '/scheduling') return 'scheduling';
    if (pathname === '/reports') return 'reports';
    if (pathname === '/organization') return 'organization';
    if (pathname === '/settings') return 'settings';
    return 'home';
  };

  const currentPage = getCurrentPage();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  // Show loading state while checking authentication
  if (isLoading && currentPage !== 'home' && currentPage !== 'login') {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Let the home page handle itself - don't interfere
  if (currentPage === 'home' || pathname === '/') {
    return <div>{children}</div>;
  }

  // Let the login page handle itself - don't interfere
  if (currentPage === 'login') {
    return <div>{children}</div>;
  }

  // Show main application with sidebar for authenticated users or dashboard pages
  if (
    isLoggedIn ||
    currentPage === 'dashboard' ||
    currentPage === 'sites' ||
    currentPage === 'materials' ||
    currentPage === 'masters' ||
    currentPage === 'purchase' ||
    currentPage === 'work-progress' ||
    currentPage === 'vehicles' ||
    currentPage === 'vendors' ||
    currentPage === 'expenses' ||
    currentPage === 'payments' ||
    currentPage === 'scheduling' ||
    currentPage === 'reports' ||
    currentPage === 'organization' ||
    currentPage === 'settings'
  ) {
    return (
      <MaterialsProvider>
        <VendorsProvider>
          <MaterialReceiptsProvider>
            <ExpensesProvider>
              <PaymentsProvider>
                <SchedulingProvider>
                  <WorkProgressProvider>
                    <VehiclesProvider>
                      <VehicleUsageProvider>
                        <VehicleRefuelingProvider>
                          <SidebarProvider>
                            <div className="flex h-screen w-full bg-gray-50">
                              <MainSidebar
                                currentPage={currentPage}
                                onNavigate={(page: string) => {
                                  // Use Next.js client-side navigation for better UX
                                  router.push(`/${page}`);
                                }}
                                onLogout={handleLogout}
                              />

                              <main className="flex-1 overflow-auto w-full">
                                <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-white to-gray-50/80 border-b border-gray-200/60">
                                  <div className="flex items-center gap-4">
                                    <SidebarTrigger className="h-9 w-9 rounded-lg border border-gray-200/60 bg-white/80 hover:bg-gray-50/80 shadow-sm hover:shadow-md transition-all duration-200" />
                                    <div className="flex items-center gap-3">
                                      <Image
                                        src="/fevicon.jpeg"
                                        alt="Dashboard icon"
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 rounded-lg object-cover"
                                        priority
                                      />
                                      <div>
                                        <h1 className="text-xl font-bold text-gray-900 capitalize leading-tight">
                                          {currentPage}
                                        </h1>
                                        <p className="text-sm text-gray-500 font-medium leading-tight">
                                          Management Dashboard
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {user && (
                                      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                          <span className="text-white text-sm font-semibold">
                                            {user.firstName?.charAt(0) ?? user.username.charAt(0)}
                                            {user.lastName?.charAt(0) ?? ''}
                                          </span>
                                        </div>
                                        <span className="font-medium">
                                          {user.firstName && user.lastName
                                            ? `${user.firstName} ${user.lastName}`
                                            : user.email}
                                        </span>
                                      </div>
                                    )}
                                    <button
                                      onClick={handleLogout}
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                                    >
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                      </svg>
                                      <span className="hidden sm:inline">Logout</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="min-h-full w-full max-w-none">{children}</div>
                              </main>
                            </div>
                          </SidebarProvider>
                        </VehicleRefuelingProvider>
                      </VehicleUsageProvider>
                    </VehiclesProvider>
                  </WorkProgressProvider>
                </SchedulingProvider>
              </PaymentsProvider>
            </ExpensesProvider>
          </MaterialReceiptsProvider>
        </VendorsProvider>
      </MaterialsProvider>
    );
  }

  // Fallback to homepage
  return <SaaSHomepage onLogin={() => {}} onGetStarted={() => {}} />;
}
