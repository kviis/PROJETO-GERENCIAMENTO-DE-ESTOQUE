const API = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "";
let produtoSaida = null;

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const botaoLogin = document.getElementById("loginbtn");
    const botaoCriar = document.getElementById("create-user");
    const botaoCadastrar = document.getElementById("cadastrar-buttom");

    if (botaoLogin) botaoLogin.addEventListener("click", login);
    if (botaoCriar) botaoCriar.addEventListener("click", criarLogin);
    if (botaoCadastrar) botaoCadastrar.addEventListener("click", cadastrarProduto);

    if (document.getElementById("totalProdutos")) carregarDashboard();
    if (document.getElementById("corpoEstoque")) carregarEstoque();
    if (document.getElementById("corpoEntradas")) carregarEntradasSaidas();
    
    if (document.getElementById("listaCompradores")) { carregarGraficoCompradores();}

});

// ==========================================
// API
// ==========================================
async function apiRequest(caminho, opcoes = {}) {
    const resposta = await fetch(API + caminho, opcoes);
    let dados = {};

    try {
        dados = await resposta.json();
    } catch {
        dados = { erro: `Resposta inválida do servidor (status ${resposta.status})` };
    }

    return { ok: resposta.ok, status: resposta.status, data: dados };
}

// ==========================================
// LOGIN
// ==========================================
async function login() {
    const email = document.getElementById("username").value.trim();
    const senha = document.getElementById("password").value.trim();
    const resultado = document.getElementById("resultado");

    if (!email || !senha) {
        resultado.innerHTML = "Preencha todos os campos!";
        return;
    }

    try {
        const { ok, data } = await apiRequest("/logar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        if (ok && data.token) {
            localStorage.setItem("token", data.token);
            window.location.href = "dashbord.html";
        } else {
            resultado.innerHTML = data.erro || "Erro ao fazer login";
        }
    } catch (err) {
        resultado.innerHTML = "Não foi possível conectar ao servidor.";
        console.error("Erro no login:", err);
    }
}

// ==========================================
// CRIAR USUÁRIO
// ==========================================
async function criarLogin() {
    const email = document.getElementById("novo-email").value.trim();
    const senha = document.getElementById("nova-senha").value.trim();
    const confirmar = document.getElementById("confirmar-senha").value.trim();
    const resultado = document.getElementById("resultado-criar");

    if (!email || !senha || !confirmar) {
        resultado.innerHTML = "Preencha todos os campos!";
        return;
    }

    if (senha !== confirmar) {
        resultado.innerHTML = "As senhas não coincidem!";
        return;
    }

    try {
        const { ok, data } = await apiRequest("/criarlogin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        if (!ok) {
            resultado.style.color = "red";
            resultado.innerHTML = data.message || data.erro || "Erro ao criar usuário.";
            return;
        }

        resultado.style.color = "green";
        resultado.innerHTML = "Usuário criado com sucesso!";
        setTimeout(() => window.location.href = "index.html", 1500);
    } catch (err) {
        resultado.style.color = "red";
        resultado.innerHTML = "Erro ao criar usuário.";
        console.error(err);
    }
}

// ==========================================
// DASHBOARD
// ==========================================
async function carregarDashboard() {
    try {
        const { ok, data } = await apiRequest("/listar");

        if (ok && Array.isArray(data)) {
            document.getElementById("totalProdutos").textContent = data.length;

            const totalQtd = data.reduce(
                (soma, item) => soma + Number(item.quantidade || 0), 0
            );

            document.getElementById("totalestoque").textContent = totalQtd;
        }
    } catch (err) {
        console.error("Erro dashboard estoque:", err);
    }

    try {
        const { ok, data } = await apiRequest("/movimentacoes");

        if (ok && Array.isArray(data)) {
            const entradas = data.filter(m => m.tipo === "entrada").length;
            const saidas = data.filter(m => m.tipo === "saida").length;

            document.getElementById("totalEntradas").textContent = entradas;
            document.getElementById("totalsaidas").textContent = saidas;
        }
    } catch (err) {
        console.error("Erro dashboard movimentações:", err);
    }
}

// ==========================================
// ESTOQUE
// ==========================================
async function carregarEstoque() {
    const corpo = document.getElementById("corpoEstoque");
    if (!corpo) return;

    try {
        const { ok, data } = await apiRequest("/listar");

        if (!ok || !Array.isArray(data)) {
            corpo.innerHTML = "<tr><td colspan='5'>Erro ao carregar estoque.</td></tr>";
            return;
        }

        if (data.length === 0) {
            corpo.innerHTML = "<tr><td colspan='5'>Nenhum item no estoque.</td></tr>";
            return;
        }

        corpo.innerHTML = data.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.nome}</td>
                <td>${item.quantidade}</td>
                <td>${item.validade ? item.validade.split("T")[0] : "-"}</td>
                <td class="acao-baixa">
                    <button
                        type="button"
                        class="botao-baixa"
                        data-id="${item.id}"
                        data-nome="${item.nome}"
                        data-quantidade="${item.quantidade}">
                        Dar baixa
                    </button>
                </td>
            </tr>
        `).join("");

        corpo.querySelectorAll(".botao-baixa").forEach(botao => {
            botao.addEventListener("click", () => {
                abrirModalSaida(
                    Number(botao.dataset.id),
                    botao.dataset.nome,
                    Number(botao.dataset.quantidade)
                );
            });
        });
    } catch (err) {
        console.error("Erro ao carregar estoque:", err);
        corpo.innerHTML = "<tr><td colspan='5'>Erro ao carregar estoque.</td></tr>";
    }
}

// ==========================================
// MODAL DE SAÍDA
// ==========================================
function abrirModalSaida(id, nome, quantidadeEstoque) {
    if (quantidadeEstoque <= 0) {
        alert("Este produto está sem estoque.");
        return;
    }

    produtoSaida = { id, nome, quantidadeEstoque };

    document.getElementById("modalProduto").textContent = nome;
    document.getElementById("modalEstoque").textContent = quantidadeEstoque;
    document.getElementById("quantidadeSaida").value = 1;
    document.getElementById("compradorSaida").value = "";
    document.getElementById("resumoProduto").textContent = nome;
    document.getElementById("resumoQuantidade").textContent = 1;
    document.getElementById("modalSaida").classList.add("ativo");

    document.getElementById("compradorSaida").focus();
}

function aumentarSaida() {
    if (!produtoSaida) return;

    const input = document.getElementById("quantidadeSaida");
    let quantidade = Number(input.value);

    if (quantidade < produtoSaida.quantidadeEstoque) {
        input.value = ++quantidade;
        atualizarResumoSaida();
    }
}

function diminuirSaida() {
    const input = document.getElementById("quantidadeSaida");
    let quantidade = Number(input.value);

    if (quantidade > 1) {
        input.value = --quantidade;
        atualizarResumoSaida();
    }
}

function atualizarResumoSaida() {
    const quantidade = document.getElementById("quantidadeSaida").value;
    document.getElementById("resumoQuantidade").textContent = quantidade;
}

function fecharModalSaida() {
    document.getElementById("modalSaida").classList.remove("ativo");
    produtoSaida = null;
}

// ==========================================
// CONFIRMAR SAÍDA
// ==========================================
async function confirmarSaida() {
    if (!produtoSaida) return;

    const comprador = document.getElementById("compradorSaida").value.trim();
    const quantidade = Number(document.getElementById("quantidadeSaida").value);

    if (!comprador) {
        alert("Informe o nome do comprador.");
        document.getElementById("compradorSaida").focus();
        return;
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        alert("Quantidade inválida.");
        return;
    }

    if (quantidade > produtoSaida.quantidadeEstoque) {
        alert("Quantidade maior que o estoque disponível.");
        return;
    }

    try {
        const { ok, data } = await apiRequest("/movimentacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                produto: produtoSaida.nome,
                quantidade,
                tipo: "saida",
                comprador
            })
        });

        if (!ok) {
            alert(data.erro || "Erro ao registrar saída.");
            return;
        }

        alert("Saída registrada com sucesso!");
        fecharModalSaida();
        await carregarEstoque();
    } catch (err) {
        console.error("Erro ao registrar saída:", err);
        alert("Não foi possível registrar a saída.");
    }
}

// ==========================================
// ENTRADAS E SAÍDAS
// ==========================================
function linhaEntrada(m) {
    return `
        <tr>
            <td>${m.id}</td>
            <td>${m.produto}</td>
            <td>${m.quantidade}</td>
            <td>${m.data ? m.data.split("T")[0] : "-"}</td>
        </tr>
    `;
}

function linhaSaida(m) {
    return `
        <tr>
            <td>${m.id}</td>
            <td>${m.produto}</td>
            <td>${m.quantidade}</td>
            <td>${m.comprador || "-"}</td>
            <td>${m.data ? m.data.split("T")[0] : "-"}</td>
        </tr>
    `;
}

async function carregarEntradasSaidas() {
    const corpoEntradas = document.getElementById("corpoEntradas");
    const corpoSaidas = document.getElementById("corpoSaidas");
    if (!corpoEntradas || !corpoSaidas) return;

    const LIMITE = 10;

    try {
        const { ok, data } = await apiRequest("/movimentacoes");

        if (!ok || !Array.isArray(data)) {
            corpoEntradas.innerHTML = "<tr><td colspan='4'>Erro ao carregar entradas.</td></tr>";
            corpoSaidas.innerHTML = "<tr><td colspan='5'>Erro ao carregar saídas.</td></tr>";
            return;
        }

        const entradas = data.filter(m => m.tipo === "entrada").slice(0, LIMITE);
        const saidas = data.filter(m => m.tipo === "saida").slice(0, LIMITE);

        corpoEntradas.innerHTML = entradas.length
            ? entradas.map(linhaEntrada).join("")
            : "<tr><td colspan='4'>Nenhuma entrada registrada.</td></tr>";

        corpoSaidas.innerHTML = saidas.length
            ? saidas.map(linhaSaida).join("")
            : "<tr><td colspan='5'>Nenhuma saída registrada.</td></tr>";
    } catch (err) {
        console.error("Erro ao carregar movimentações:", err);
    }
}

// ==========================================
// CADASTRAR PRODUTO
// ==========================================
async function cadastrarProduto() {
    const nome = document.getElementById("cad-nome").value.trim();
    const quantidade = Number(document.getElementById("cad-quantidade").value);
    const validade = document.getElementById("cad-validade").value;
    const resultado = document.getElementById("resultado-cadastro");

    if (!nome || !Number.isInteger(quantidade) || quantidade <= 0) {
        resultado.style.color = "red";
        resultado.innerHTML = "Preencha nome e uma quantidade válida!";
        return;
    }

    try {
        const { ok, data } = await apiRequest("/cadastrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome,
                quantidade,
                validade: validade || null
            })
        });

        if (!ok) {
            resultado.style.color = "red";
            resultado.innerHTML = data.erro || "Erro ao cadastrar produto.";
            return;
        }

        resultado.style.color = "green";
        resultado.innerHTML = data.message || "Produto cadastrado com sucesso!";

        document.getElementById("cad-nome").value = "";
        document.getElementById("cad-quantidade").value = "";
        document.getElementById("cad-validade").value = "";
    } catch (err) {
        resultado.style.color = "red";
        resultado.innerHTML = "Erro ao cadastrar produto.";
        console.error(err);
    }
}
// ==========================================
//grafico compradores
//===========================================

async function carregarGraficoCompradores() {

    const lista = document.getElementById("listaCompradores");
    const filtro = document.getElementById("filtroCompradores");

    console.log("LISTA:", lista);
    console.log("FILTRO:", filtro);

    if (!lista || !filtro) {
        console.error("Elemento listaCompradores ou filtroCompradores não encontrado");
        return;
    }

    try {

        const { ok, data } = await apiRequest("/compradores");

        if (!ok || !Array.isArray(data)) {
            lista.innerHTML = "<p>Erro ao carregar compradores.</p>";
            return;
        }

        if (data.length === 0) {
            lista.innerHTML = "<p>Nenhuma compra registrada.</p>";
            return;
        }

        const campo = filtro.value;

        const compradores = [...data].sort((a, b) =>
            Number(b[campo]) - Number(a[campo])
        );

        const maiorValor = Math.max(
            ...compradores.map(c => Number(c[campo]))
        );

        lista.innerHTML = compradores.map(c => {
            const valor = Number(c[campo]);
            const porcentagem = maiorValor > 0
                ? (valor / maiorValor) * 100
                : 0;

            const descricao = campo === "totalCompras"
                ? `${valor} compra${valor !== 1 ? "s" : ""}`
                : `${valor} item${valor !== 1 ? "s" : ""}`;

            return `
                <div class="comprador-item">
                    <div class="comprador-info">
                        <span>${c.comprador}</span>
                        <span>${descricao}</span>
                    </div>

                    <div class="barra-fundo">
                        <div class="barra-valor" style="width:${porcentagem}%"></div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        lista.innerHTML = "<p>Erro ao carregar compradores.</p>";
    }
}

// ==========================================
// NAVEGAÇÃO
// ==========================================
function telaCadastro() { window.location.href = "cadastro.html"; }
function telaInicio() { window.location.href = "dashbord.html"; }
function telaEntradaEsaidas() { window.location.href = "entradasEsaidas.html"; }
function telaEstoque() { window.location.href = "estoque.html"; }

function sairConta() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}