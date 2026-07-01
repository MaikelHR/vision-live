import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Catches render-time crashes so a thrown error shows a recoverable screen
// instead of a blank page. Error boundaries have to be class components.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crashed:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center gap-4 px-5 py-16 text-center">
        <h1 className="font-display text-2xl text-signal">Something broke</h1>
        <p className="font-mono text-sm text-muted">
          The app hit an unexpected error. Reloading usually fixes it.
        </p>
        <pre className="max-w-full overflow-auto rounded-lg border border-line bg-surface p-3 text-left font-mono text-xs text-muted">
          {error.message}
        </pre>
        <button
          onClick={() => location.reload()}
          className="rounded-lg bg-signal px-4 py-2 font-mono text-sm font-semibold text-ink transition hover:brightness-110"
        >
          Reload
        </button>
      </div>
    );
  }
}
