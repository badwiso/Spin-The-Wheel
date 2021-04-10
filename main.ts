import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as url from 'url';

// Initialize remote module
require('@electron/remote/main').initialize();

const windows: BrowserWindow[] = [];
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  let win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      contextIsolation: false,  // false if you want to run 2e2 test with Spectron
      enableRemoteModule : true // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
    },
  });

  if (serve) {

    win.webContents.openDevTools();

    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');

  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    if(win===windows[0]) app.quit();
    else {
      windows.pop();
      windows[0].webContents.send('child','dead'); // signal the parent of child death
      win = null;
    }
  });
  win.setMenu(null);
  win.setMenuBarVisibility(false);
  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    setTimeout(()=>{
      if(windows.length===0) windows.push(createWindow());
    }, 400);
    ipcMain.on("parent",(_,msg)=>{ // to
      windows[0].webContents.send("child",msg); // from
    });
    ipcMain.on('kill',()=>{
      if(windows.length>1){
        windows[1].close();
      }
    });
    ipcMain.on('identity',(ev)=>{
      ev.sender.send('identity',windows[0].webContents.getProcessId()===ev.sender.getProcessId()?'parent':'child');
    });
    ipcMain.on('new',()=>{
      if(windows.length===1){
        windows.push(createWindow());
        windows[0].webContents.send('child','alive');
      } else{
        windows[1].focus();
      }

    });
    ipcMain.on("child",(_,msg)=>{
      if(windows.length===2) windows[1].webContents.send("parent",msg);
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (windows.length === 0) {
      windows.push(createWindow());
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
