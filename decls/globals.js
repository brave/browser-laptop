declare var chrome: Chrome;
declare class Chrome {
  ipc: IpcRenderer;
}
declare class IpcRenderer {
    on(msg: string, cb: (...args: any) => any): void;
    send(msg: string, ...args: any): void;
    sendToHost(msg: string, ...args: any): void;
}
declare var KeyEvent: any;
