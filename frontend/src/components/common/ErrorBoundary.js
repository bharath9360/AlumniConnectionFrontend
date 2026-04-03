import React from 'react';

/**
 * ErrorBoundary — catches unhandled render errors and shows a graceful fallback.
 * Wraps critical subtrees (messaging, admin panels) to prevent full-page crashes.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback, compact } = this.props;
      if (fallback) return fallback;

      if (compact) {
        return (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
            <i className="fas fa-exclamation-triangle mb-2" style={{ fontSize: '1.5rem', color: '#c84022' }}></i>
            <p className="mb-1 fw-semibold" style={{ fontSize: '0.9rem' }}>Something went wrong</p>
            <button
              className="btn btn-sm btn-outline-danger mt-1"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        );
      }

      return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
          <div className="text-center p-4" style={{ maxWidth: 480 }}>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
              style={{ width: 72, height: 72, backgroundColor: '#fff0ed' }}
            >
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#c84022' }}></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">Oops! Something went wrong</h4>
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
              An unexpected error occurred. Try refreshing the page or going back to the home screen.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-outline-danger"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </button>
              <button
                className="btn text-white"
                style={{ backgroundColor: '#c84022' }}
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-start">
                <summary className="text-muted small" style={{ cursor: 'pointer' }}>Error details (dev only)</summary>
                <pre className="mt-2 p-2 bg-white border rounded small text-danger overflow-auto" style={{ fontSize: '0.72rem' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
