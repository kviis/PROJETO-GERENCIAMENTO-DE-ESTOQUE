const { pool } = require('../dbPostgres');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// criar login
async function criarlogin(req, res) {
    const { email, senha } = req.body;
    const saltRounds = 10;

    if (!email || !senha) {
        return res.status(401).json({ erro: "preenchimento dos campos necessarios" });
    }

    try {
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        await pool.query(
            'INSERT INTO usuarios(email, senha) VALUES($1, $2)',
            [email, senhaCriptografada]
        );

        return res.status(201).json({ message: "usuario criado" });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({
                message: "usuario ja existe, tente um diferente por favor"
            });
        }

        return res.status(500).json({
            erro: "erro ao criar usuario: " + err.message
        });
    }
}

// login
async function logarSistema(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json("login e senhas necessarios");
    }

    try {
        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE email=$1',
            [email]
        );

        const usuario = resultado.rows[0];

        if (!usuario) {
            return res.status(400).json({ erro: "usuario nao existe" });
        }

        const validSenha = await bcrypt.compare(senha, usuario.senha);

        if (!validSenha) {
            return res.status(400).json("senha incorreta");
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            mensagem: "login realizado com sucesso",
            token
        });
    } catch (err) {
        return res.status(500).json({
            erro: "erro ao logar: " + err.message
        });
    }
}

// listar estoque
async function listarEstoque(req, res) {
    try {
        const resultado = await pool.query(
            'SELECT * FROM estoque ORDER BY id'
        );

        return res.status(200).json(resultado.rows);
    } catch (err) {
        return res.status(500).json({
            erro: "erro ao listar itens: " + err.message
        });
    }
}

// cadastrar produto / adicionar entrada
async function cadastrarItem(req, res) {
    const { nome, quantidade, validade } = req.body;

    if (!nome || !quantidade) {
        return res.status(400).json({
            erro: "preencha os campos necessarios"
        });
    }

    const qtd = Number(quantidade);

    if (!Number.isFinite(qtd) || qtd <= 0) {
        return res.status(400).json({
            erro: "quantidade invalida"
        });
    }

    try {
        const resultado = await pool.query(
            'SELECT * FROM estoque WHERE nome=$1',
            [nome]
        );

        const existente = resultado.rows[0];

        if (existente) {
            const novaQuantidade = existente.quantidade + qtd;

            await pool.query(
                `UPDATE estoque
                 SET quantidade=$1, validade=$2
                 WHERE id=$3`,
                [
                    novaQuantidade,
                    validade || existente.validade,
                    existente.id
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO estoque(nome, quantidade, validade)
                 VALUES($1, $2, $3)`,
                [nome, qtd, validade || null]
            );
        }

        await pool.query(
            `INSERT INTO movimentacoes
            (produto, quantidade, tipo, data)
            VALUES($1, $2, $3, CURRENT_TIMESTAMP)`,
            [nome, qtd, 'entrada']
        );

        return res.status(201).json({
            message: existente
                ? "quantidade adicionada ao estoque"
                : "cadastro feito com sucesso"
        });
    } catch (err) {
        return res.status(500).json({
            erro: "erro ao cadastrar produto: " + err.message
        });
    }
}

// editar item completo
async function editarItens(req, res) {
    const { id } = req.params;
    const { nome, quantidade, validade } = req.body;
    const qtd = Number(quantidade);

    if (!nome || !Number.isInteger(qtd) || qtd < 0) {
        return res.status(400).json({
            erro: "Nome e quantidade válida são obrigatórios."
        });
    }

    try {
        const resultado = await pool.query(
            'SELECT * FROM estoque WHERE id=$1',
            [id]
        );

        const item = resultado.rows[0];

        if (!item) {
            return res.status(404).json({
                erro: "Item não encontrado."
            });
        }

        await pool.query(
            `UPDATE estoque
             SET nome=$1, quantidade=$2, validade=$3
             WHERE id=$4`,
            [nome, qtd, validade || null, id]
        );

        return res.status(200).json({
            message: "Item atualizado com sucesso."
        });

    } catch (err) {
        return res.status(500).json({
            erro: "Erro ao editar item: " + err.message
        });
    }
}
// editar item parcialmente
async function editarItenParcial(req, res) {
    const { id } = req.params;
    const { nome, quantidade, validade } = req.body;

    try {
        const resultado = await pool.query(
            'SELECT * FROM estoque WHERE id=$1',
            [id]
        );

        const item = resultado.rows[0];

        if (!item) {
            return res.status(404).json({
                erro: "item nao encontrado"
            });
        }

        const novoNome = nome ?? item.nome;
        const novaQuantidade = quantidade ?? item.quantidade;
        const novaValidade = validade ?? item.validade;

        await pool.query(
            `UPDATE estoque
             SET nome=$1, quantidade=$2, validade=$3
             WHERE id=$4`,
            [novoNome, novaQuantidade, novaValidade, id]
        );

        return res.status(200).json({
            message: "item atualizado"
        });
    } catch (err) {
        return res.status(500).json({
            erro: "erro ao editar item: " + err.message
        });
    }
}

// listar movimentações
async function listarMovimentacoes(req, res) {
    try {
        const resultado = await pool.query(
            'SELECT * FROM movimentacoes ORDER BY data DESC'
        );

        return res.status(200).json(resultado.rows);
    } catch (err) {
        return res.status(500).json({
            erro: "erro ao listar movimentacoes: " + err.message
        });
    }
}

// registrar entrada ou saída
async function registrarMovimentacao(req, res) {
    const { produto, quantidade, tipo, comprador } = req.body;

    if (!produto || !quantidade || !tipo) {
        return res.status(400).json({
            erro: "preencha todos os campos"
        });
    }

    if (tipo !== 'entrada' && tipo !== 'saida') {
        return res.status(400).json({
            erro: "tipo deve ser 'entrada' ou 'saida'"
        });
    }

    if (tipo === 'saida' && !comprador) {
        return res.status(400).json({
            erro: "informe comprador para registrar a saida"
        });
    }

    const qtd = Number(quantidade);

    if (!Number.isFinite(qtd) || qtd <= 0) {
        return res.status(400).json({
            erro: "quantidade invalida"
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const resultado = await client.query(
            `SELECT * FROM estoque
             WHERE nome=$1
             FOR UPDATE`,
            [produto]
        );

        const item = resultado.rows[0];

        if (!item) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                erro: "produto nao encontrado no estoque"
            });
        }

        if (tipo === 'saida' && item.quantidade < qtd) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                erro: "quantidade em estoque insuficiente"
            });
        }

        const novaQuantidade = tipo === 'entrada'
            ? item.quantidade + qtd
            : item.quantidade - qtd;

        await client.query(
            `UPDATE estoque
             SET quantidade=$1
             WHERE id=$2`,
            [novaQuantidade, item.id]
        );

        await client.query(
            `INSERT INTO movimentacoes
            (produto, quantidade, tipo, comprador, data)
            VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [
                produto,
                qtd,
                tipo,
                comprador || null
            ]
        );

        await client.query('COMMIT');

        return res.status(201).json({
            mensagem: "movimentacao registrada com sucesso"
        });
    } catch (err) {
        await client.query('ROLLBACK');

        return res.status(500).json({
            erro: "erro ao registrar movimentacao: " + err.message
        });
    } finally {
        client.release();
    }
}

// ranking de compradores
async function listaCompradores(req, res) {
    try {
        const resultado = await pool.query(`
            SELECT
                comprador,
                COUNT(*) AS "totalCompras",
                SUM(quantidade) AS "totalItens"
            FROM movimentacoes
            WHERE tipo='saida'
              AND comprador IS NOT NULL
              AND comprador!=''
            GROUP BY comprador
            ORDER BY "totalCompras" DESC
        `);

        return res.status(200).json(resultado.rows);
    } catch (err) {
        return res.status(500).json({
            erro: "erro ao listar compradores: " + err.message
        });
    }
}
async function deletarItem(req,res){

    const {id}= req.params;
    const client = await pool.connect();
    
    try {
        
         await client.query("BEGIN");
//procura o item
         const resultado = await client.query("SELECT * FROM estoque WHERE id=$1",[id]);

         const item = resultado.rows[0];

         if(!item){

            await client.query("ROLLBACK");
            return res.status(404).json({erro:"item nao encontrado"});

         }
         
        // remove do estoque
        await client.query("DELETE FROM estoque WHERE id = $1",[id]);
        
        //salva no historico 
        await client.query(`INSERT INTO movimentacoes
            (produto, quantidade, tipo, comprador, data)
            VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP)`,
            [
                item.nome,
                item.quantidade,
                "saida",
                "ITEM EXCLUÍDO"
            ])
            await client.query("COMMIT");

            return res.status(200).json({message:"produto excluido com sucesso"});

        } catch (err){
            await client.query("ROLLBACK")
            return res.status(500).json({erro: err.message});

        } finally {client.release();
    
    }


    }



module.exports = {
    criarlogin,
    logarSistema,
    listarEstoque,
    cadastrarItem,
    editarItens,
    editarItenParcial,
    listarMovimentacoes,
    registrarMovimentacao,
    listaCompradores,
    deletarItem
};