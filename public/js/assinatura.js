const PASSO_CHAVES = 0;
const PASSO_CERTIFICADO = 1;
const PASSO_ASSINAR = 2;
const PASSO_VERIFICAR = 3;
const PASSO_RESUMO = 4;

let certificadoAC = '';
let dadosAssinados = null; // { tipo, nome, bytes }
let ultimaVerificacao = null;

const wizard = iniciarPassoAPasso(campo('wizard'), {
  aoMostrar(passo) {
    if (passo === PASSO_RESUMO) mostrarResumo();
  },
});

function formatarData(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

function limparVerificacao() {
  ultimaVerificacao = null;
  campo('area-verificacao').hidden = true;
  limparAviso('aviso-verificar');
  wizard.bloquear(PASSO_VERIFICAR);
}

function limparAssinatura() {
  dadosAssinados = null;
  campo('area-assinatura').hidden = true;
  campo('assinatura-recebida').value = '';
  limparAviso('aviso-assinar');
  wizard.bloquear(PASSO_ASSINAR);
  limparVerificacao();
}

async function carregarAC() {
  const { certificado, detalhes } = await fetch('/api/assinatura/ac').then((resposta) => resposta.json());
  certificadoAC = certificado;
  const nomeAC = detalhes.titular.split('\n')[0].replace('CN=', '');
  campo('info-ac').textContent = `Autoridade Certificadora: ${nomeAC}`;
}

// ---------- Passo 1: chaves ----------

campo('btn-gerar-chaves').addEventListener('click', async () => {
  mostrarAviso('aviso-chaves', 'info', 'Gerando o par de chaves...');
  const { chavePublica, chavePrivada } = await enviar('/api/assinatura/gerar-chaves', {});
  campo('chave-publica').value = chavePublica;
  campo('chave-privada').value = chavePrivada;
  mostrarAviso('aviso-chaves', 'sucesso', 'Par de chaves gerado! Agora Alice precisa de um certificado que comprove que essa chave pública é dela.');

  // Chaves novas invalidam o certificado e a assinatura anteriores
  campo('area-certificado').hidden = true;
  campo('certificado-recebido').value = '';
  limparAviso('aviso-certificado');
  wizard.bloquear(PASSO_CERTIFICADO);
  limparAssinatura();
  wizard.liberar(PASSO_CHAVES);
});

// ---------- Passo 2: certificado ----------

function montarTabelaCertificado(detalhes) {
  const linhas = [
    ['Titular', detalhes.titular],
    ['Emissor (quem assinou)', detalhes.emissor],
    ['Número de série', detalhes.numeroDeSerie],
    ['Válido de', formatarData(detalhes.validoDe)],
    ['Válido até', formatarData(detalhes.validoAte)],
    ['Chave pública', detalhes.algoritmoChave],
    ['Algoritmo da assinatura da AC', 'SHA-256 com RSA'],
    ['Impressão digital (SHA-256)', detalhes.impressaoDigitalSha256],
  ];
  const tabela = campo('tabela-certificado');
  tabela.innerHTML = '';
  for (const [nome, valor] of linhas) {
    const linha = tabela.insertRow();
    linha.insertCell().textContent = nome;
    linha.insertCell().textContent = valor;
  }
}

campo('btn-emitir').addEventListener('click', async () => {
  try {
    const { certificado, detalhes } = await enviar('/api/assinatura/emitir-certificado', {
      nome: campo('titular-nome').value,
      email: campo('titular-email').value,
      organizacao: campo('titular-organizacao').value,
      chavePublica: campo('chave-publica').value,
    });
    campo('certificado-pem').value = certificado;
    campo('certificado-recebido').value = certificado;
    montarTabelaCertificado(detalhes);
    campo('area-certificado').hidden = false;
    limparVerificacao();

    mostrarAviso('aviso-certificado', 'sucesso', 'Certificado emitido e assinado pela AC! Agora a chave pública da Alice tem uma identidade comprovada.');
    wizard.liberar(PASSO_CERTIFICADO);
  } catch (erro) {
    mostrarAviso('aviso-certificado', 'erro', erro.message);
  }
});

campo('btn-baixar-certificado').addEventListener('click', () => {
  baixarArquivo('certificado-alice.crt', campo('certificado-pem').value);
});

// ---------- Passo 3: assinar ----------

const entradaAssinar = configurarEntrada('assinar', limparAssinatura);

campo('btn-assinar').addEventListener('click', async () => {
  try {
    const dados = await entradaAssinar.obter();
    const { hash, assinatura } = await enviar('/api/assinatura/assinar', {
      dados: bytesParaBase64(dados.bytes),
      chavePrivada: campo('chave-privada').value,
    });
    dadosAssinados = dados;
    campo('hash-assinado').textContent = hash;
    campo('assinatura-gerada').textContent = assinatura;
    campo('assinatura-recebida').value = assinatura;
    campo('area-assinatura').hidden = false;
    limparVerificacao();

    mostrarAviso('aviso-assinar', 'sucesso', `"${dados.nome}" assinado com a chave privada da Alice! Clique em Próximo para enviar ao Bob.`);
    wizard.liberar(PASSO_ASSINAR);
  } catch (erro) {
    mostrarAviso('aviso-assinar', 'erro', erro.message);
  }
});

campo('btn-baixar-assinatura').addEventListener('click', () => {
  baixarArquivo(`${dadosAssinados.nome}.sig`, campo('assinatura-gerada').textContent);
});

// ---------- Passo 4: verificar ----------

const entradaVerificar = configurarEntrada('verificar', limparVerificacao);

campo('usar-mesmos-dados').addEventListener('change', () => {
  campo('area-outros-dados').hidden = campo('usar-mesmos-dados').checked;
  limparVerificacao();
});

campo('assinatura-recebida').addEventListener('input', limparVerificacao);
campo('certificado-recebido').addEventListener('input', limparVerificacao);

campo('arquivo-sig').addEventListener('change', async () => {
  const arquivo = campo('arquivo-sig').files[0];
  if (arquivo) campo('assinatura-recebida').value = (await arquivo.text()).trim();
  limparVerificacao();
});

campo('arquivo-crt').addEventListener('change', async () => {
  const arquivo = campo('arquivo-crt').files[0];
  if (arquivo) campo('certificado-recebido').value = await arquivo.text();
  limparVerificacao();
});

campo('btn-certificado-falso').addEventListener('click', async () => {
  const { certificado } = await enviar('/api/assinatura/emitir-certificado-falso', {
    nome: campo('titular-nome').value,
    email: campo('titular-email').value,
    organizacao: campo('titular-organizacao').value,
    chavePublica: campo('chave-publica').value,
  });
  campo('certificado-recebido').value = certificado;
  limparVerificacao();
  mostrarAviso(
    'aviso-verificar',
    'info',
    'Um impostor criou um certificado com o nome da Alice e da AC, mas assinado com a chave dele. Clique em Verificar.'
  );
});

function itemChecklist(ok, textoOk, textoFalha) {
  const item = document.createElement('li');
  item.className = ok ? 'ok' : 'falha';
  item.innerHTML = `<span class="marca">${ok ? '&#10003;' : '&#10007;'}</span>`;
  item.append(ok ? textoOk : textoFalha);
  return item;
}

campo('btn-verificar').addEventListener('click', async () => {
  try {
    const dados = campo('usar-mesmos-dados').checked ? dadosAssinados : await entradaVerificar.obter();
    const resultado = await enviar('/api/assinatura/verificar', {
      dados: bytesParaBase64(dados.bytes),
      assinatura: campo('assinatura-recebida').value,
      certificado: campo('certificado-recebido').value,
    });
    ultimaVerificacao = resultado;
    const { emitidoPelaAC, dentroDaValidade, assinaturaConfere } = resultado.verificacoes;

    const checklist = campo('checklist');
    checklist.innerHTML = '';
    checklist.append(
      itemChecklist(
        emitidoPelaAC,
        'O certificado foi emitido pela AC confiável (a assinatura da AC no certificado confere).',
        'O certificado NÃO foi emitido pela AC confiável: pode ser falsificado.'
      ),
      itemChecklist(
        dentroDaValidade,
        `O certificado está dentro da validade (até ${formatarData(resultado.certificado.validoAte)}).`,
        'O certificado está fora do período de validade.'
      ),
      itemChecklist(
        assinaturaConfere,
        'A assinatura confere com o hash do conteúdo, usando a chave pública do certificado.',
        'A assinatura NÃO confere: o conteúdo foi alterado ou não foi assinado com a chave deste certificado.'
      )
    );

    const elemento = campo('resultado');
    elemento.textContent = resultado.valida ? 'Assinatura VÁLIDA' : 'Assinatura INVÁLIDA';
    elemento.className = `resultado-grande ${resultado.valida ? 'confere' : 'nao-confere'}`;
    campo('area-verificacao').hidden = false;

    if (resultado.valida) {
      mostrarAviso('aviso-verificar', 'sucesso', 'Verificação concluída: o conteúdo é íntegro e foi assinado pelo titular do certificado.');
    } else {
      mostrarAviso('aviso-verificar', 'erro', 'Verificação concluída: não confie neste conteúdo.');
    }
    wizard.liberar(PASSO_VERIFICAR);
  } catch (erro) {
    mostrarAviso('aviso-verificar', 'erro', erro.message);
  }
});

// ---------- Passo 5: resumo ----------

function mostrarResumo() {
  if (ultimaVerificacao.valida) {
    mostrarAviso('aviso-resumo', 'sucesso', 'Bob tem certeza de que o conteúdo veio da Alice e não foi alterado.');
  } else {
    mostrarAviso('aviso-resumo', 'erro', 'A verificação falhou: Bob não deve confiar no conteúdo recebido.');
  }
}

campo('btn-baixar-ac').addEventListener('click', () => {
  baixarArquivo('ac-raiz-ifsp.crt', certificadoAC);
});

carregarAC();
