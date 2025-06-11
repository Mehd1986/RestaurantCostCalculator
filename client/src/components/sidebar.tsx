import { Link, useLocation } from "wouter";
import { Calculator, Package, BookOpen, BarChart3, User } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/ingredients", label: "Ingredients", icon: Package },
    { path: "/recipes", label: "Recipes", icon: BookOpen },
    { path: "/summary", label: "Summary", icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === "/ingredients" && (location === "/" || location === "/ingredients")) {
      return true;
    }
    return location === path;
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Costeau</h1>
            <p className="text-sm text-neutral-600">Menu Costing</p>
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
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
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
      
      {/* Footer */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-700">Chef Antoine</p>
            <p className="text-xs text-neutral-500">chef@restaurant.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
