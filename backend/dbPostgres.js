const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, 'seguranca.env')
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testarConexao() {
    try {
        const resultado = await pool.query('SELECT NOW()');
        console.log('PostgreSQL conectado com sucesso!');
        console.log('Horário:', resultado.rows[0].now);
    } catch (err) {
        console.error('Erro PostgreSQL:', err.message);
    }
}

module.exports = { pool, testarConexao };