'use client';

import {
  Home,
  Truck,
  Receipt,
  CreditCard,
  Settings,
  Building2,
  Package,
  Users,
  Calendar,
  BarChart3,
  Building,
  ShoppingCart,
  Target,
  Database,
  FileText,
} from 'lucide-react';
import Image from 'next/image';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from './ui/sidebar';
import { TooltipProvider } from './ui/tooltip';

interface MainSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const navigationItems = [
  {
    title: 'Dashboard',
    icon: Home,
    id: 'dashboard',
  },
  {
    title: 'Sites',
    icon: Building2,
    id: 'sites',
  },
  {
    title: 'Materials',
    icon: Package,
    id: 'materials',
  },
  {
    title: 'Purchase',
    icon: ShoppingCart,
    id: 'purchase',
  },
  {
    title: 'Work Progress',
    icon: Target,
    id: 'work-progress',
  },
  {
    title: 'Vehicles',
    icon: Truck,
    id: 'vehicles',
  },
  {
    title: 'Vendors',
    icon: Users,
    id: 'vendors',
  },
  {
    title: 'Expenses',
    icon: Receipt,
    id: 'expenses',
  },
  {
    title: 'Payments',
    icon: CreditCard,
    id: 'payments',
  },
  {
    title: 'Scheduling',
    icon: Calendar,
    id: 'scheduling',
  },
  {
    title: 'Reports',
    icon: BarChart3,
    id: 'reports',
  },
  {
    title: 'Organization',
    icon: Building,
    id: 'organization',
  },
  {
    title: 'Masters',
    icon: Database,
    id: 'masters',
  },
  {
    title: 'Settings',
    icon: Settings,
    id: 'settings',
  },
];

export function MainSidebar({ currentPage, onNavigate }: MainSidebarProps) {
  const { state } = useSidebar();

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border h-16 px-4">
          <div className="flex h-full w-full items-center justify-center">
            <Image
              src="/Untitled design.png"
              alt="Build Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-cover"
            />
            {state === 'expanded' && (
              <span className="text-2xl font-bold text-sidebar-foreground leading-tight tracking-tight ml-3">
                BUILD
              </span>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            {state === 'expanded' && (
              <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                Navigation
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onNavigate(item.id)}
                      isActive={currentPage === item.id}
                      tooltip={item.title}
                      className={`h-11 px-3 rounded-lg transition-all duration-200 ${
                        currentPage === item.id
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md border border-sidebar-border'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="font-semibold truncate text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div className="mx-3 my-2 border-b border-sidebar-border"></div>
        </SidebarContent>

        <SidebarFooter className="px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarTrigger className="h-8 w-full px-3 justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 rounded-lg" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
