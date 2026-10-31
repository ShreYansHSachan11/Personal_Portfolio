import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { failed: boolean }

/**
 * Contains failures from the lazily loaded WebGL scene (chunk load errors,
 * missing WebGL support) so the rest of the page keeps working. The gradient
 * halo behind the canvas remains as a graceful fallback.
 */
export class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[HeroBlob] 3D scene failed to render", error, info.componentStack);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
