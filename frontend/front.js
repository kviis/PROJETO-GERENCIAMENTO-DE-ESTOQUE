const API = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", function () {
    const botaoLogin = document.getElementById("loginbtn");
    if (botaoLogin) botaoLogin.addEventListener("click", login);

    const botaoCriar = document.getElementById("create-user");
    if (botaoCriar) botaoCriar.addEventListener("click", criarLogin);

    const botaoCadastrar = document.getElementById("cadastrar-buttom");
    if (botaoCadastrar) botaoCadastrar.addEventListener("click", cadastrarProduto);

    if (document.getElementById("totalProdutos")) carregarDashboard();
    if (document.getElementById("corpoEstoque"))  carregarEstoque();
    if (document.getElementById("corpoEntradas")) carregarEntradasSaidas();
});

function login() {
    const email = document.getElementById("username").value.trim();
    const senha = document.getElementById("password").value.trim();
    if (!email || !senha) {
        document.getElementById("resultado").innerHTML = "Preencha todos os campos!";
        return;
    }
    // rota real: POST /logar
    fetch(API + "/logar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem("token", data.token);
            window.location.href = "dashbord.html";
        } else {
            document.getElementById("resultado").innerHTML = data.erro || "Erro ao fazer login";
        }
    })
    .catch(err => console.error("Erro no login:", err));
}

function criarLogin() {
    const email     = document.getElementById("novo-email").value.trim();
    const senha     = document.getElementById("nova-senha").value.trim();
    const confirmar = document.getElementById("confirmar-senha").value.trim();
    const resultado = document.getElementById("resultado-criar");
    if (!email || !senha || !confirmar) { resultado.innerHTML = "Preencha todos os campos!"; return; }
    if (senha !== confirmar) { resultado.innerHTML = "As senhas não coincidem!"; return; }
    // rota real: POST /criarlogin
    fetch(API + "/criarlogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
    })
    .then(res => res.json())
    .then(() => {
        resultado.style.color = "green";
        resultado.innerHTML = "Usuário criado com sucesso!";
        setTimeout(() => window.location.href = "index.html", 1500);
    })
    .catch(err => { resultado.style.color = "red"; resultado.innerHTML = "Erro ao criar usuário."; console.error(err); });
}

function carregarDashboard() {
    // rota real: GET /listar
    fetch(API + "/listar")
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data)) return;
            document.getElementById("totalProdutos").innerHTML = data.length;
            const totalQtd = data.reduce((soma, item) => soma + (item.quantidade || 0), 0);
            document.getElementById("totalestoque").innerHTML = totalQtd;
        })
        .catch(err => console.error("Erro dashboard estoque:", err));

    // ATENÇÃO: não existe rota GET /movimentacoes no backend ainda.
    // Precisa criar essa rota + função no controller antes disso funcionar.
    fetch(API + "/movimentacoes")
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data)) return;
            const totalEntradas = data.filter(m => m.tipo === "entrada").length;
            const totalSaidas   = data.filter(m => m.tipo === "saida").length;
            document.getElementById("totalEntradas").innerHTML = totalEntradas;
            document.getElementById("totalsaidas").innerHTML   = totalSaidas;
        })
        .catch(err => console.error("Erro dashboard movimentações (rota ainda não existe no backend):", err));
}

function carregarEstoque() {
    // rota real: GET /listar
    fetch(API + "/listar")
        .then(res => res.json())
        .then(data => {
            const corpo = document.getElementById("corpoEstoque");
            corpo.innerHTML = "";
            if (data.length === 0) {
                corpo.innerHTML = "<tr><td colspan='4'>Nenhum item no estoque.</td></tr>";
                return;
            }
            data.forEach(item => {
                const linha = document.createElement("tr");
                linha.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.nome}</td>
                    <td>${item.quantidade}</td>
                    <td>${item.validade ? item.validade.split("T")[0] : "-"}</td>
                `;
                corpo.appendChild(linha);
            });
        })
        .catch(err => console.error("Erro ao carregar estoque:", err));
}

function carregarEntradasSaidas() {
    // ATENÇÃO: não existe rota GET /movimentacoes no backend ainda.
    fetch(API + "/movimentacoes")
        .then(res => res.json())
        .then(data => {
            const corpoEntradas = document.getElementById("corpoEntradas");
            const corpoSaidas   = document.getElementById("corpoSaidas");
            corpoEntradas.innerHTML = "";
            corpoSaidas.innerHTML  = "";
            const entradas = data.filter(m => m.tipo === "entrada");
            const saidas   = data.filter(m => m.tipo === "saida");
            if (entradas.length === 0)
                corpoEntradas.innerHTML = "<tr><td colspan='4'>Nenhuma entrada registrada.</td></tr>";
            else
                entradas.forEach(m => {
                    corpoEntradas.innerHTML += `<tr>
                        <td>${m.id}</td><td>${m.produto}</td>
                        <td>${m.quantidade}</td>
                        <td>${m.data ? m.data.split("T")[0] : "-"}</td>
                    </tr>`;
                });
            if (saidas.length === 0)
                corpoSaidas.innerHTML = "<tr><td colspan='4'>Nenhuma saída registrada.</td></tr>";
            else
                saidas.forEach(m => {
                    corpoSaidas.innerHTML += `<tr>
                        <td>${m.id}</td><td>${m.produto}</td>
                        <td>${m.quantidade}</td>
                        <td>${m.data ? m.data.split("T")[0] : "-"}</td>
                    </tr>`;
                });
        })
        .catch(err => console.error("Erro ao carregar movimentações (rota ainda não existe no backend):", err));
}

function registrarMovimentacao() {
    const produto    = document.getElementById("mov-produto").value.trim();
    const quantidade = document.getElementById("mov-quantidade").value.trim();
    const tipo       = document.getElementById("mov-tipo").value;
    const msg        = document.getElementById("msg-movimentacao");

    if (!produto || !quantidade || !tipo) {
        msg.style.color = "red";
        msg.innerHTML = "Preencha todos os campos!";
        return;
    }

    // ATENÇÃO: rota real é POST /movimentar/:id (precisa de um id de item existente).
    // Não existe uma rota "criar movimentação nova sem id" no backend ainda.
    fetch(API + "/movimentar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produto, quantidade, tipo })
    })
    .then(res => res.json())
    .then(data => {
        if (data.erro) {
            msg.style.color = "red";
            msg.innerHTML = data.erro;
        } else {
            msg.style.color = "green";
            msg.innerHTML = data.mensagem;
            carregarEstoque();
            carregarEntradasSaidas();
        }
    })
    .catch(err => {
        msg.style.color = "red";
        msg.innerHTML = "Erro ao registrar movimentação.";
        console.error(err);
    });
}

function cadastrarProduto() {
    const nome       = document.getElementById("cad-nome").value.trim();
    const quantidade = document.getElementById("cad-quantidade").value.trim();
    const validade   = document.getElementById("cad-validade").value;
    const resultado  = document.getElementById("resultado-cadastro");
    if (!nome || !quantidade) { resultado.innerHTML = "Preencha pelo menos nome e quantidade!"; return; }
    // rota real: POST /cadastrar
    // ATENÇÃO: o controller de cadastrarItem hoje exige {produto, quantidade, validade}
    // e insere na tabela "movimentacoes", não em "estoque". Ver observação abaixo.
    fetch(API + "/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produto: nome, quantidade: parseInt(quantidade), validade: validade || null })
    })
    .then(res => res.json())
    .then(() => {
        resultado.style.color = "green";
        resultado.innerHTML = "Produto cadastrado com sucesso!";
        document.getElementById("cad-nome").value = "";
        document.getElementById("cad-quantidade").value = "";
        document.getElementById("cad-validade").value = "";
    })
    .catch(err => { resultado.style.color = "red"; resultado.innerHTML = "Erro ao cadastrar produto."; console.error(err); });
}

function telaCadastro()       { window.location.href = "cadastro.html"; }
function telaInicio()         { window.location.href = "dashbord.html"; }
function telaEntradaEsaidas() { window.location.href = "entradasEsaidas.html"; }
function telaEstoque()        { window.location.href = "estoque.html"; }

function sairConta() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}