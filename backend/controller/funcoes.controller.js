//requerindo bibliotecas e frameworks
const db = require('../db')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
//função de criação de login 
async function criarlogin(req, res) {
    const {email, senha}= req.body;
    const saltRounds = 10;

    if(!email || !senha) {
        return res.status(401).json({ erro:"preenchimento dos campos necessarios"}) 
        
    }
    try {
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
        const sql= db.prepare('INSERT INTO usuarios(email, senha) VALUES(?,?)');
          sql.run(email,senhaCriptografada);
          return res.status(201).json({message:"usuario criado"})
             
    }
   catch (err){
    if (err.message.includes('UNIQUE constraint failed')){
        return res.status(409).json({ message:"usuario ja existe, tente um diferente por favor"})
    }
    return res.status(500).json({ erro: "erro ao criar usuario: " + err.message });
   }
}

//função de cesso de login
 
async function logarSistema(req, res) {
    const {email,senha} = req.body;

    if (!email || !senha){
        return res.status(400).json("login e senhas necessarios")    
} 
    try{ 
        const sql= db.prepare('SELECT * FROM usuarios WHERE email=?');
        const usuario = sql.get(email);

    if (!usuario){
        return res.status(400).json({erro:"usuario nao existe"})
}
        
      const validSenha = await bcrypt.compare(senha, usuario.senha);

    if(!validSenha) { 
         return res.status(400).json("senha incorreta")

}
 const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
    );       
         res.status(200).json({ mensagem:"login realizado com sucesso",token});
}catch (err){
      res.status(400).json({ erro: 'erro ao logar' +err.message});
}

    
};

//itens em estoque
function listarEstoque (req,res){
try {const sql = db.prepare('SELECT * FROM estoque');
   const itens = sql.all();
     return res.status(200).json(itens)   

}catch (err){
   return res.status(500).json({ erro:"erro ao listar itens: "+err.message });
} 
}

//Cadastrar produto 
function cadastrarItem(req,res){
    const {produto, quantidade,validade} = req.body;

    if(!produto||!quantidade||!validade){
        return res.status(400).json({erro:"preencha os campos necessarios"});
}
    try{
        const sql = db.prepare('INSERT INTO movimentacoes(produto, quantidade,validade) VALUES(?,?,?)');
        sql.run(produto,quantidade,validade);
    
        return res.status(201).json({message:"cadastro feito com sucesso"});
}   catch (err){
        return res.status(500).json({err:"erro ao cadastrar produto"});
}
}
//atualização de informações de itens
 function editarItens(req,res){
  
    const {id}= req.params; 
    const {produto,quantidade,validade} = req.body;
  
    if(!produto||!quantidade||!validade){
     return res.status(400).json({erro: "campos obrigatorios"});

   } 
    try{
      const buscar = db.prepare('SELECT*FROM estoque WHERE id=?');
      const item= buscar.get(id);
    
       if(!item){
         return res.status(404).json({erro:"iten nao encontrado"})
   
}
 const sql = db.prepare("UPDATE estoque SET produto=?, quantidade=?, validade=? WHERE id=?");
sql.run(nome,quantidade,validade,id);
  
  return res.status(200).json({message: "iten atualizado"});
}catch(err){
    return res.status(500).json({erro: "erro ao editar iten:"+err.message});
}   
}
function editarItenParcial(req,res){
  
  const {id}= req.params;
  const {produto,quantidade,validade}=req.body;


  try{
      const buscar = db.prepare('SELECT*FROM movimentacoes WHERE id=?');
      const item= buscar.get(id);
    
       if(!item){
         return res.status(404).json({erro:"iten nao encontrado"})
  }        

   const novoNome = produto??item.produto;
   const novaQuantidade= quantidade??item.quantidade;
   const novaValidade= validade??item.validade

const sql = db.prepare("UPDATE movimentacoes SET produto=?, quantidade=?, validade=? WHERE id=?");
sql.run(novoNome,novaQuantidade,novaValidade,id);

   return res.status(200).json({message: "iten atualizado"});

  }catch (err){
       return res.status(500).json({erro: "erro ao editar item"+err.message});
  }   
}
//listar histórico de movimentações (entradas e saídas)
function listarMovimentacoes(req, res) {
    try {
        const sql = db.prepare('SELECT * FROM movimentacoes ORDER BY data DESC');
        const movimentacoes = sql.all();
        return res.status(200).json(movimentacoes);
    } catch (err) {
        return res.status(500).json({ erro: "erro ao listar movimentacoes: " + err.message });
    }
}

module.exports = {criarlogin, logarSistema,listarEstoque,cadastrarItem,editarItens,editarItenParcial,listarMovimentacoes};