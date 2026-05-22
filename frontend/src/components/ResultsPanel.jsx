import { Clock3, Loader2, SearchX } from 'lucide-react';
import ContactCard from './ContactCard';
import ContactDetails from './ContactDetails';

const ResultsPanel = ({
  searchTerm,
  mode,
  query,
  contacts,
  selectedContact,
  highlightedIndex,
  loading,
  error,
  onSelect,
  onEdit,
  onDelete,
  onFavorite,
}) => {
  if (selectedContact) {
    return (
      <ContactDetails
        contact={selectedContact}
        onEdit={onEdit}
        onDelete={onDelete}
        onFavorite={onFavorite}
      />
    );
  }

  const title = searchTerm ? 'Suggestions' : 'Recent contacts';

  return (
    <section className="min-h-[23rem] rounded-[1.5rem] border border-white/80 bg-white/70 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/42 dark:shadow-soft-dark sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          <Clock3 className="h-4 w-4" />
          {title}
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      )}

      {!loading && contacts.length === 0 && !error && (
        <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 px-5 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <SearchX className="mb-3 h-8 w-8" />
          <p className="font-medium">{searchTerm ? 'No matching contacts' : 'No recent contacts yet'}</p>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="scrollbar-thin max-h-[25rem] space-y-2 overflow-y-auto pr-1">
          {contacts.map((contact, index) => (
            <ContactCard
              key={contact.id || contact._id}
              contact={contact}
              mode={mode}
              query={query}
              selected={index === highlightedIndex}
              onClick={() => onSelect(contact)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ResultsPanel;
