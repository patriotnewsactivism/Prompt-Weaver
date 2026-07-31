import { Link, useLocation } from 'wouter';
import { Settings, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PR</span>
          </div>
          <span className="font-bold text-foreground hidden sm:inline">Prompt Reasoning</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button 
              variant={location === '/' ? 'secondary' : 'ghost'} 
              size="sm"
              className="gap-2"
              data-testid="nav-home"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button 
              variant={location === '/settings' ? 'secondary' : 'ghost'} 
              size="sm"
              className="gap-2"
              data-testid="nav-settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
