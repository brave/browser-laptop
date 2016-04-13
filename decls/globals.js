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
declare module electron {
  declare var BrowserWindow: any;
  declare var ipcMain: any;
  declare var dialog: any;
  declare var clipboard: any;
  declare var app: any;
}
