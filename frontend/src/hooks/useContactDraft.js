import { useCallback, useEffect, useMemo, useState } from 'react';
import { safeStorage } from '../utils/safeStorage';

const DRAFT_KEY = 'smart-phonebook-contact-draft';

const hasMeaningfulDraft = (draft) => {
  if (!draft) {
    return false;
  }

  const phones = draft.phoneNumbers || [];
  const emails = draft.emails || [];
  const tags = draft.tags || [];

  return Boolean(
    draft.name ||
      draft.company ||
      draft.address ||
      draft.imageSrc ||
      phones.some((phone) => phone.number || phone.label !== 'Mobile') ||
      emails.some((email) => email.email || email.label !== 'Personal') ||
      tags.some(Boolean)
  );
};

export const emptyDraft = {
  name: '',
  phoneNumbers: [{ label: 'Mobile', number: '', isPrimary: true }],
  emails: [],
  company: '',
  address: '',
  tags: [],
  isFavorite: false,
  imageSrc: '',
};

export const useContactDraft = () => {
  const [draft, setDraft] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    try {
      const raw = safeStorage.getItem(DRAFT_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (hasMeaningfulDraft(parsed)) {
        setDraft(parsed);
        setHasDraft(true);
      }
    } catch (_error) {
      safeStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const saveDraft = useCallback((nextDraft) => {
    if (!hasMeaningfulDraft(nextDraft)) {
      safeStorage.removeItem(DRAFT_KEY);
      setDraft(null);
      setHasDraft(false);
      return false;
    }

    safeStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
    setDraft(nextDraft);
    setHasDraft(true);
    return true;
  }, []);

  const clearDraft = useCallback(() => {
    safeStorage.removeItem(DRAFT_KEY);
    setDraft(null);
    setHasDraft(false);
  }, []);

  return useMemo(
    () => ({ draft, hasDraft, saveDraft, clearDraft }),
    [clearDraft, draft, hasDraft, saveDraft]
  );
};
