'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send to observability layer (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // TODO: captureException(error, { extra: info.componentStack });
      console.error('[GlobalErrorBoundary] Unhandled error:', error.name);
    } else {
      console.error('[GlobalErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          fullPage
        />
      );
    }
    return this.props.children;
  }
}
