import React from 'react';
import { Mail, Phone, Star } from 'lucide-react';
import { getInitials } from '../utils/initials';
import { highlightMatch } from '../utils/highlightMatch.jsx';
import { getPrimaryPhone } from '../utils/phoneUtils';

const ContactCard = ({ contact, mode, query, selected, onClick }) => {
  const phone = contact.primaryPhone?.number || getPrimaryPhone(contact);
  const email = contact.matchingEmail?.email;
  const isPhoneMatch = contact.matchType === 'phone' || contact.matchType === 'phone_suffix';
  const subtitle = mode === 'email' ? email : mode === 'company' ? contact.company || '' : phone || contact.company;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
        selected
          ? 'border-cyan-400 bg-cyan-50/90 dark:border-cyan-400 dark:bg-cyan-950/40'
          : 'border-slate-200 bg-white/78 hover:border-cyan-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/74 dark:hover:border-cyan-700'
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-cyan-400 dark:text-slate-950">
        {contact.avatar?.url ? (
          <img src={contact.avatar.url} alt="" className="h-full w-full object-cover" />
        ) : (
          getInitials(contact.name)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-slate-950 dark:text-slate-50">
            {mode === 'name_number' && !isPhoneMatch ? highlightMatch(contact.name, query) : contact.name}
          </p>
          {contact.isFavorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
          {mode === 'email' && <Mail className="mr-1 inline h-3.5 w-3.5" />}
          {mode !== 'email' && <Phone className="mr-1 inline h-3.5 w-3.5" />}
          {mode === 'email' || mode === 'company' || isPhoneMatch
            ? highlightMatch(subtitle, query)
            : subtitle}
        </p>
        {mode === 'company' && phone && (
          <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{phone}</p>
        )}
      </div>
    </button>
  );
};

export default ContactCard;
