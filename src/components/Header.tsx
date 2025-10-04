import React from 'react';
import { WriteIcon, ListIcon, CherryBlossomIcon, SpinnerIcon, LoginIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, signOutUser } from '../services/firebaseService';

interface HeaderProps {
  navigate: (path: string) => void;
}

const Header: React.FC<HeaderProps> = ({ navigate }) => {
  const { user, isAdmin, loading } = useAuth();

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      alert('ログインに失敗しました。ポップアップがブロックされていないか確認してください。');
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      // Go back to list view on logout
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('ログアウトに失敗しました。');
    }
  };

  const renderAuthSection = () => {
    if (loading) {
      return <SpinnerIcon className="h-6 w-6 text-rose-500" />;
    }
    if (user) {
      return (
        <div className="flex items-center space-x-2">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`} 
            alt={user.displayName || 'User'} 
            className="h-8 w-8 rounded-full" 
            referrerPolicy="no-referrer"
          />
          <button 
            onClick={handleLogout} 
            className="px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
          >
            ログアウト
          </button>
        </div>
      );
    }
    return (
      <button 
        onClick={handleLogin} 
        className="p-2 text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
        aria-label="管理者ログイン"
        title="管理者ログイン"
      >
        <LoginIcon className="h-6 w-6" />
      </button>
    );
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="/" onClick={(e) => handleNavigation(e, '/')} className="flex items-center space-x-2 cursor-pointer">
          <CherryBlossomIcon className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold text-stone-800">
              かしこいママの暮らしノート
            </h1>
            <p className="text-xs text-rose-500">知って得する暮らしのヒント</p>
          </div>
        </a>
        <nav className="flex items-center space-x-2 sm:space-x-4">
          {isAdmin && (
            <a
              href="/new"
              onClick={(e) => handleNavigation(e, '/new')}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
            >
              <WriteIcon className="h-5 w-5" />
              <span className="hidden sm:inline">新規作成</span>
            </a>
          )}
          <a
            href="/"
            onClick={(e) => handleNavigation(e, '/')}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
          >
            <ListIcon className="h-5 w-5" />
            <span className="hidden sm:inline">記事一覧</span>
          </a>
          {renderAuthSection()}
        </nav>
      </div>
    </header>
  );
};

export default Header;