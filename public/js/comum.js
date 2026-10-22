// Funções compartilhadas por todas as telas

const campo = (id) => document.getElementById(id);

async function enviar(rota, dados) {
  const resposta = await fetch(rota, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(json.erro);
  }
  return json;
}

// tipo: 'sucesso', 'erro' ou 'info'
function mostrarAviso(id, tipo, texto) {
  const aviso = campo(id);
  aviso.className = `aviso aviso-${tipo}`;
  aviso.textContent = texto;
}

function limparAviso(id) {
  const aviso = campo(id);
  aviso.className = 'aviso';
  aviso.textContent = '';
}

// A Vercel limita o corpo da requisição a 4,5 MB, e o Base64 aumenta o arquivo em cerca de 33%
const TAMANHO_MAXIMO_ARQUIVO = 3 * 1024 * 1024; // 3 MB

function bytesParaBase64(bytes) {
  let binario = '';
  const bloco = 0x8000;
  for (let i = 0; i < bytes.length; i += bloco) {
    binario += String.fromCharCode(...bytes.subarray(i, i + bloco));
  }
  return btoa(binario);
}

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/*
 * Entrada que pode ser um texto digitado ou um arquivo.
 * Espera no HTML os elementos com os ids:
 *   {prefixo}-aba-texto, {prefixo}-aba-arquivo  -> botões das abas
 *   {prefixo}-area-texto, {prefixo}-area-arquivo -> containers de cada aba
 *   {prefixo}-texto, {prefixo}-arquivo           -> textarea e input de arquivo
 * aoMudar é chamada sempre que o conteúdo muda.
 */
function configurarEntrada(prefixo, aoMudar) {
  let tipo = 'texto';
  const abaTexto = campo(`${prefixo}-aba-texto`);
  const abaArquivo = campo(`${prefixo}-aba-arquivo`);

  function selecionar(novoTipo, notificar = true) {
    tipo = novoTipo;
    abaTexto.classList.toggle('ativa', tipo === 'texto');
    abaArquivo.classList.toggle('ativa', tipo === 'arquivo');
    campo(`${prefixo}-area-texto`).hidden = tipo !== 'texto';
    campo(`${prefixo}-area-arquivo`).hidden = tipo !== 'arquivo';
    if (notificar) aoMudar();
  }

  abaTexto.addEventListener('click', () => selecionar('texto'));
  abaArquivo.addEventListener('click', () => selecionar('arquivo'));
  campo(`${prefixo}-texto`).addEventListener('input', aoMudar);
  campo(`${prefixo}-arquivo`).addEventListener('change', aoMudar);
  selecionar('texto', false);

  return {
    get tipo() {
      return tipo;
    },
    temConteudo() {
      if (tipo === 'texto') return campo(`${prefixo}-texto`).value.length > 0;
      return campo(`${prefixo}-arquivo`).files.length > 0;
    },
    // Devolve { tipo, nome, bytes } ou lança erro se não houver conteúdo válido
    async obter() {
      if (tipo === 'texto') {
        const texto = campo(`${prefixo}-texto`).value;
        if (!texto) throw new Error('Digite uma mensagem.');
        return { tipo, nome: 'mensagem.txt', bytes: new TextEncoder().encode(texto) };
      }
      const arquivo = campo(`${prefixo}-arquivo`).files[0];
      if (!arquivo) throw new Error('Selecione um arquivo.');
      if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
        throw new Error(`O arquivo tem ${formatarTamanho(arquivo.size)}. O limite é ${formatarTamanho(TAMANHO_MAXIMO_ARQUIVO)}.`);
      }
      return { tipo, nome: arquivo.name, bytes: new Uint8Array(await arquivo.arrayBuffer()) };
    },
  };
}

function baixarArquivo(nome, conteudo) {
  const url = URL.createObjectURL(new Blob([conteudo]));
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

function celebrarConclusao(container, passo) {
  if (!document.body.classList.contains('modal-embedded')) return;
  if (passo.dataset.confeteExibido === 'true') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  passo.dataset.confeteExibido = 'true';
  const camada = document.createElement('div');
  camada.className = 'confetes-conclusao';
  camada.setAttribute('aria-hidden', 'true');
  const cores = ['#22c55e', '#60a5fa', '#fbbf24', '#c084fc', '#f472b6', '#f8fafc'];

  for (let indice = 0; indice < 72; indice++) {
    const confete = document.createElement('i');
    confete.style.setProperty('--x', `${Math.random() * 100}%`);
    confete.style.setProperty('--desvio', `${(Math.random() - 0.5) * 180}px`);
    confete.style.setProperty('--giro', `${360 + Math.random() * 720}deg`);
    confete.style.setProperty('--atraso', `${Math.random() * 0.45}s`);
    confete.style.setProperty('--duracao', `${1.9 + Math.random() * 1.4}s`);
    confete.style.setProperty('--cor', cores[indice % cores.length]);
    confete.style.setProperty('--largura', `${5 + Math.random() * 6}px`);
    confete.style.setProperty('--altura', `${9 + Math.random() * 9}px`);
    camada.appendChild(confete);
  }

  document.body.appendChild(camada);
  window.setTimeout(() => camada.remove(), 3800);
}

/*
 * Passo a passo: cada elemento .passo dentro do container é uma etapa.
 * Passos com o atributo data-requer-acao só liberam o botão "Próximo"
 * depois que a página chamar liberar().
 */
function iniciarPassoAPasso(container, { aoMostrar } = {}) {
  const passos = [...container.querySelectorAll('.passo')];
  const contador = container.querySelector('.wizard-contador');
  const pontos = container.querySelector('.wizard-pontos');
  const btnVoltar = container.querySelector('.wizard-voltar');
  const btnProximo = container.querySelector('.wizard-proximo');

  const liberados = passos.map((passo) => !passo.hasAttribute('data-requer-acao'));
  let atual = 0;

  passos.forEach((passo, indice) => {
    const cabecalho = document.createElement('div');
    cabecalho.className = 'passo-cabecalho';
    cabecalho.innerHTML = `
      <span class="passo-numero">${String(indice + 1).padStart(2, '0')}</span>
      <h2>${passo.dataset.titulo}</h2>
    `;
    passo.prepend(cabecalho);
    pontos.appendChild(document.createElement('span'));
  });

  function mostrar(direcao = 'inicial') {
    passos.forEach((passo) => passo.classList.remove('ativo'));
    container.dataset.direcao = direcao;
    void container.offsetWidth;
    passos[atual].classList.add('ativo');
    [...pontos.children].forEach((ponto, indice) => ponto.classList.toggle('ativo', indice === atual));
    contador.textContent = `Passo ${atual + 1} de ${passos.length}`;

    btnVoltar.disabled = atual === 0;
    const ultimo = atual === passos.length - 1;
    btnProximo.innerHTML = ultimo ? 'Fechar &times;' : 'Próximo &rsaquo;';
    btnProximo.disabled = !liberados[atual];

    if (aoMostrar) aoMostrar(atual);
    if (ultimo) celebrarConclusao(container, passos[atual]);
  }

  btnVoltar.addEventListener('click', () => {
    if (atual > 0) {
      atual--;
      mostrar('voltar');
    }
  });

  btnProximo.addEventListener('click', () => {
    if (atual === passos.length - 1) {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'close-application-modal' }, window.location.origin);
      } else {
        window.location.href = 'index.html#experimentos';
      }
      return;
    }
    atual++;
    mostrar('proximo');
  });

  mostrar();

  return {
    liberar(indice) {
      liberados[indice] = true;
      if (indice === atual) btnProximo.disabled = false;
    },
    bloquear(indice) {
      liberados[indice] = false;
      if (indice === atual) btnProximo.disabled = true;
    },
  };
}
