const PASSO_ENTRADA = 0;
const PASSO_CALCULAR = 1;
const PASSO_SALVAR = 3;

let dadosAtuais = null; // { tipo, nome, bytes }
let hashAtual = '';

const wizard = iniciarPassoAPasso(campo('wizard'), {
  aoMostrar(passo) {
    if (passo === PASSO_CALCULAR) mostrarInfoEntrada();
    if (passo === PASSO_SALVAR) {
      campo('nome-final').textContent = dadosAtuais.nome;
      campo('hash-final').textContent = hashAtual;
    }
  },
});

const entrada = configurarEntrada('entrada', () => {
  // Conteúdo novo invalida o hash calculado anteriormente
  dadosAtuais = null;
  hashAtual = '';
  campo('hash-sha256').textContent = '-';
  campo('area-avalanche').hidden = true;
  limparAviso('aviso-calcular');
  limparAviso('aviso-avalanche');
  wizard.bloquear(PASSO_CALCULAR);

  if (entrada.temConteudo()) wizard.liberar(PASSO_ENTRADA);
  else wizard.bloquear(PASSO_ENTRADA);
});

async function mostrarInfoEntrada() {
  try {
    const dados = await entrada.obter();
    const descricao = dados.tipo === 'texto' ? 'Mensagem digitada' : `Arquivo "${dados.nome}"`;
    campo('info-entrada').textContent = `${descricao}: ${formatarTamanho(dados.bytes.length)}`;
  } catch (erro) {
    campo('info-entrada').textContent = erro.message;
  }
}

campo('btn-calcular').addEventListener('click', async () => {
  try {
    dadosAtuais = await entrada.obter();
    mostrarAviso('aviso-calcular', 'info', 'Calculando...');
    const resultado = await enviar('/api/hash/gerar', { dados: bytesParaBase64(dadosAtuais.bytes) });

    hashAtual = resultado.sha256;
    campo('hash-sha256').textContent = resultado.sha256;
    campo('hash-md5').textContent = resultado.comparacao.md5;
    campo('hash-sha1').textContent = resultado.comparacao.sha1;
    campo('hash-sha512').textContent = resultado.comparacao.sha512;
    localStorage.setItem('ultimoHash', JSON.stringify({ hash: hashAtual, nome: dadosAtuais.nome }));

    mostrarAviso('aviso-calcular', 'sucesso', `Hash calculado com sucesso a partir de ${formatarTamanho(resultado.tamanhoBytes)}!`);
    wizard.liberar(PASSO_CALCULAR);
  } catch (erro) {
    mostrarAviso('aviso-calcular', 'erro', erro.message);
  }
});

// Conta quantos dos 256 bits são diferentes entre dois hashes em hexadecimal
function contarBitsDiferentes(hashA, hashB) {
  let diferentes = 0;
  for (let i = 0; i < hashA.length; i++) {
    let xor = parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16);
    while (xor) {
      diferentes += xor & 1;
      xor >>= 1;
    }
  }
  return diferentes;
}

function destacarDiferencas(original, alterado) {
  return [...alterado]
    .map((caractere, i) => (caractere === original[i] ? caractere : `<span class="diferente">${caractere}</span>`))
    .join('');
}

campo('btn-avalanche').addEventListener('click', async () => {
  if (dadosAtuais.bytes.length === 0) {
    mostrarAviso('aviso-avalanche', 'erro', 'Os dados estão vazios: não há bit para alterar.');
    return;
  }

  const alterados = new Uint8Array(dadosAtuais.bytes);
  alterados[alterados.length - 1] ^= 1;

  const resultado = await enviar('/api/hash/gerar', { dados: bytesParaBase64(alterados) });
  const bits = contarBitsDiferentes(hashAtual, resultado.sha256);

  campo('area-texto-alterado').hidden = dadosAtuais.tipo !== 'texto';
  campo('texto-alterado').textContent = new TextDecoder().decode(alterados);
  campo('avalanche-original').textContent = hashAtual;
  campo('avalanche-alterado').innerHTML = destacarDiferencas(hashAtual, resultado.sha256);
  campo('area-avalanche').hidden = false;

  mostrarAviso(
    'aviso-avalanche',
    'info',
    `Mudamos 1 bit na entrada e ${bits} dos 256 bits do hash mudaram (${Math.round((bits / 256) * 100)}%).`
  );
});

campo('btn-copiar').addEventListener('click', async () => {
  await navigator.clipboard.writeText(hashAtual);
  mostrarAviso('aviso-salvar', 'sucesso', 'Hash copiado! Cole-o na tela de verificação.');
});

campo('btn-baixar').addEventListener('click', () => {
  // Mesmo formato gerado pelo comando sha256sum: "<hash>  <nome do arquivo>"
  baixarArquivo(`${dadosAtuais.nome}.sha256`, `${hashAtual}  ${dadosAtuais.nome}\n`);
  mostrarAviso('aviso-salvar', 'sucesso', `Arquivo "${dadosAtuais.nome}.sha256" baixado! Carregue-o na tela de verificação.`);
});
