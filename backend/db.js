const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');


// ==========================================
// CAMINHO DO BANCO
// ==========================================

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'estoque.db');


console.log('DB_PATH recebido pelo db.js:', DB_PATH);


let sqlDb = null;


// ==========================================
// SALVAR BANCO
// ==========================================

function salvar() {

    const dados = sqlDb.export();

    fs.writeFileSync(
        DB_PATH,
        Buffer.from(dados)
    );

}
// ==========================================
// TRANSFORMAR SELECT EM OBJETOS
// ==========================================

function statementParaObjetos(stmt) {

    const linhas = [];

    while (stmt.step()) {

        linhas.push(
            stmt.getAsObject()
        );
    }
    stmt.free();
    return linhas;
}
// ==========================================
// PREPARE
// ==========================================

function prepare(sql) {

    return {run(...params) {

            const stmt = sqlDb.prepare(sql);

            stmt.bind(params);
            stmt.step();
            stmt.free();

            salvar();

            return {};

        },


        get(...params) {

            const stmt = sqlDb.prepare(sql);

            stmt.bind(params);

            const linhas =
                statementParaObjetos(stmt);

            return linhas[0];

        },


        all(...params) {

            const stmt = sqlDb.prepare(sql);

            stmt.bind(params);

            return statementParaObjetos(stmt);

        }

    };

}


// ==========================================
// INICIAR BANCO
// ==========================================

async function iniciar() {

    console.log(
        'Iniciando banco em:',
        DB_PATH
    );


    // Descobre a pasta onde o banco ficará
    const pastaBanco =
        path.dirname(DB_PATH);


    // Cria a pasta caso ela não exista
    if (!fs.existsSync(pastaBanco)) {

        fs.mkdirSync(
            pastaBanco,
            {
                recursive: true
            }
        );

    }


    const SQL = await initSqlJs();


    // ======================================
    // ABRIR OU CRIAR BANCO
    // ======================================

    if (fs.existsSync(DB_PATH)) {

        console.log(
            'Banco existente encontrado.'
        );

        const arquivo =
            fs.readFileSync(DB_PATH);

        sqlDb =
            new SQL.Database(arquivo);

    } else {

        console.log(
            'Banco não existe. Criando novo banco.'
        );

        sqlDb =
            new SQL.Database();

    }

//tabelas de migrações 
  
  function colunaExiste(tabela, coluna){
     const stmt = sqlDb.prepare(`PRAGMA table_info(${tabela})`);
     const colunas = statementParaObjetos(stmt);
     return  colunas.some(c => c.name === coluna);
}
function rodarMigracoes(){
    if(!colunaExiste('movimentacoes', 'comprador')){
        console.log('migração: adicionada coluna "comprador" em movimentacoes...');
        sqlDb.run('ALTER TABLE movimentacoes ADD COLUMN comprador TEXT');
        salvar();
    }

} 
    // ======================================
    // CRIAR TABELAS
    // ======================================

    sqlDb.run(`

        CREATE TABLE IF NOT EXISTS usuarios (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            email TEXT NOT NULL UNIQUE,

            senha TEXT NOT NULL

        );


        CREATE TABLE IF NOT EXISTS estoque (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            nome TEXT NOT NULL,

            quantidade INTEGER NOT NULL DEFAULT 0,

            validade TEXT

        );


        CREATE TABLE IF NOT EXISTS movimentacoes (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            produto TEXT NOT NULL,

            quantidade INTEGER NOT NULL,

            tipo TEXT NOT NULL
                CHECK (
                    tipo IN ('entrada', 'saida')
                ),
            
            comprador TEXT,

            data TEXT NOT NULL
                DEFAULT (datetime('now'))

        );

    `);
     
    rodarMigracoes();

    salvar();


    console.log(
        'Banco de dados pronto em:',
        DB_PATH
    );

}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    prepare,
    iniciar
};