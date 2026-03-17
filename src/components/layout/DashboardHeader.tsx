'use client';

import Image from 'next/image';
import AuthButton from '@/components/auth/AuthButton';
import HamburgerMenuButton from '@/components/layout/HamburgerMenuButton';
import { AlertCounts } from '@/hooks/alert/useAlertCounts';

interface DashboardHeaderProps {
  alertCounts: AlertCounts;
  onMenuOpen: () => void;
}

export default function DashboardHeader({ alertCounts, onMenuOpen }: DashboardHeaderProps) {
  return (
    <>
      <header className="bg-slate-900 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a
              href="/dashboard"
              className="flex items-center gap-4 group cursor-pointer transition-transform duration-200 hover:scale-105"
              title="カブノオト ホームページ"
            >
              <Image
                src="/kabunote-logo.png"
                alt="カブノオト - 投資思考整理ダッシュボード"
                width={200}
                height={64}
                className="h-12 md:h-16 w-auto transition-all duration-300"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))'
                }}
              />
            </a>

            <div className="flex items-center gap-3 flex-shrink-0">
              <AuthButton />
              <HamburgerMenuButton
                onClick={onMenuOpen}
                alertCounts={alertCounts}
              />
            </div>
          </div>
        </div>
      </header>

      <style jsx>{`
        .group:hover img {
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.2)) !important;
        }
      `}</style>
    </>
  );
}
