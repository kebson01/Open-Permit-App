/**
 * PageHeader — light surface header used on all main pages.
 *
 * Props:
 *   eyebrow   string   small uppercase label above the title
 *   title     string   main heading
 *   subtitle  string   optional body text
 *   actions   node     slot — rendered right-aligned (buttons, selects, etc.)
 */
export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="bg-white border-b border-line px-4 sm:px-6 pt-7 pb-5">
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-4 flex-wrap">
        <div>
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-extrabold text-ink leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted mt-1 max-w-xl leading-relaxed">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap mt-1">{actions}</div>
        )}
      </div>
    </div>
  );
}