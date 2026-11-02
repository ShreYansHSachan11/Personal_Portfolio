import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { failed: boolean }

/**
 * Contains failures from the lazily loaded hero folder (e.g. a chunk that fails
 * to download) so the rest of the page keeps working without it.
 */
export class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[HoloFolder] hero folder failed to render", error, info.componentStack);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
