const QEEMA_SITE = 'https://www.qeematech.net/';

export function DashboardFooter() {
  return (
    <footer
      className="dashboard-qeema-footer shrink-0 border-t border-outline bg-surface-container/80 text-on-surface-variant backdrop-blur-sm transition-colors"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 sm:flex-row sm:px-6 lg:px-8">
        <p className="order-2 text-center text-xs font-medium tracking-wide sm:order-1 sm:text-start">
          Copyright © {new Date().getFullYear()} · All Rights Reserved
        </p>

        <a
          href={QEEMA_SITE}
          target="_blank"
          rel="noopener noreferrer"
          className="order-1 flex items-center gap-2 rounded-full border border-outline bg-surface-container-low/80 px-4 py-2 shadow-sm transition-all hover:border-primary/30 hover:bg-primary-container/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:order-2"
          aria-label="Qeema Tech - قيمة تك"
        >
          <img
            src="/qeema-logo.svg"
            alt=""
            className="h-7 w-auto object-contain"
          />
          <span className="text-sm font-semibold tracking-tight text-on-surface">
            Qeema Tech
          </span>
        </a>

        <p className="order-3 hidden text-end text-xs font-medium tracking-wide sm:block">
          Powered by <span className="text-on-surface">قيمة تك</span>
        </p>
      </div>
    </footer>
  );
}
