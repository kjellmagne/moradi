import { Button } from '@/components/ui/button';
import { Settings, Smartphone, Tablet } from 'lucide-react';

export function AdminLayout({ navItems, section, navigate, t, openSettings, pageTitle, pageSubtitle, error, children }) {
  return (
    <div className='moradi-admin-shell grid min-h-dvh grid-cols-[270px_minmax(0,1fr)]'>
      <aside className='moradi-sidebar flex flex-col border-r px-4 py-5'>
        <div className='mb-7 flex items-center gap-3'>
          <div className='grid h-10 w-10 place-items-center rounded-xl bg-sky-500 text-sm font-bold text-white shadow-md shadow-sky-500/25'>
            M
          </div>
          <div>
            <p className='text-sm font-semibold text-slate-50'>Moradi</p>
            <p className='text-xs text-slate-300'>{t('appSubtitle')}</p>
          </div>
        </div>

        <nav className='space-y-1.5'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === section;
            return (
              <button
                key={item.key}
                type='button'
                onClick={() => navigate(`/admin/${item.key}`)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? 'bg-white/20 text-white shadow-inner shadow-white/10 backdrop-blur'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className='h-4 w-4' />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className='mt-auto pt-6'>
          <button
            type='button'
            onClick={openSettings}
            className='grid h-10 w-10 place-items-center rounded-xl border border-white/30 bg-white/10 text-white transition hover:bg-white/20'
            aria-label={t('settings')}
          >
            <Settings className='h-5 w-5' />
          </button>
        </div>
      </aside>

      <main className='min-w-0'>
        <header className='moradi-topbar sticky top-0 z-10 border-b'>
          <div className='flex items-center justify-between px-6 py-4'>
            <div>
              <h1 className='text-lg font-semibold text-slate-900'>{pageTitle}</h1>
              <p className='text-sm text-slate-600'>{pageSubtitle}</p>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='icon' asChild>
                <a href='/employee/ipad' title={t('launchIpad')}>
                  <Tablet className='h-4 w-4' />
                </a>
              </Button>
              <Button variant='outline' size='icon' asChild>
                <a href='/employee/mobile' title={t('launchIphone')}>
                  <Smartphone className='h-4 w-4' />
                </a>
              </Button>
            </div>
          </div>
        </header>

        <div className='scroll-area-soft h-[calc(100dvh-73px)] overflow-y-auto p-6'>
          {error ? <p className='mb-3 text-sm text-destructive'>{error}</p> : null}
          {children}
        </div>
      </main>
    </div>
  );
}
