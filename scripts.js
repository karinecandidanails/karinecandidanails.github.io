const PAGINAS = ['home', 'sobre', 'servicos', 'cursos', 'contato'];

const navbar = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
// links do menu de cima (computador) e da barra de baixo (celular)
const navLinks = document.querySelectorAll('.nav-btn, .bottom-link');

// Mostra a página pedida no endereço (#sobre, #cursos...) e marca o menu
function showPage(pageId) {
    if (!PAGINAS.includes(pageId)) pageId = 'home';

    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === pageId);
    });

    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + pageId);
    });

    // Sempre começa a nova página do topo
    window.scrollTo(0, 0);
    fecharMenu();
}

// Lê o "#" do endereço. Assim o botão Voltar funciona e dá para
// mandar um link direto, ex.: seusite.com/#cursos
function lerEndereco() {
    showPage(location.hash.replace('#', ''));
}

window.addEventListener('hashchange', lerEndereco);
document.addEventListener('DOMContentLoaded', lerEndereco);

// ----- Menu hambúrguer (celular) -----
function fecharMenu() {
    navbar.classList.remove('menu-aberto');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
}

menuToggle.addEventListener('click', () => {
    const aberto = navbar.classList.toggle('menu-aberto');
    menuToggle.setAttribute('aria-expanded', String(aberto));
    menuToggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
});

// Clicar no mesmo link da página atual também fecha o menu
navLinks.forEach(link => link.addEventListener('click', fecharMenu));

// ----- Números que se atualizam sozinhos -----
const anoAtual = new Date().getFullYear();

document.querySelectorAll('[data-desde]').forEach(el => {
    const anos = anoAtual - Number(el.dataset.desde);
    el.textContent = anos + '+';
});

document.getElementById('ano').textContent = anoAtual;

// ----- Carrosséis de fotos (aba Serviços e aba Cursos) -----
function iniciarCarrossel(secao) {
    const track = secao.querySelector('.nails-track');
    const itens = track.querySelectorAll('.nail-item');
    const prev = secao.querySelector('.nails-prev');
    const next = secao.querySelector('.nails-next');
    const dots = secao.querySelector('.nails-dots');

    // distância entre o início de uma foto e o da próxima
    const passo = () => itens.length > 1 ? itens[1].offsetLeft - itens[0].offsetLeft : 0;

    // quantas fotos cabem na tela ao mesmo tempo (3, 2 ou 1)
    const porVez = () => Math.max(1, Math.round(track.clientWidth / passo()));

    // uma bolinha para cada posição possível
    function criarBolinhas() {
        if (!passo()) return;   // aba escondida: monta quando ela aparecer
        dots.innerHTML = '';
        const total = itens.length - porVez() + 1;
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('button');
            dot.setAttribute('aria-label', 'Ir para a foto ' + (i + 1));
            dot.addEventListener('click', () => track.scrollTo({ left: i * passo() }));
            dots.appendChild(dot);
        }
        atualizar();
    }

    function atualizar() {
        if (!passo()) return;
        const atual = Math.round(track.scrollLeft / passo());
        const max = track.scrollWidth - track.clientWidth;
        dots.querySelectorAll('button').forEach((d, i) => d.classList.toggle('active', i === atual));
        prev.disabled = track.scrollLeft <= 5;
        next.disabled = track.scrollLeft >= max - 5;
    }

    prev.addEventListener('click', () => track.scrollBy({ left: -passo() }));
    next.addEventListener('click', () => track.scrollBy({ left: passo() }));
    track.addEventListener('scroll', atualizar, { passive: true });

    // setas do teclado quando o carrossel está selecionado
    track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    });

    return criarBolinhas;
}

const montarCarrosseis = [...document.querySelectorAll('.nails-section')].map(iniciarCarrossel);
const remontarCarrosseis = () => setTimeout(() => montarCarrosseis.forEach(f => f()), 50);

// as abas começam escondidas: monta as bolinhas quando uma aba aparece,
// ao abrir a página e ao girar o celular ou redimensionar a janela
window.addEventListener('hashchange', remontarCarrosseis);
document.addEventListener('DOMContentLoaded', remontarCarrosseis);
let esperaCarrossel;
window.addEventListener('resize', () => {
    clearTimeout(esperaCarrossel);
    esperaCarrossel = setTimeout(remontarCarrosseis, 150);
});
remontarCarrosseis();

// ===================================================================
// PREÇOS PELA PLANILHA DO GOOGLE
// A Karine muda os valores na planilha e o site mostra o valor novo.
// Link da planilha (pode ser o link normal de compartilhamento).
// A planilha precisa estar como "Qualquer pessoa com o link: Leitor".
// Se ficar vazio, o site mostra os valores escritos no index.html.
// ===================================================================
const PLANILHA_PRECOS = 'https://docs.google.com/spreadsheets/d/1g04Jwy-7KZ48-oKSa2rJmOrxJttIl52Vohj6mEVwjzM/edit?usp=sharing';

// Endereços de onde o site baixa a planilha em CSV (o segundo é reserva)
function enderecosDaPlanilha(link) {
    const id = (link.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/) || [])[1];
    if (!id) return [link];   // já é um link CSV publicado
    return [
        'https://docs.google.com/spreadsheets/d/' + id + '/export?format=csv',
        'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv&headers=1'
    ];
}

// Transforma o que foi digitado na planilha em número.
// Aceita "180", "180,50", "R$ 1.200,00" etc.
function lerNumero(texto) {
    let t = String(texto || '').replace(/[^\d,.]/g, '');
    if (!t) return NaN;
    if (t.includes(',')) {
        t = t.replace(/\./g, '').replace(',', '.');      // 1.200,50 -> 1200.50
    } else if (!/\.\d{1,2}$/.test(t)) {
        t = t.replace(/\./g, '');                        // 1.200 -> 1200
    }
    return parseFloat(t);
}

// "curto": R$ 180  |  "completo": R$ 180,00
function formatarPreco(valor, formato) {
    const inteiro = Number.isInteger(valor);
    const casas = (formato === 'completo' || !inteiro) ? 2 : 0;
    return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function aplicarPrecos(precos) {
    // o restante do curso é calculado sozinho: total menos o sinal
    if (!isNaN(precos.curso_total) && !isNaN(precos.curso_sinal)) {
        precos.curso_restante = precos.curso_total - precos.curso_sinal;
    }
    document.querySelectorAll('[data-preco]').forEach(el => {
        const valor = precos[el.dataset.preco];
        if (typeof valor === 'number' && !isNaN(valor)) {
            el.textContent = formatarPreco(valor, el.dataset.formato);
        }
    });
}

// Lê um CSV simples (aceita campos entre aspas)
function lerCSV(texto) {
    const linhas = [];
    let linha = [], campo = '', aspas = false;
    for (let i = 0; i < texto.length; i++) {
        const c = texto[i];
        if (aspas) {
            if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
            else if (c === '"') aspas = false;
            else campo += c;
        } else if (c === '"') aspas = true;
        else if (c === ',') { linha.push(campo); campo = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && texto[i + 1] === '\n') i++;
            linha.push(campo); linhas.push(linha); linha = []; campo = '';
        } else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    return linhas;
}

// Últimos valores lidos da planilha, guardados no navegador:
// quem volta ao site já vê o preço novo, mesmo antes da planilha responder.
const CHAVE_PRECOS = 'kc-precos';
try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_PRECOS) || 'null');
    if (salvos) aplicarPrecos(salvos);
} catch (e) { /* navegador sem armazenamento: usa os valores do HTML */ }

async function baixarPlanilha() {
    let ultimoErro;
    for (const endereco of enderecosDaPlanilha(PLANILHA_PRECOS)) {
        try {
            const resposta = await fetch(endereco, { cache: 'no-store' });
            if (!resposta.ok) throw new Error('planilha respondeu ' + resposta.status);
            return await resposta.text();
        } catch (erro) {
            ultimoErro = erro;   // tenta o próximo endereço
        }
    }
    throw ultimoErro;
}

async function carregarPrecos() {
    if (!PLANILHA_PRECOS) return;
    try {
        const linhas = lerCSV(await baixarPlanilha());
        const cabecalho = (linhas.shift() || []).map(t => t.toLowerCase());
        const colCodigo = cabecalho.findIndex(t => t.includes('código') || t.includes('codigo'));
        const colValor = cabecalho.findIndex(t => t.includes('valor'));
        if (colCodigo < 0 || colValor < 0) throw new Error('colunas "Valor" e "Código" não encontradas');

        const precos = {};
        linhas.forEach(l => {
            const codigo = (l[colCodigo] || '').trim();
            const valor = lerNumero(l[colValor]);
            if (codigo && !isNaN(valor)) precos[codigo] = valor;
        });
        aplicarPrecos(precos);
        try { localStorage.setItem(CHAVE_PRECOS, JSON.stringify(precos)); } catch (e) { }
    } catch (erro) {
        // sem internet ou planilha fora do ar: continua com os valores já na página
        console.warn('Não foi possível ler a planilha de preços:', erro.message);
    }
}

carregarPrecos();
