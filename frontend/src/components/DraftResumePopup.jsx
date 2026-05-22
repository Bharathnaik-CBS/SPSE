import { FilePenLine, X } from 'lucide-react';

const DraftResumePopup = ({ visible, onOpen, onDismiss }) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-30 w-[min(92vw,26rem)] -translate-x-1/2 rounded-2xl border border-cyan-200 bg-white p-3 shadow-soft dark:border-cyan-800 dark:bg-slate-900 dark:shadow-soft-dark">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Dismiss draft"
      >
        <X className="h-4 w-4" />
      </button>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 pr-8 text-left">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200">
          <FilePenLine className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-slate-950 dark:text-white">Unfinished contact exists</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Open the saved draft and continue.</p>
        </div>
      </button>
    </div>
  );
};

export default DraftResumePopup;
