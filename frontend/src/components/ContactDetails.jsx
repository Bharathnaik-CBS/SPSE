import React from 'react';
import {
  BriefcaseBusiness,
  Edit3,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Trash2,
} from 'lucide-react';
import { getInitials } from '../utils/initials';
import { getPhoneHref, getWhatsAppHref } from '../utils/phoneUtils';

const formatDate = (value) => {
  if (!value) {
    return 'Not viewed before';
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const iconButton =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-200';

const ContactDetails = ({ contact, onEdit, onDelete, onFavorite }) => {
  const primaryPhone = contact.phoneNumbers?.find((item) => item.isPrimary) || contact.phoneNumbers?.[0];
  const primaryEmail = contact.emails?.find((item) => item.isPrimary) || contact.emails?.[0];

  return (
    <section className="rounded-[1.5rem] border border-white/80 bg-white/76 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/46 dark:shadow-soft-dark">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-2xl font-black text-white dark:bg-cyan-400 dark:text-slate-950">
          {contact.avatar?.url ? (
            <img src={contact.avatar.url} alt="" className="h-full w-full object-cover" />
          ) : (
            getInitials(contact.name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="break-words text-3xl font-black text-slate-950 dark:text-white">
                {contact.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Last viewed: {formatDate(contact.lastViewedAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <a className={iconButton} href={getPhoneHref(primaryPhone?.number)} title="Call">
                <Phone className="h-4 w-4" />
              </a>
              <a
                className={iconButton}
                href={getWhatsAppHref(primaryPhone?.number)}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a className={iconButton} href={primaryEmail?.email ? `mailto:${primaryEmail.email}` : undefined} title="Email">
                <Mail className="h-4 w-4" />
              </a>
              <button className={iconButton} type="button" onClick={() => onFavorite(contact)} title="Favorite">
                <Star className={`h-4 w-4 ${contact.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
              <button className={iconButton} type="button" onClick={() => onEdit(contact)} title="Edit">
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                type="button"
                onClick={() => onDelete(contact)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Phone numbers
              </h3>
              <div className="space-y-2">
                {(contact.phoneNumbers || []).map((phone) => (
                  <div key={`${phone.label}-${phone.number}`} className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase text-slate-500">{phone.label}</span>
                      {phone.isPrimary && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200">Primary</span>}
                    </div>
                    <a className="mt-1 block break-all font-semibold text-slate-950 dark:text-slate-50" href={getPhoneHref(phone.number)}>
                      {phone.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Emails
              </h3>
              {(contact.emails || []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No emails saved
                </p>
              ) : (
                <div className="space-y-2">
                  {contact.emails.map((email) => (
                    <div key={`${email.label}-${email.email}`} className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase text-slate-500">{email.label}</span>
                        {email.isPrimary && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200">Primary</span>}
                      </div>
                      <a className="mt-1 block break-all font-semibold text-slate-950 dark:text-slate-50" href={`mailto:${email.email}`}>
                        {email.email}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <div className="flex gap-2 rounded-lg border border-slate-200 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/60">
              <BriefcaseBusiness className="mt-0.5 h-4 w-4 text-cyan-600" />
              <span className="break-words">{contact.company || 'No company'}</span>
            </div>
            <div className="flex gap-2 rounded-lg border border-slate-200 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/60">
              <MapPin className="mt-0.5 h-4 w-4 text-cyan-600" />
              <span className="break-words">{contact.address || 'No address'}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(contact.tags || []).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {tag}
              </span>
            ))}
            {contact.isFavorite && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                <Heart className="h-3.5 w-3.5 fill-current" />
                Favorite
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactDetails;
