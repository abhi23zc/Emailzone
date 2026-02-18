'use client';

import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { ReactNode, useState } from 'react';


export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="glass rounded-2xl shadow-lg mt-4 transition-all duration-300 relative">
        <div className="flex justify-between h-16 px-6 items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                EmailZone
              </span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-xl">
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/campaigns">Campaigns</NavLink>
                <NavLink href="/recipients">Recipients</NavLink>
                <NavLink href="/smtp-settings">Settings</NavLink>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">{user.email}</span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {user && isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 p-4 glass rounded-2xl shadow-xl border border-white/20 animate-slide-up bg-background/95 backdrop-blur-xl">
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-primary/10 hover:text-primary transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/campaigns"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-primary/10 hover:text-primary transition font-medium"
              >
                Campaigns
              </Link>
              <Link
                href="/recipients"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-primary/10 hover:text-primary transition font-medium"
              >
                Recipients
              </Link>
              <Link
                href="/smtp-settings"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-primary/10 hover:text-primary transition font-medium"
              >
                Settings
              </Link>
              <div className="h-px bg-border/50 my-2"></div>
              <div className="px-4 py-2 text-sm text-muted-foreground truncate">
                {user.email}
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-600 text-left transition font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-background/80 rounded-lg transition-all duration-200"
    >
      {children}
    </Link>
  );
}


