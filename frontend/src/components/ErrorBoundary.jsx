import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
          <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-soft dark:border-rose-900 dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black">Frontend failed to render</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              The page caught a runtime error instead of staying blank. Refresh after the latest build is served.
            </p>
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-200">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 h-10 rounded-full bg-slate-950 px-5 text-sm font-bold text-white dark:bg-cyan-400 dark:text-slate-950"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
