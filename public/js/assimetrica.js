const PASSO_CHAVES = 0;
const PASSO_CIFRAR = 1;
const PASSO_ESPIAO = 2;
const PASSO_DECIFRAR = 3;
const PASSO_RESUMO = 4;

const TAMANHO_MAXIMO = 190;

const wizard = iniciarPassoAPasso(campo('wizard'), {
  aoMostrar(passo) {
    if (passo === PASSO_ESPIAO) {
      mostrarAviso('aviso-envio', 'sucesso', 'Mensagem enviada! Ela está a caminho do Bob... mas foi interceptada.');
    }
    if (passo === PASSO_RESUMO) {
      montarResumo();
    }
  },
});

campo('btn-gerar-chaves').addEventListener('click', async () => {
  mostrarAviso('aviso-chaves', 'info', 'Gerando o par de chaves...');
  const { chavePublica, chavePrivada } = await enviar('/api/assimetrica/gerar-chaves', {});

  campo('chave-publica').value = chavePublica;
  campo('chave-privada').value = chavePrivada;
  campo('chave-publica-alice').value = chavePublica;
  campo('chave-privada-bob').value = chavePrivada;
  mostrarAviso('aviso-chaves', 'sucesso', 'Par de chaves gerado! Bob divulgou a chave pública e guardou a privada.');

  // Um par novo invalida a mensagem cifrada anteriormente
  campo('texto-cifrado').value = '';
  campo('mensagem-decifrada').value = '';
  limparAviso('aviso-cifrar');
  limparAviso('aviso-espiao');
  limparAviso('aviso-decifrar');
  wizard.liberar(PASSO_CHAVES);
  wizard.bloquear(PASSO_CIFRAR);
  wizard.bloquear(PASSO_DECIFRAR);
});

campo('mensagem').addEventListener('input', () => {
  const bytes = new TextEncoder().encode(campo('mensagem').value).length;
  const contador = campo('contador-bytes');
  contador.textContent = `${bytes} de ${TAMANHO_MAXIMO} bytes`;
  contador.classList.toggle('erro', bytes > TAMANHO_MAXIMO);
});

campo('btn-cifrar').addEventListener('click', async () => {
  if (!campo('mensagem').value.trim()) {
    mostrarAviso('aviso-cifrar', 'erro', 'Digite uma mensagem antes de cifrar.');
    return;
  }
  try {
    const { textoCifrado } = await enviar('/api/assimetrica/cifrar', {
      mensagem: campo('mensagem').value,
      chavePublica: campo('chave-publica-alice').value,
    });
    campo('texto-cifrado').value = textoCifrado;
    campo('mensagem-decifrada').value = '';
    limparAviso('aviso-espiao');
    limparAviso('aviso-decifrar');
    wizard.bloquear(PASSO_DECIFRAR);

    mostrarAviso('aviso-cifrar', 'sucesso', 'Mensagem cifrada com a chave pública do Bob! Clique em Próximo para enviá-la.');
    wizard.liberar(PASSO_CIFRAR);
  } catch (erro) {
    mostrarAviso('aviso-cifrar', 'erro', erro.message);
  }
});

campo('btn-espiao').addEventListener('click', async () => {
  try {
    await enviar('/api/assimetrica/decifrar', {
      textoCifrado: campo('texto-cifrado').value,
      chavePrivada: campo('chave-publica').value,
    });
    mostrarAviso('aviso-espiao', 'erro', 'O espião conseguiu decifrar! Isso não deveria acontecer.');
  } catch {
    mostrarAviso(
      'aviso-espiao',
      'sucesso',
      'O espião falhou! A chave pública só serve para cifrar. Para decifrar, é preciso a chave privada do Bob.'
    );
  }
});

campo('btn-chave-errada').addEventListener('click', async () => {
  const { chavePrivada } = await enviar('/api/assimetrica/gerar-chaves', {});
  campo('chave-privada-bob').value = chavePrivada;
  mostrarAviso('aviso-decifrar', 'info', 'A chave privada foi trocada pela de outro par. Clique em Decifrar para ver o que acontece.');
});

campo('btn-decifrar').addEventListener('click', async () => {
  campo('mensagem-decifrada').value = '';
  try {
    const { mensagem } = await enviar('/api/assimetrica/decifrar', {
      textoCifrado: campo('texto-cifrado').value,
      chavePrivada: campo('chave-privada-bob').value,
    });
    campo('mensagem-decifrada').value = mensagem;
    mostrarAviso('aviso-decifrar', 'sucesso', 'Mensagem decifrada com a chave privada! Só o Bob conseguiria fazer isso.');
  } catch (erro) {
    mostrarAviso('aviso-decifrar', 'erro', erro.message);
  }
  wizard.liberar(PASSO_DECIFRAR);
});

function montarResumo() {
  const original = campo('mensagem').value;
  const decifrada = campo('mensagem-decifrada').value;
  campo('resumo-original').value = original;
  campo('resumo-decifrada').value = decifrada || '(Bob não conseguiu decifrar)';

  if (decifrada === original) {
    mostrarAviso('aviso-resumo', 'sucesso', 'As mensagens são idênticas: só o dono da chave privada conseguiu ler.');
  } else {
    mostrarAviso('aviso-resumo', 'erro', 'Bob não leu a mensagem original: a chave privada estava errada ou a mensagem foi alterada.');
  }
}
