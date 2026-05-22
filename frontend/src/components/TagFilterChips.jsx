import { Star } from 'lucide-react';

const defaultChips = ['Family', 'Work', 'Friends', 'College', 'Client', 'Emergency', 'Favorite'];

const TagFilterChips = ({ selected, onChange }) => {
  const isAll = selected.length === 0;

  const toggle = (chip) => {
    if (chip === 'All') {
      onChange([]);
      return;
    }

    if (selected.includes(chip)) {
      onChange(selected.filter((item) => item !== chip));
      return;
    }

    onChange([...selected, chip]);
  };

  return (
    <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
      {['All', ...defaultChips].map((chip) => {
        const active = chip === 'All' ? isAll : selected.includes(chip);
        return (
          <button
            key={chip}
            type="button"
            onClick={() => toggle(chip)}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition ${
              active
                ? 'border-slate-950 bg-slate-950 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950'
                : 'border-slate-200 bg-white/72 text-slate-600 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-200'
            }`}
          >
            {chip === 'Favorite' && <Star className="h-3.5 w-3.5" />}
            {chip}
          </button>
        );
      })}
    </div>
  );
};

export default TagFilterChips;
