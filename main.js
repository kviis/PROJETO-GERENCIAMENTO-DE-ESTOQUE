const {
    app,
    BrowserWindow,
    dialog
} = require('electron');

const path = require('path');

let servidorPronto;


// ==========================================
// ERROS
// ==========================================

process.on('uncaughtException', (err) => {

    console.error(
        'Erro não tratado:',
        err
    );

});


// ==========================================
// CRIAR JANELA
// ==========================================

async function criarJanela() {

    try {

        // Aguarda o backend iniciar
        await servidorPronto;

        console.log(
            'Backend iniciado com sucesso.'
        );


        const janela = new BrowserWindow({

            width: 1200,
            height: 800,

            minWidth: 900,
            minHeight: 600,

            webPreferences: {

                contextIsolation: true,
                nodeIntegration: false

            }

        });


        await janela.loadURL(
            'http://localhost:3000/index.html'
        );


    } catch (err) {

        console.error(
            'Erro ao iniciar o sistema:',
            err
        );


        dialog.showErrorBox(

            'Erro ao iniciar o Sistema de Estoque',

            `Não foi possível iniciar o sistema.\n\n${err.message}`

        );

    }

}


// ==========================================
// ELECTRON
// ==========================================

app.whenReady().then(() => {

    try {

        // Pasta de dados do usuário
        const pastaDados =
            app.getPath('userData');


        // Caminho do banco
        const caminhoBanco =
            path.join(
                pastaDados,
                'estoque.db'
            );


        // Envia o caminho para o backend
        process.env.DB_PATH =
            caminhoBanco;


        console.log(
            'CAMINHO DO BANCO:',
            process.env.DB_PATH
        );


        // IMPORTANTE:
        // backend só é carregado depois
        // de definir DB_PATH
        servidorPronto =
            require('./backend/server.js');


        criarJanela();


    } catch (err) {

        console.error(
            'Erro ao carregar backend:',
            err
        );


        dialog.showErrorBox(

            'Erro ao iniciar backend',

            err.message

        );

    }

});


// ==========================================
// FECHAR APLICAÇÃO
// ==========================================

app.on(
    'window-all-closed',
    () => {

        if (
            process.platform !== 'darwin'
        ) {

            app.quit();

        }

    }
);