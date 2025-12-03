'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { ContextProviders } from './ContextProviders';
import { MainSidebar } from './MainSidebar';
import { SaaSHomepage } from './SaaSHomepage';
import { ThemeToggle } from './theme-toggle';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';

import { useAuth } from '@/lib/auth-context';

interface AppShellProps {
  children: React.ReactNode;
}

// Protected pages list - defined outside component to avoid recreation
const protectedPages = [
  'dashboard',
  'sites',
  'materials',
  'masters',
  'purchase',
  'work-progress',
  'vehicles',
  'vendors',
  'expenses',
  'payments',
  'scheduling',
  'reports',
  'organization',
  'settings',
] as const;

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

  // Redirect to home if not logged in and trying to access protected pages
  // MUST be called before any early returns (Rules of Hooks)
  useEffect(() => {
    // If not logged in and trying to access protected page, redirect to home
    if (!isLoading && !isLoggedIn && (protectedPages as readonly string[]).includes(currentPage)) {
      router.push('/');
      router.refresh();
    }
  }, [isLoading, isLoggedIn, currentPage, router]);

  const handleLogout = async () => {
    await logout();
    // No need to prefetch logout route
    router.push('/');
    router.refresh();
  };

  // Show loading state while checking authentication
  if (isLoading && currentPage !== 'home' && currentPage !== 'login') {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
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

  // Show main application with sidebar only for authenticated users
  if (isLoggedIn && (protectedPages as readonly string[]).includes(currentPage)) {
    // Determine required contexts based on current page
    // Sites page includes Work Progress tab, so it needs work-progress context
    const requiredContexts =
      currentPage === 'sites'
        ? [currentPage, 'work-progress', 'materials', 'expenses', 'purchase', 'scheduling']
        : [currentPage];

    return (
      <ContextProviders requiredContexts={requiredContexts}>
        <SidebarProvider>
          <div className="flex h-screen w-full bg-background">
            <MainSidebar
              currentPage={currentPage}
              onNavigate={(page: string) => {
                // Prefetch the route before navigation for instant page switching
                const route = `/${page}`;
                router.prefetch(route);
                router.push(route);
              }}
              onLogout={handleLogout}
            />

            <main className="flex-1 overflow-auto w-full">
              <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/60 dark:border-gray-700/60 dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-800/80">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="h-9 w-9 rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 shadow-sm hover:shadow-md transition-all duration-200" />
                  <div className="flex items-center gap-3">
                    <Image
                      src="/Untitled design.png"
                      alt="Dashboard icon"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-cover"
                      priority
                    />
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize leading-tight">
                        {currentPage}
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight">
                        Management Dashboard
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user && (
                    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
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
                  <ThemeToggle />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
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
              <div className="min-h-full w-full max-w-none bg-background">{children}</div>
            </main>
          </div>
        </SidebarProvider>
      </ContextProviders>
    );
  }

  // Fallback to homepage
  return <SaaSHomepage onLogin={() => {}} onGetStarted={() => {}} />;
}
