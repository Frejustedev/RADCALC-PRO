import React from 'react';

interface State {
  error: Error | null;
}

/** Root error boundary — a stray throw must never blank the whole clinical tool. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RadCalc] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#e2e8f0', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Une erreur est survenue</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
            L'application a rencontré un problème inattendu. Vos données enregistrées ne sont pas affectées.
          </p>
          <button
            onClick={() => window.location.assign('/')}
            style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }
}
