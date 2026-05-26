import { Home, PieChart, Activity, Settings, ArrowLeftRight, User } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Activity, label: 'Scanner', path: '/opportunities' },
    { icon: PieChart, label: 'Portfolio', path: '/portfolio' },
    { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-20 md:w-64 h-full bg-surface border-r border-border flex flex-col transition-all duration-300">
      <div className="h-20 flex items-center justify-center md:justify-start md:px-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Activity className="text-primary w-6 h-6" />
        </div>
        <span className="hidden md:block ml-3 font-bold text-xl tracking-tight text-white">Arbitra</span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-center md:justify-start px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5 md:mr-3" />
            <span className="hidden md:block font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mb-4">
        <Link to="/profile" className="block w-10 h-10 md:w-full md:h-auto rounded-xl bg-muted p-2 flex items-center justify-center md:justify-start cursor-pointer hover:bg-muted/80 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 shrink-0 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block ml-3 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">My Profile</p>
            <p className="text-xs text-primary truncate">View Details</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
