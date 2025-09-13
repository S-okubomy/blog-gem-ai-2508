import React from 'react';

export const WriteIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export const ListIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-12a1 1 0 011 1v4a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1h4zm10 10a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4a1 1 0 011-1h4z" />
    </svg>
);

export const PublishIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

export const RegenerateIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4a14.95 14.95 0 0114.32 11.2M20 20a14.95 14.95 0 01-14.32-11.2" />
    </svg>
);

export const BackIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

export const EditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

export const TrashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const HeartIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.672l1.318-1.354a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
);

export const TagIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 8V3a2 2 0 012-2z" />
  </svg>
);

export const CalendarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const LineIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.5 3.37c-1.4-1.4-3.3-2.1-5.4-2.1-2.2 0-4.3.8-5.9 2.3-1.6 1.4-2.6 3.4-2.9 5.5-.3 2.1 0 4.3.9 6.2.9 2 2.4 3.6 4.4 4.8 2 1.2 4.3 1.7 6.6 1.6 2.3 0 4.6-.7 6.4-2.1 1.9-1.4 3.1-3.5 3.5-5.8.4-2.3.1-4.7-.9-6.8s-2.7-3.9-4.7-5.1zm-1.1 12.1c-.2.2-.5.4-.7.5-.7.5-1.5.8-2.3.9-1.5.2-3.1-.2-4.3-1.1-.6-.4-1.1-.9-1.6-1.5l-.3-.4c-1-1.3-1.5-2.9-1.5-4.5 0-1.2.3-2.4.9-3.4s1.5-1.9 2.6-2.4c1.1-.5 2.3-.6 3.5-.4 1.2.2 2.3.8 3.2 1.6.9.8 1.5 1.9 1.7 3.1.2 1.2 0 2.5-.5 3.5-.2.5-.5.9-.9 1.3-.2.3-.5.5-.8.7zm-2.1-5.5h-1.6v1.6c0 .3-.3.6-.6.6s-.6-.3-.6-.6v-1.6h-1.6c-.3 0-.6-.3-.6-.6s.3-.6.6-.6h1.6V7.7c0-.3.3-.6.6-.6s.6.3.6.6v1.6h1.6c.3 0 .6.3.6.6s-.3.6-.6.6zm-5.4 0H7.7v1.6c0 .3-.3.6-.6.6s-.6-.3-.6-.6V10h-1.6c-.3 0-.6-.3-.6-.6s.3-.6.6-.6h1.6V7.7c0-.3.3-.6.6-.6s.6.3.6.6v1.6h1.6c.3 0 .6.3.6.6s-.3.6-.6.6z" />
    </svg>
);

export const ShareIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m12-12l-4-4m4 4l-4 4" />
    </svg>
);

export const CopyLinkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

export const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

export const FacebookIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
);

export const CherryBlossomIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
        <defs>
            <linearGradient id="petal-gradient" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#fecdd3" />
                <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <radialGradient id="center-gradient">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="100%" stopColor="#f9a8d4" />
            </radialGradient>
        </defs>
        <g fill="url(#petal-gradient)">
            <path d="M256,0C111.6,134.4,142,216.5,256,256c114-39.5,144.4-121.6,0-256Z" />
            <path d="M256,0C111.6,134.4,142,216.5,256,256c114-39.5,144.4-121.6,0-256Z" transform="rotate(72, 256, 256)" />
            <path d="M256,0C111.6,134.4,142,216.5,256,256c114-39.5,144.4-121.6,0-256Z" transform="rotate(144, 256, 256)" />
            <path d="M256,0C111.6,134.4,142,216.5,256,256c114-39.5,144.4-121.6,0-256Z" transform="rotate(216, 256, 256)" />
            <path d="M256,0C111.6,134.4,142,216.5,256,256c114-39.5,144.4-121.6,0-256Z" transform="rotate(288, 256, 256)" />
        </g>
        <circle cx="256" cy="256" r="45" fill="url(#center-gradient)" />
        <g stroke="#9f1239" strokeWidth="8" strokeLinecap="round">
            <line x1="256" y1="256" x2="256" y2="196" transform="rotate(18, 256, 256)" />
            <line x1="256" y1="256" x2="256" y2="196" transform="rotate(90, 256, 256)" />
            <line x1="256" y1="256" x2="256" y2="196" transform="rotate(162, 256, 256)" />
            <line x1="256" y1="256" x2="256" y2="196" transform="rotate(234, 256, 256)" />
            <line x1="256" y1="256" x2="256" y2="196" transform="rotate(306, 256, 256)" />
        </g>
    </svg>
);