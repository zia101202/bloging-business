import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PenTool, Home, User, LogIn, LogOut, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <PenTool className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Blaze Blog</span>
        </Link>
        
        <nav className="flex items-center space-x-4">
          <ThemeToggle />
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link to="/themes">
            <Button variant="ghost" size="sm">
              <Palette className="h-4 w-4 mr-2" />
              Themes
            </Button>
          </Link>
          
          {user ? (
            <>
              <Link to="/create">
                <Button variant="ghost" size="sm">
                  <PenTool className="h-4 w-4 mr-2" />
                  Write
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;