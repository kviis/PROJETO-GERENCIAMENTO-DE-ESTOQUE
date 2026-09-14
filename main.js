const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
process.on('uncaughtException', (err) => {
    console.error('Erro não tratado:', err);
});

async function criarJanela() {
    try {
        const janela = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 900,
            minHeight: 600,
            
             icon: path.join(__dirname, 'build', 'icon.ico'),

            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        await janela.loadURL(
            'https://projeto-gerenciamento-de-estoque.onrender.com'
        );
    } catch (err) {
        console.error('Erro ao iniciar o sistema:', err);

        dialog.showErrorBox(
            'Erro ao iniciar o Sistema de Estoque',
            `Não foi possível conectar ao sistema online.\n\n${err.message}`
        );
    }
}

app.whenReady().then(() => {
    criarJanela();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            criarJanela();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});