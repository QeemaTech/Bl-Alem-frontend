interface TabsProps {
  tabs: { id: string; label: string }[];
  active?: string;
  activeTab?: string;
  onChange: (id: string) => void;
  variant?: 'rounded' | 'pills';
}

export function Tabs({ tabs, active, activeTab, onChange, variant = 'rounded' }: TabsProps) {
  const current = active ?? activeTab ?? tabs[0]?.id;
  return (
    <div className={`tabs ${variant === 'pills' ? 'tabs-pills' : ''}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          className={`tab ${current === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-selected={current === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
