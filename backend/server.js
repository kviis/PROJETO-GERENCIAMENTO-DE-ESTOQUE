const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, 'seguranca.env')
});

const app = express();
const routes = require('./routes/rotas.routes');
const { pool } = require('./dbPostgres');

const port = process.env.PORT || 3000;

// CORS
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5501',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]
}));

app.use(express.json());

// SERVIR FRONTEND
app.use(
    express.static(
        path.join(__dirname, '..', 'frontend')
    )
);

// ROTAS
app.use('/', routes);

// TESTAR POSTGRES E INICIAR SERVIDOR
const servidorPronto = pool.query('SELECT NOW()')
    .then(() => {
        console.log('PostgreSQL conectado. Iniciando servidor...');

        return new Promise((resolve, reject) => {
            const servidor = app.listen(port, () => {
                console.log(`Servidor rodando na porta ${port}`);
                resolve(servidor);
            });

            servidor.on('error', reject);
        });
    })
    .catch((err) => {
        console.error('Erro ao conectar ao PostgreSQL:', err);
        throw err;
    });

module.exports = servidorPronto;