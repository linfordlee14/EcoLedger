import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { 
  Leaf, 
  LogOut, 
  Target, 
  FileText, 
  User, 
  Link as LinkIcon,
  Home
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export const Layout = ({ children, title, description }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Blockchain", href: "/blockchain", icon: LinkIcon },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-effect border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="gradient-bg p-2 rounded-xl shadow-[var(--shadow-soft)]">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">EcoLedger</h1>
                <p className="text-sm text-muted-foreground">Carbon tracking made simple</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex gap-6 items-center">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.name} 
                      to={item.href}
                      className={`flex items-center gap-2 transition-colors ${
                        isActive(item.href) 
                          ? "text-primary font-medium" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon size={18} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Welcome back,</p>
                  <p className="text-lg font-semibold text-primary">{user?.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={signOut} className="hover-lift">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
          {description && (
            <p className="text-muted-foreground text-lg">{description}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
};