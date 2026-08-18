import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./Button";
import { logErrorEvent } from "../services/auditLogger";
import { reportApplicationError } from "../services/errorMonitorService";
import { isDeveloperAccount } from "../utils/errorUtils";

interface Props {
  children: ReactNode;
  userId?: string;
  userEmail?: string;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught UI error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });

    // Read current user context
    const userCtx = (window as any).__CURRENT_USER_CONTEXT__ || {};
    const userId = this.props.userId || userCtx.userId;
    const userEmail = this.props.userEmail || userCtx.userEmail;
    const screen = this.props.screenName || userCtx.screenName || "UI Workspace Component";

    logErrorEvent(
      userId,
      userEmail,
      screen,
      "UI Component Crash / Render Exception",
      error,
      "ui"
    );

    reportApplicationError({
      rawError: error,
      pageRoute: screen,
      action: "UI Component Render Crash",
      userId,
      userEmail
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const userCtx = (window as any).__CURRENT_USER_CONTEXT__ || {};
      const currentUserEmail = this.props.userEmail || userCtx.userEmail;
      const isDev = isDeveloperAccount(currentUserEmail);

      let errorMessage = "An error occurred. Please try again or contact support.";
      let isFirebaseError = false;

      if (isDev) {
        try {
          if (this.state.error?.message) {
            const parsed = JSON.parse(this.state.error.message);
            if (parsed.error && parsed.operationType) {
              isFirebaseError = true;
              errorMessage = `Database Error: ${parsed.error} during ${parsed.operationType} operation.`;
            }
          }
        } catch (e) {
          errorMessage = this.state.error?.message || errorMessage;
        }
      }

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-8 text-center text-zinc-100">
            <div className="w-16 h-16 bg-red-950/60 border border-red-800/80 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Application Exception Caught</h1>
            <p className="text-zinc-400 mb-6 leading-relaxed text-sm">
              {errorMessage}
            </p>

            <div className="space-y-3 mb-6">
              <Button onClick={this.handleReset} className="w-full justify-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Application
              </Button>
              {isDev && isFirebaseError && (
                <p className="text-xs text-zinc-500">
                  This might be due to missing database permissions or configuration.
                </p>
              )}
            </div>

            {isDev && (
              <div className="border-t border-zinc-800 pt-4 text-left">
                <button
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-200 flex items-center justify-between w-full py-1 cursor-pointer"
                >
                  <span>Error Diagnostics & Stack Trace</span>
                  {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {this.state.showDetails && (
                  <div className="mt-2 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] font-mono text-red-300 max-h-48 overflow-auto leading-relaxed">
                    <p className="font-bold text-red-400 mb-1">{this.state.error?.name}: {this.state.error?.message}</p>
                    <pre className="whitespace-pre-wrap text-zinc-400 text-[10px]">{this.state.error?.stack || this.state.errorInfo?.componentStack || "No stack trace available."}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

