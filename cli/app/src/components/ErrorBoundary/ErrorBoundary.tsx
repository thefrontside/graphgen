import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = {
    error: '',
    errorInfo: '',
    hasError: false,
  };
  static getDerivedStateFromError(error: Error) {
    console.error(error)
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.log({ error, errorInfo });
    this.setState({ errorInfo });
  }

  render() {
    const { hasError, errorInfo } = this.state;
    if (hasError) {
      return (
        <div className="card my-5">
          {errorInfo && errorInfo.componentStack.toString()}
        </div>
      );
    }
  }
}