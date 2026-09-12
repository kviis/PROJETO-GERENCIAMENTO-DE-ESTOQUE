const express = require('express');
const router  = express.Router();
const {criarlogin, logarSistema,listarEstoque,cadastrarItem,editarItens,editarItenParcial,listarMovimentacoes,registrarMovimentacao,listaCompradores} = require('../controller/funcoes.controller');


router.post('/criarlogin', criarlogin);
router.post('/cadastrar', cadastrarItem);
router.get('/listar', listarEstoque);
router.post('/logar', logarSistema);

router.post('/movimentar/:id', editarItens);
router.post('/movimentacaoparcial/:id', editarItenParcial);

router.get('/movimentacoes', listarMovimentacoes);
router.post('/movimentacoes', registrarMovimentacao);

// Ranking de compradores
router.get('/compradores', listaCompradores);


module.exports = router;