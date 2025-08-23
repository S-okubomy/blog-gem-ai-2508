import React from 'react';
import type { View } from '../types';
import { WriteIcon, ListIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, signOutUser } from '../services/firebaseService';

interface HeaderProps {
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ setView }) => {
  const { user, isAdmin } = useAuth();

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
      setView('list');
    } catch (error) {
      console.error(error);
      alert('ログアウトに失敗しました。');
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('list')}>
          <img src="https://www.gstatic.com/images/branding/product/2x/gemini_48dp.png" alt="Gemini Logo" className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold text-stone-800">
              かしこいママの暮らしノート
            </h1>
            <p className="text-xs text-rose-500">知って得する暮らしのヒント</p>
          </div>
        </div>
        <nav className="flex items-center space-x-2 sm:space-x-4">
          {isAdmin && (
            <button
              onClick={() => setView('home')}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
            >
              <WriteIcon className="h-5 w-5" />
              <span className="hidden sm:inline">新規作成</span>
            </button>
          )}
          <button
            onClick={() => setView('list')}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
          >
            <ListIcon className="h-5 w-5" />
            <span className="hidden sm:inline">記事一覧</span>
          </button>
          {user ? (
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
          ) : (
            <button 
              onClick={handleLogin} 
              className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-md transition-colors shadow-sm"
            >
              管理者ログイン
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;