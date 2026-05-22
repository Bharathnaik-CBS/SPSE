import { AtSign, Building2, RotateCw, UserRoundSearch } from 'lucide-react';

const modes = [
  { value: 'name_number', label: 'Name/Number', icon: UserRoundSearch },
  { value: 'email', label: 'Email', icon: AtSign },
  { value: 'company', label: 'Company', icon: Building2 },
];

const SearchModeSwitcher = ({ mode, onCycle }) => {
  const active = modes.find((item) => item.value === mode) || modes[0];
  const Icon = active.icon;

  return (
    <button
      type="button"
      onClick={onCycle}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/82 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-200"
      title="Search Mode Switcher"
    >
      <Icon className="h-4 w-4" />
      <span>{active.label}</span>
      <RotateCw className="h-3.5 w-3.5 text-slate-400" />
    </button>
  );
};

export default SearchModeSwitcher;
