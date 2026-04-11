declare module "miniprogram-automator" {
  interface LaunchOptions {
    /** Path to the miniprogram project (dist folder) */
    projectPath: string;
    /** Path to WeChat DevTools CLI */
    cliPath?: string;
    /** DevTools port (default: 9420) */
    port?: number;
  }

  interface ConsoleMessage {
    type: "log" | "info" | "warn" | "error";
    args: unknown[];
  }

  interface MiniProgram {
    /** Close the miniprogram */
    close(): Promise<void>;
    /** Listen for events */
    on(event: "console", callback: (msg: ConsoleMessage) => void): void;
    on(event: "error", callback: (error: Error) => void): void;
    /** Navigate to a page */
    reLaunch(url: string): Promise<Page>;
    /** Navigate to a page */
    navigateTo(url: string): Promise<Page>;
    /** Get current page */
    currentPage(): Promise<Page>;
    /** Call wx API */
    callWxMethod(method: string, ...args: unknown[]): Promise<unknown>;
    /** Get system info */
    systemInfo(): Promise<Record<string, unknown>>;
  }

  interface Page {
    /** Page path */
    path: string;
    /** Query selector */
    $(selector: string): Promise<Element | null>;
    /** Query selector all */
    $$(selector: string): Promise<Element[]>;
    /** Wait for selector */
    waitFor(selector: string | number | (() => boolean)): Promise<void>;
    /** Get page data */
    data(): Promise<Record<string, unknown>>;
    /** Set page data */
    setData(data: Record<string, unknown>): Promise<void>;
    /** Call page method */
    callMethod(method: string, ...args: unknown[]): Promise<unknown>;
  }

  interface Element {
    /** Get element tagName */
    tagName: string;
    /** Query selector within element */
    $(selector: string): Promise<Element | null>;
    /** Query selector all within element */
    $$(selector: string): Promise<Element[]>;
    /** Tap the element */
    tap(): Promise<void>;
    /** Long press the element */
    longpress(): Promise<void>;
    /** Input text */
    input(text: string): Promise<void>;
    /** Get element text */
    text(): Promise<string>;
    /** Get element attribute */
    attribute(name: string): Promise<string | null>;
    /** Get element property */
    property(name: string): Promise<unknown>;
    /** Get element wxml */
    wxml(): Promise<string>;
    /** Get outer wxml */
    outerWxml(): Promise<string>;
    /** Get element value */
    value(): Promise<string>;
    /** Trigger event */
    trigger(type: string, detail?: Record<string, unknown>): Promise<void>;
  }

  const automator: {
    launch(options: LaunchOptions): Promise<MiniProgram>;
  };

  export default automator;
}
