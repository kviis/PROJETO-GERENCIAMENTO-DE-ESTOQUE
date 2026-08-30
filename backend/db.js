// conectando ao bando de dados mysql

const Database = require('better-sqlite3');

const DB = new Database('estoque.db');

 DB.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS estoque (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    validade   TEXT
);


CREATE TABLE IF NOT EXISTS movimentacoes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    produto    TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    tipo       TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
    data       TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = DB
