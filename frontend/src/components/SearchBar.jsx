import { Plus, Search } from 'lucide-react';

const SearchBar = ({ value, onChange, onAdd, inputRef, disabled }) => (
  <div className="relative">
    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-16 w-full overflow-x-auto rounded-[2rem] border border-white/70 bg-white/88 pl-12 pr-16 text-lg font-medium text-slate-950 shadow-soft outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-200/45 dark:border-slate-700/80 dark:bg-slate-900/88 dark:text-slate-50 dark:shadow-soft-dark dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
      placeholder="Search name, number, email, or company"
      autoComplete="off"
      spellCheck="false"
    />
    <button
      type="button"
      onClick={onAdd}
      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 text-white transition hover:scale-105 hover:bg-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-300"
      aria-label="Add contact"
      title="Quick add"
    >
      <Plus className="h-5 w-5" />
    </button>
  </div>
);

export default SearchBar;
