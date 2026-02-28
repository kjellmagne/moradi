import { Button } from '@/components/ui/button';
import { Settings, Smartphone, Tablet } from 'lucide-react';

export function AdminLayout({
  navItems,
  section,
  navigate,
  t,
  openSettings,
  pageTitle,
  pageSubtitle,
  error,
  mobileLaunchHref = '/employee/mobile',
  children
}) {
  return (
    <div className='moradi-admin-shell grid min-h-dvh grid-cols-[260px_minmax(0,1fr)]'>
      <aside className='moradi-sidebar flex flex-col px-4 py-5'>
        <div className='mb-8 flex items-center gap-3 px-1'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-theme-400 to-theme-600 text-sm font-bold text-white shadow-lg shadow-theme-500/30'>
            M
          </div>
          <div>
            <p className='text-sm font-bold text-white'>Moradi</p>
            <p className='text-xs text-theme-300'>{t('appSubtitle')}</p>
          </div>
        </div>

        <nav className='space-y-1'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === section;
            return (
              <button
                key={item.key}
                type='button'
                onClick={() => navigate(`/admin/${item.key}`)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/15 text-white shadow-inner shadow-white/5'
                    : 'text-theme-200 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon className='h-4 w-4' />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className='mt-auto space-y-2 pt-6'>
          <div className='flex items-center gap-2'>
            <a
              href='/employee/ipad'
              className='flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/8 text-theme-200 transition-all duration-200 hover:bg-white/15 hover:text-white'
              title={t('launchIpad')}
            >
              <Tablet className='h-4 w-4' />
            </a>
            <a
              href={mobileLaunchHref}
              className='flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/8 text-theme-200 transition-all duration-200 hover:bg-white/15 hover:text-white'
              title={t('launchIphone')}
            >
              <Smartphone className='h-4 w-4' />
            </a>
          </div>
          <button
            type='button'
            onClick={openSettings}
            className='flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/8 text-theme-200 transition-all duration-200 hover:bg-white/15 hover:text-white'
            aria-label={t('settings')}
          >
            <Settings className='h-4 w-4' />
          </button>
        </div>
      </aside>

      <main className='min-w-0'>
        <header className='moradi-topbar sticky top-0 z-10 border-b border-theme-100/60'>
          <div className='flex items-center justify-between px-6 py-4'>
            <div className='animate-fade-in'>
              <h1 className='text-lg font-bold text-slate-900'>{pageTitle}</h1>
              <p className='text-sm text-slate-500'>{pageSubtitle}</p>
            </div>
          </div>
        </header>

        <div className='scroll-area-soft h-[calc(100dvh-73px)] overflow-y-auto p-6'>
          {error ? (
            <div className='mb-4 animate-fade-in rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600'>
              {error}
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
