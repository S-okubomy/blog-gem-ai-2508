import React, { useState, useEffect, useRef } from 'react';
import { LineIcon, XIcon, FacebookIcon, CopyLinkIcon, ShareIcon } from './icons';

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ url, title, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('リンクをコピー');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareOptions = [
    {
      name: copyStatus,
      icon: CopyLinkIcon,
      action: async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopyStatus('コピーしました！');
          setTimeout(() => setCopyStatus('リンクをコピー'), 2000);
        } catch (err) {
          console.error('Failed to copy: ', err);
          setCopyStatus('コピー失敗');
           setTimeout(() => setCopyStatus('リンクをコピー'), 2000);
        }
      },
      isClipboard: true,
    },
    {
      name: 'X (Twitter)',
      icon: XIcon,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'LINE',
      icon: LineIcon,
      url: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'Facebook',
      icon: FacebookIcon,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];
  
  const openPopup = (shareUrl: string) => {
    window.open(shareUrl, 'share-window', 'height=450,width=550,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,directories=no,status=no');
  };

  const handleShareClick = (option: typeof shareOptions[number]) => {
    if (option.isClipboard) {
      option.action();
    } else if (option.url) {
      openPopup(option.url);
    }
    // Close the menu after a short delay to show copy status change
    setTimeout(() => setIsOpen(false), option.isClipboard ? 1000 : 100);
  };
  
  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);


  return (
    <div ref={wrapperRef} className={`relative inline-block text-left ${className}`}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-rose-500"
          id="menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <ShareIcon className="mr-2 h-5 w-5 text-gray-500" />
          シェア
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-left sm:origin-top-right absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {shareOptions.map((option, index) => (
                <React.Fragment key={option.name}>
                    {index === 1 && <div className="border-t border-gray-100 my-1" />}
                    <a
                      href={option.url || '#'}
                      onClick={(e) => {
                        e.preventDefault();
                        handleShareClick(option);
                      }}
                      className="text-gray-700 group flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                      role="menuitem"
                    >
                      <option.icon className={`mr-3 h-5 w-5 ${
                          option.name.includes('LINE') ? 'text-green-500' : 
                          option.name.includes('Facebook') ? 'text-blue-600' : 
                          option.name.includes('X') ? 'text-black' : 
                          'text-gray-500' 
                      }`} aria-hidden="true" />
                      {option.name}
                    </a>
                </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButtons;