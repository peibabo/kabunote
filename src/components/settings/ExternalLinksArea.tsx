'use client';

import { useState } from 'react';
import { useExternalLinks } from '@/hooks/dashboard/useExternalLinks';
import ExternalLinksSettingsModal from './ExternalLinksSettingsModal';

export default function ExternalLinksArea() {
  const { links, isLoading, saveLinks } = useExternalLinks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex items-center gap-4 mb-4 min-w-0">
      <div className="relative flex-1 min-w-0">
        <div className="flex overflow-x-auto gap-1.5 md:gap-3 min-w-0 pt-1 -mt-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {!isLoading && links.map((link) => (
            <a
              key={link.label + link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-14 flex flex-col items-center gap-1 group transition-transform duration-300 ease-out hover:-translate-y-1"
            >
              <span className={`w-9 h-9 rounded-full bg-gradient-to-r ${link.gradient} flex items-center justify-center text-lg shadow-lg transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-white/20`}>
                {link.icon}
              </span>
              <span className="text-xs text-gray-400 w-full text-center truncate transition-colors duration-300 group-hover:text-gray-200">{link.label}</span>
            </a>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none md:hidden" />
      </div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors p-1"
        title="外部リンク設定"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      <ExternalLinksSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        links={links}
        onSave={saveLinks}
      />
    </div>
  );
}
