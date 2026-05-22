import { AlertTriangle, Building2, Star, Tag, UserPlus, Users } from 'lucide-react';

const statItems = (stats) => [
  { label: 'Contacts', value: stats?.totalContacts ?? 0, icon: Users },
  { label: 'Favorites', value: stats?.favoriteContacts ?? 0, icon: Star },
  { label: 'Companies', value: stats?.companiesCount ?? 0, icon: Building2 },
  { label: 'Added this week', value: stats?.recentlyAddedContacts ?? 0, icon: UserPlus },
];

const AnalyticsCards = ({ stats, loading }) => {
  const topTag = stats?.mostUsedTags?.[0];
  const duplicateCount = stats?.possibleDuplicateWarnings?.length || 0;

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {statItems(stats).map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-xl border border-white/80 bg-white/64 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/38">
            <Icon className="mb-3 h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            <p className="text-2xl font-black text-slate-950 dark:text-white">{loading ? '-' : item.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
          </div>
        );
      })}
      <div className="rounded-xl border border-white/80 bg-white/64 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/38">
        <Tag className="mb-3 h-5 w-5 text-cyan-600 dark:text-cyan-300" />
        <p className="truncate text-2xl font-black text-slate-950 dark:text-white">{loading ? '-' : topTag?.tag || 'None'}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Most used tag</p>
      </div>
      <div className="rounded-xl border border-white/80 bg-white/64 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/38">
        <AlertTriangle className="mb-3 h-5 w-5 text-amber-500" />
        <p className="text-2xl font-black text-slate-950 dark:text-white">{loading ? '-' : duplicateCount}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Warnings</p>
      </div>
    </section>
  );
};

export default AnalyticsCards;
