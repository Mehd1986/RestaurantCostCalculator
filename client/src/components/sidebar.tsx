import { Link, useLocation } from "wouter";
import { ShoppingCart, Package, DollarSign, BarChart3, Brain, User, Moon, Sun } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const [location] = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  const navItems = [
    { path: "/pos", label: "Point of Sale", icon: ShoppingCart },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/costs", label: "Cost Tracking", icon: DollarSign },
    { path: "/analytics", label: "AI Insights", icon: Brain },
    { path: "/reports", label: "Reports", icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === "/pos" && (location === "/" || location === "/pos")) {
      return true;
    }
    return location === path;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-colors">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-sm">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">CashierPro</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Smart POS System</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <button
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg transform scale-[1.02]"
                        : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Theme Toggle */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
      
      {/* User Profile */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Sarah Johnson</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Manager • Shift 1</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
