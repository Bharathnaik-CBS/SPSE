import { useEffect, useMemo, useState } from 'react';
import { Check, Heart, Loader2, Plus, Trash2, X } from 'lucide-react';
import AvatarCropper from './AvatarCropper';
import { emptyDraft } from '../hooks/useContactDraft';

const makePhone = () => ({ label: 'Mobile', number: '', isPrimary: false });
const makeEmail = () => ({ label: 'Personal', email: '', isPrimary: false });

const normalizeInitial = (initial) => ({
  ...emptyDraft,
  ...initial,
  phoneNumbers:
    initial?.phoneNumbers?.length > 0 ? initial.phoneNumbers : [{ label: 'Mobile', number: '', isPrimary: true }],
  emails: initial?.emails || [],
  tags: initial?.tags || [],
  imageSrc: initial?.imageSrc || '',
});

const ContactDrawer = ({
  open,
  mode = 'create',
  initialValues,
  onClose,
  onSubmit,
  onDraftChange,
  saving,
  serverError,
}) => {
  const [form, setForm] = useState(() => normalizeInitial(initialValues));
  const [errors, setErrors] = useState({});
  const [avatarBlob, setAvatarBlob] = useState(null);
  const title = mode === 'edit' ? 'Edit contact' : 'Add contact';

  useEffect(() => {
    if (open) {
      setForm(normalizeInitial(initialValues));
      setAvatarBlob(null);
      setErrors({});
    }
  }, [initialValues, open]);

  useEffect(() => {
    if (open && mode === 'create') {
      onDraftChange?.(form);
    }
  }, [form, mode, onDraftChange, open]);

  const payload = useMemo(
    () => ({
      name: form.name.trim(),
      phoneNumbers: form.phoneNumbers
        .filter((phone) => phone.number.trim())
        .map((phone, index) => ({
          label: phone.label || 'Mobile',
          number: phone.number.trim(),
          isPrimary: Boolean(phone.isPrimary) || index === 0,
        })),
      emails: form.emails
        .filter((email) => email.email.trim())
        .map((email, index) => ({
          label: email.label || 'Personal',
          email: email.email.trim(),
          isPrimary: Boolean(email.isPrimary) || index === 0,
        })),
      company: form.company.trim(),
      address: form.address.trim(),
      tags: form.tags.map((tag) => tag.trim()).filter(Boolean),
      isFavorite: Boolean(form.isFavorite),
    }),
    [form]
  );

  const validate = () => {
    const nextErrors = {};
    if (!payload.name) {
      nextErrors.name = 'Name is required.';
    }

    if (!payload.phoneNumbers.some((phone) => phone.number)) {
      nextErrors.phoneNumbers = 'At least one phone number is required.';
    }

    const invalidEmail = payload.emails.find((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email));
    if (invalidEmail) {
      nextErrors.emails = 'Enter a valid email or leave it blank.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    await onSubmit(payload, avatarBlob);
  };

  const updatePhone = (index, patch) => {
    setForm((current) => ({
      ...current,
      phoneNumbers: current.phoneNumbers.map((phone, itemIndex) =>
        itemIndex === index ? { ...phone, ...patch } : phone
      ),
    }));
  };

  const updateEmail = (index, patch) => {
    setForm((current) => ({
      ...current,
      emails: current.emails.map((email, itemIndex) =>
        itemIndex === index ? { ...email, ...patch } : email
      ),
    }));
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-950/35 backdrop-blur-sm sm:items-stretch sm:justify-end">
      <aside className="max-h-[96vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-soft dark:bg-slate-950 dark:text-slate-50 sm:max-h-none sm:max-w-xl sm:rounded-l-3xl sm:rounded-tr-none sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
              Quick add
            </p>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900"
            />
            {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Phone numbers</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, phoneNumbers: [...form.phoneNumbers, makePhone()] })}
                className="inline-flex items-center gap-1 text-sm font-bold text-cyan-700 dark:text-cyan-300"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {form.phoneNumbers.map((phone, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-[8rem_1fr_auto_auto]">
                  <input
                    value={phone.label}
                    onChange={(event) => updatePhone(index, { label: event.target.value })}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Label"
                  />
                  <input
                    value={phone.number}
                    onChange={(event) => updatePhone(index, { number: event.target.value })}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Phone number"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        phoneNumbers: form.phoneNumbers.map((item, itemIndex) => ({
                          ...item,
                          isPrimary: itemIndex === index,
                        })),
                      })
                    }
                    className={`h-10 rounded-lg px-3 text-sm font-bold ${phone.isPrimary ? 'bg-cyan-500 text-slate-950' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'}`}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        phoneNumbers: form.phoneNumbers.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                    disabled={form.phoneNumbers.length === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-rose-600 disabled:opacity-35"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {errors.phoneNumbers && <p className="mt-1 text-sm text-rose-600">{errors.phoneNumbers}</p>}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Emails</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, emails: [...form.emails, makeEmail()] })}
                className="inline-flex items-center gap-1 text-sm font-bold text-cyan-700 dark:text-cyan-300"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {form.emails.map((email, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-[8rem_1fr_auto_auto]">
                  <input
                    value={email.label}
                    onChange={(event) => updateEmail(index, { label: event.target.value })}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Label"
                  />
                  <input
                    value={email.email}
                    onChange={(event) => updateEmail(index, { email: event.target.value })}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Email"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        emails: form.emails.map((item, itemIndex) => ({
                          ...item,
                          isPrimary: itemIndex === index,
                        })),
                      })
                    }
                    className={`h-10 rounded-lg px-3 text-sm font-bold ${email.isPrimary ? 'bg-cyan-500 text-slate-950' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'}`}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, emails: form.emails.filter((_, itemIndex) => itemIndex !== index) })}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {errors.emails && <p className="mt-1 text-sm text-rose-600">{errors.emails}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Company</label>
              <input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Tags</label>
              <input value={form.tags.join(', ')} onChange={(event) => setForm({ ...form, tags: event.target.value.split(',') })} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" placeholder="family, work" />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Address</label>
            <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
          </div>

          <AvatarCropper
            imageSrc={form.imageSrc}
            onImageSelected={(file) => {
              const reader = new FileReader();
              reader.onload = () => setForm((current) => ({ ...current, imageSrc: reader.result }));
              reader.readAsDataURL(file);
            }}
            onCropped={setAvatarBlob}
            onClear={() => {
              setAvatarBlob(null);
              setForm((current) => ({ ...current, imageSrc: '' }));
            }}
          />

          <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.isFavorite}
              onChange={(event) => setForm({ ...form, isFavorite: event.target.checked })}
              className="h-4 w-4 accent-cyan-500"
            />
            <Heart className="h-4 w-4" />
            Favorite
          </label>

          {serverError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {serverError}
            </div>
          )}

          <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:-mx-6 sm:px-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 font-bold text-white transition hover:bg-cyan-600 disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save
            </button>
            <button type="button" onClick={onClose} className="h-11 rounded-full border border-slate-200 px-5 font-bold dark:border-slate-700">
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};

export default ContactDrawer;
