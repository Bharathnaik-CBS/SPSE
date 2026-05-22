import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Moon, Sun } from 'lucide-react';
import AnalyticsCards from './components/AnalyticsCards';
import ContactDrawer from './components/ContactDrawer';
import DraftResumePopup from './components/DraftResumePopup';
import ImportExportModal from './components/ImportExportModal';
import ResultsPanel from './components/ResultsPanel';
import SearchBar from './components/SearchBar';
import SearchModeSwitcher from './components/SearchModeSwitcher';
import TagFilterChips from './components/TagFilterChips';
import { emptyDraft, useContactDraft } from './hooks/useContactDraft';
import { useDebounce } from './hooks/useDebounce';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { contactService } from './services/contactService';
import { digitsOnly, hasLetters, isFullTenDigitPhone } from './utils/phoneUtils';

const modes = ['name_number', 'email', 'company'];

const getBackendFilters = (selectedChips) => ({
  tags: selectedChips.filter((chip) => chip !== 'Favorite').map((chip) => chip.toLowerCase()),
  favorite: selectedChips.includes('Favorite'),
});

const normalizeContactForForm = (contact) => ({
  name: contact?.name || '',
  phoneNumbers:
    contact?.phoneNumbers?.length > 0
      ? contact.phoneNumbers.map((phone, index) => ({
          label: phone.label || 'Mobile',
          number: phone.number || '',
          isPrimary: Boolean(phone.isPrimary) || index === 0,
        }))
      : emptyDraft.phoneNumbers,
  emails:
    contact?.emails?.map((email, index) => ({
      label: email.label || 'Personal',
      email: email.email || '',
      isPrimary: Boolean(email.isPrimary) || index === 0,
    })) || [],
  company: contact?.company || '',
  address: contact?.address || '',
  tags: contact?.tags || [],
  isFavorite: Boolean(contact?.isFavorite),
  imageSrc: '',
});

const makeToastId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const ToastStack = ({ toasts, onRemove }) => (
  <div className="fixed right-4 top-4 z-[60] flex w-[min(92vw,24rem)] flex-col gap-2">
    {toasts.map((toast) => (
      <button
        key={toast.id}
        type="button"
        onClick={() => onRemove(toast.id)}
        className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold shadow-soft ${
          toast.type === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'
            : 'border-cyan-200 bg-white text-slate-800 dark:border-cyan-900 dark:bg-slate-900 dark:text-slate-100'
        }`}
      >
        {toast.message}
      </button>
    ))}
  </div>
);

const App = () => {
  const searchInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 280);
  const [mode, setMode] = useState('name_number');
  const [selectedChips, setSelectedChips] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [drawerInitial, setDrawerInitial] = useState(emptyDraft);
  const [editingContactId, setEditingContactId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importWorking, setImportWorking] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('phonebook-theme') === 'dark');
  const { draft, hasDraft, saveDraft, clearDraft } = useContactDraft();

  const filters = useMemo(() => getBackendFilters(selectedChips), [selectedChips]);

  const pushToast = useCallback((message, type = 'success') => {
    const id = makeToastId();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await contactService.getDashboardStats();
      setStats(response.data);
    } catch (_error) {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const refreshPanel = useCallback(async () => {
    setLoading(true);
    setPanelError('');
    try {
      const params = {
        ...filters,
        limit: 12,
      };

      const response = debouncedSearchTerm.trim()
        ? await contactService.getSuggestions({
            ...params,
            q: debouncedSearchTerm.trim(),
            mode,
          })
        : await contactService.getRecents(params);

      setContacts(response.data || []);
      setHighlightedIndex(0);
    } catch (error) {
      setContacts([]);
      setPanelError(error.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filters, mode]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    refreshPanel();
  }, [refreshPanel]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('phonebook-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    setSelectedContact(null);
  }, [debouncedSearchTerm, mode, selectedChips]);

  const openAddDrawer = useCallback((initial = emptyDraft) => {
    setDrawerMode('create');
    setEditingContactId(null);
    setDrawerInitial(initial);
    setServerError('');
    setDrawerOpen(true);
  }, []);

  const handlePlusClick = useCallback(() => {
    const value = searchTerm.trim();
    if (!value) {
      openAddDrawer(emptyDraft);
      return;
    }

    if (contacts.length > 0) {
      openAddDrawer(emptyDraft);
      return;
    }

    if (isFullTenDigitPhone(value)) {
      openAddDrawer({
        ...emptyDraft,
        phoneNumbers: [{ label: 'Mobile', number: digitsOnly(value), isPrimary: true }],
      });
      return;
    }

    if (hasLetters(value) || !digitsOnly(value)) {
      openAddDrawer({ ...emptyDraft, name: value });
      return;
    }

    openAddDrawer(emptyDraft);
  }, [contacts.length, openAddDrawer, searchTerm]);

  const selectContact = useCallback(async (contact) => {
    const id = contact.id || contact._id;
    if (!id) {
      return;
    }

    try {
      const response = await contactService.getContact(id);
      setSelectedContact(response.data);
      refreshPanel();
    } catch (error) {
      pushToast(error.message, 'error');
    }
  }, [pushToast, refreshPanel]);

  const editContact = useCallback((contact) => {
    setDrawerMode('edit');
    setEditingContactId(contact.id || contact._id);
    setDrawerInitial(normalizeContactForForm(contact));
    setServerError('');
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    if (drawerMode === 'create' && hasDraft) {
      pushToast('Draft saved');
    }
  }, [drawerMode, hasDraft, pushToast]);

  const submitContact = useCallback(
    async (payload, avatarBlob) => {
      setSaving(true);
      setServerError('');
      try {
        const response =
          drawerMode === 'edit' && editingContactId
            ? await contactService.updateContact(editingContactId, payload, avatarBlob)
            : await contactService.createContact(payload, avatarBlob);

        setDrawerOpen(false);
        setSelectedContact(response.data);
        clearDraft();
        pushToast(drawerMode === 'edit' ? 'Contact updated successfully' : 'Contact added successfully');
        refreshPanel();
        refreshStats();
      } catch (error) {
        const duplicate =
          error.status === 409 ||
          error.message.toLowerCase().includes('duplicate') ||
          error.errors?.duplicatePhoneNumbers;
        setServerError(error.message);
        pushToast(duplicate ? 'Duplicate phone number found' : error.message, 'error');
      } finally {
        setSaving(false);
      }
    },
    [clearDraft, drawerMode, editingContactId, pushToast, refreshPanel, refreshStats]
  );

  const deleteContact = useCallback(
    async (contact) => {
      const id = contact.id || contact._id;
      if (!id || !window.confirm(`Delete ${contact.name}?`)) {
        return;
      }

      try {
        await contactService.deleteContact(id);
        setSelectedContact(null);
        pushToast('Contact deleted');
        refreshPanel();
        refreshStats();
      } catch (error) {
        pushToast(error.message, 'error');
      }
    },
    [pushToast, refreshPanel, refreshStats]
  );

  const toggleFavorite = useCallback(
    async (contact) => {
      const id = contact.id || contact._id;
      try {
        const response = await contactService.setFavorite(id, !contact.isFavorite);
        setSelectedContact(response.data);
        pushToast(response.data.isFavorite ? 'Marked as favorite' : 'Removed from favorites');
        refreshPanel();
        refreshStats();
      } catch (error) {
        pushToast(error.message, 'error');
      }
    },
    [pushToast, refreshPanel, refreshStats]
  );

  const handleImport = useCallback(
    async (file) => {
      setImportWorking(true);
      try {
        const response = await contactService.importCsv(file);
        setImportResult(response.data);
        pushToast('CSV imported successfully');
        if (response.data.invalidRowsCount > 0) {
          pushToast('Invalid CSV row skipped', 'error');
        }
        if (response.data.skippedDuplicateCount > 0) {
          pushToast('Duplicate phone number found', 'error');
        }
        refreshPanel();
        refreshStats();
      } catch (error) {
        pushToast(error.message, 'error');
      } finally {
        setImportWorking(false);
      }
    },
    [pushToast, refreshPanel, refreshStats]
  );

  const handleExport = useCallback(async () => {
    try {
      const blob = await contactService.exportCsv();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'smart-phonebook-contacts.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      pushToast('CSV export started');
    } catch (error) {
      pushToast(error.message, 'error');
    }
  }, [pushToast]);

  const handleEscape = useCallback(() => {
    if (drawerOpen) {
      closeDrawer();
      return;
    }
    if (importOpen) {
      setImportOpen(false);
      return;
    }
    setSelectedContact(null);
    setHighlightedIndex(-1);
  }, [closeDrawer, drawerOpen, importOpen]);

  const handleEnter = useCallback(() => {
    if (highlightedIndex >= 0 && contacts[highlightedIndex]) {
      selectContact(contacts[highlightedIndex]);
    }
  }, [contacts, highlightedIndex, selectContact]);

  useKeyboardShortcuts({
    searchInputRef,
    onAdd: handlePlusClick,
    onEscape: handleEscape,
    onArrowDown: () => setHighlightedIndex((index) => Math.min(index + 1, contacts.length - 1)),
    onArrowUp: () => setHighlightedIndex((index) => Math.max(index - 1, 0)),
    onEnter: handleEnter,
    drawerOpen,
  });

  return (
    <div className="min-h-screen px-4 py-5 text-slate-950 dark:text-slate-50 sm:px-6 lg:px-8">
      <ToastStack toasts={toasts} onRemove={removeToast} />
      <main className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
              Smart Phonebook
            </p>
            <h1 className="text-2xl font-black sm:text-3xl">Search Engine</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/72 px-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900/72 dark:text-slate-200"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/72 text-slate-700 transition hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900/72 dark:text-slate-200"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <section className="space-y-4 py-2">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onAdd={handlePlusClick}
              inputRef={searchInputRef}
            />
            <SearchModeSwitcher
              mode={mode}
              onCycle={() => setMode((current) => modes[(modes.indexOf(current) + 1) % modes.length])}
            />
          </div>
          <TagFilterChips selected={selectedChips} onChange={setSelectedChips} />
        </section>

        <ResultsPanel
          searchTerm={debouncedSearchTerm}
          mode={mode}
          query={debouncedSearchTerm}
          contacts={contacts}
          selectedContact={selectedContact}
          highlightedIndex={highlightedIndex}
          loading={loading}
          error={panelError}
          onSelect={selectContact}
          onEdit={editContact}
          onDelete={deleteContact}
          onFavorite={toggleFavorite}
        />

        <AnalyticsCards stats={stats} loading={statsLoading} />
      </main>

      <ContactDrawer
        open={drawerOpen}
        mode={drawerMode}
        initialValues={drawerInitial}
        onClose={closeDrawer}
        onSubmit={submitContact}
        onDraftChange={saveDraft}
        saving={saving}
        serverError={serverError}
      />

      <DraftResumePopup
        visible={hasDraft && !drawerOpen}
        onOpen={() => openAddDrawer(draft || emptyDraft)}
        onDismiss={clearDraft}
      />

      <ImportExportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        onExport={handleExport}
        importResult={importResult}
        working={importWorking}
      />
    </div>
  );
};

export default App;
