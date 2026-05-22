import { Download, Loader2, Upload, X } from 'lucide-react';

const ImportExportModal = ({
  open,
  onClose,
  onImport,
  onExport,
  importResult,
  working,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-soft dark:bg-slate-950 dark:text-slate-50">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
              CSV tools
            </p>
            <h2 className="text-2xl font-black">Import / Export</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-center transition hover:border-cyan-400 dark:border-slate-700">
            <Upload className="mb-2 h-6 w-6 text-cyan-600 dark:text-cyan-300" />
            <span className="font-bold">Import CSV</span>
            <span className="text-sm text-slate-500">Choose a .csv file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onImport(file);
                }
              }}
            />
          </label>
          <button
            type="button"
            onClick={onExport}
            className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-slate-200 p-4 text-center transition hover:border-cyan-400 dark:border-slate-700"
          >
            <Download className="mb-2 h-6 w-6 text-cyan-600 dark:text-cyan-300" />
            <span className="font-bold">Export CSV</span>
            <span className="text-sm text-slate-500">Download contacts</span>
          </button>
        </div>

        {working && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-cyan-50 p-3 text-sm font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing file
          </div>
        )}

        {importResult && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-black">{importResult.importedCount}</p>
                <p className="text-xs text-slate-500">Imported</p>
              </div>
              <div>
                <p className="text-xl font-black">{importResult.skippedDuplicateCount}</p>
                <p className="text-xs text-slate-500">Duplicates</p>
              </div>
              <div>
                <p className="text-xl font-black">{importResult.invalidRowsCount}</p>
                <p className="text-xs text-slate-500">Invalid</p>
              </div>
            </div>
            {importResult.invalidRows?.length > 0 && (
              <div className="scrollbar-thin mt-3 max-h-32 overflow-y-auto rounded-lg bg-slate-50 p-2 text-sm dark:bg-slate-900">
                {importResult.invalidRows.map((row) => (
                  <p key={`${row.rowNumber}-${row.reason}`}>
                    Row {row.rowNumber}: {row.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExportModal;
