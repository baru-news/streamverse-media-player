import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, User, LogOut, Shield, X, Menu, Heart, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { CoinDisplay } from "@/components/CoinDisplay";
import { BadgeStore } from "@/components/BadgeStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DailyTasksCard } from "@/components/DailyTasksCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

const Header = ({ onSearchChange, searchQuery: externalSearchQuery }: HeaderProps) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();

  const searchQuery = externalSearchQuery ?? internalSearchQuery;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange?.(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearchChange]);

  const handleSearchChange = (value: string) => {
    if (externalSearchQuery !== undefined) {
      onSearchChange?.(value);
    } else {
      setInternalSearchQuery(value);
    }
  };

  const clearSearch = () => {
    if (externalSearchQuery !== undefined) {
      onSearchChange?.("");
    } else {
      setInternalSearchQuery("");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-nav-bg backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between md:justify-between">
          {/* Mobile Search Toggle - Left Side */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="h-9 w-9"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Logo - Desktop left, Mobile center */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0 md:flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              DINO18
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Cari video..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 bg-muted/50 border-muted hover:bg-muted/70 focus:bg-muted transition-all duration-200"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted-foreground/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <CoinDisplay />
                <BadgeStore />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Target className="w-4 h-4" />
                      Tasks
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Daily Tasks</DialogTitle>
                    </DialogHeader>
                    <DailyTasksCard />
                  </DialogContent>
                </Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-md">
                    <DropdownMenuItem asChild>
                      <div className="flex flex-col items-start px-2 py-1">
                        <span className="text-sm font-medium">{user.email}</span>
                        <span className="text-xs text-muted-foreground">
                          {isAdmin ? "Administrator" : "User"}
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Favorit Saya</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/upload" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="nav" size="sm" className="h-9 px-4">
                    Masuk
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="hero" size="sm" className="h-9 px-4">
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Toggle - Right Side */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden mt-3 px-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Cari video..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 bg-muted/50 border-muted hover:bg-muted/70 focus:bg-muted transition-all duration-200"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted-foreground/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 bg-card/95 backdrop-blur-md rounded-lg border border-border/50">
            {user ? (
              <div className="space-y-3">
                <div className="flex flex-col items-start px-2 py-2 border-b border-border/50">
                  <span className="text-sm font-medium">{user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {isAdmin ? "Administrator" : "User"}
                  </span>
                  <div className="mt-2">
                    <CoinDisplay />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <BadgeStore />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="justify-start gap-2">
                        <Target className="w-4 h-4" />
                        Daily Tasks
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Daily Tasks</DialogTitle>
                      </DialogHeader>
                      <DailyTasksCard />
                    </DialogContent>
                  </Dialog>
                </div>
                <Link 
                  to="/favorites" 
                  className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Heart className="mr-3 h-4 w-4" />
                  <span>Favorit Saya</span>
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin/upload" 
                    className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Shield className="mr-3 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors w-full text-left"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="nav" className="w-full justify-start h-11">
                    Masuk
                  </Button>
                </Link>
                <Link 
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="hero" className="w-full justify-start h-11">
                    Daftar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;