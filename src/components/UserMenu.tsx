import { User, Settings, LogOut, Shield, Users, Home } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface UserMenuProps {
  user: {
    username: string;
    role: string;
    companyName: string;
  };
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenUserManagement?: () => void;
  onViewHomepage?: () => void;
}

export function UserMenu({
  user,
  onLogout,
  onOpenSettings,
  onOpenUserManagement,
  onViewHomepage,
}: UserMenuProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm';
      case 'manager':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm';
      case 'engineer':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'manager':
        return <Users className="h-3 w-3" />;
      case 'engineer':
        return <User className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 w-12 rounded-full hover:bg-white/10 transition-all duration-300"
        >
          <Avatar className="h-10 w-10 ring-2 ring-white/30 hover:ring-white/50 transition-all duration-300">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold shadow-lg">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 enhanced-card shadow-xl border-blue-100"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
                <span className="ml-1 capitalize">{user.role}</span>
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">{user.companyName}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onOpenSettings} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        {onViewHomepage && (
          <DropdownMenuItem onClick={onViewHomepage} className="cursor-pointer">
            <Home className="mr-2 h-4 w-4" />
            <span>View Homepage</span>
          </DropdownMenuItem>
        )}

        {user.role === 'admin' && onOpenUserManagement && (
          <DropdownMenuItem onClick={onOpenUserManagement} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            <span>User Management</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
