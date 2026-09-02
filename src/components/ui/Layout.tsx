import React, { ReactNode } from 'react';
import { Navbar } from '../Navbar';
import { UserProfile } from '../../types';

interface LayoutProps {
  children: ReactNode;
  modals?: ReactNode;
  user: UserProfile | null;
  onOpenNewShelf: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, modals, user, onOpenNewShelf }) => {
  return (
    <div
      id="app-root-container"
      className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col font-sans selection:bg-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] transition-colors antialiased"
      style={{
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)',
      }}
    >
      {user && (
        <Navbar
          user={user}
          onOpenNewShelf={onOpenNewShelf}
        />
      )}
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>

      <footer className="py-6 border-t border-stone-200/60 dark:border-stone-800/60 text-center text-xs text-stone-400 mt-auto">
        <p>© {new Date().getFullYear()} Oopsly · Spaced Repetition Flashcards with FSRS Algorithm & Collaborative Communities</p>
      </footer>

      {modals}
    </div>
  );
};
