const PASSO_CIFRAR = 1;
const PASSO_ENVIO = 2;
const PASSO_DECIFRAR = 3;
const PASSO_RESUMO = 4;

const wizard = iniciarPassoAPasso(campo('wizard'), {
  aoMostrar(passo) {
    if (passo === PASSO_ENVIO) {
      mostrarAviso('aviso-envio', 'sucesso', 'Mensagem enviada! Ela está a caminho do Bob.');
    }
    if (passo === PASSO_RESUMO) {
      montarResumo();
    }
  },
});

async function gerarChave() {
  const { chave } = await enviar('/api/simetrica/gerar-chave', {});
  campo('chave').value = chave;
  campo('chave-bob').value = chave;
  mostrarAviso('aviso-chave', 'sucesso', 'Chave gerada! Alice e Bob guardaram uma cópia da mesma chave.');

  // Uma chave nova invalida a mensagem cifrada anteriormente
  campo('pacote').value = '';
  campo('mensagem-decifrada').value = '';
  limparAviso('aviso-cifrar');
  limparAviso('aviso-decifrar');
  wizard.bloquear(PASSO_CIFRAR);
  wizard.bloquear(PASSO_DECIFRAR);
}

campo('btn-gerar-chave').addEventListener('click', gerarChave);

campo('btn-cifrar').addEventListener('click', async () => {
  if (!campo('mensagem').value.trim()) {
    mostrarAviso('aviso-cifrar', 'erro', 'Digite uma mensagem antes de cifrar.');
    return;
  }
  try {
    const resultado = await enviar('/api/simetrica/cifrar', {
      mensagem: campo('mensagem').value,
      chave: campo('chave').value,
    });
    campo('pacote').value = resultado.pacote;
    campo('iv').value = resultado.iv;
    campo('tag').value = resultado.tag;
    campo('texto-cifrado').value = resultado.textoCifrado;
    campo('mensagem-decifrada').value = '';
    limparAviso('aviso-decifrar');
    wizard.bloquear(PASSO_DECIFRAR);

    mostrarAviso('aviso-cifrar', 'sucesso', 'Mensagem cifrada com sucesso! Clique em Próximo para enviá-la ao Bob.');
    wizard.liberar(PASSO_CIFRAR);
  } catch (erro) {
    mostrarAviso('aviso-cifrar', 'erro', erro.message);
  }
});

campo('btn-decifrar').addEventListener('click', async () => {
  campo('mensagem-decifrada').value = '';
  try {
    const { mensagem } = await enviar('/api/simetrica/decifrar', {
      pacote: campo('pacote').value,
      chave: campo('chave-bob').value,
    });
    campo('mensagem-decifrada').value = mensagem;
    mostrarAviso('aviso-decifrar', 'sucesso', 'Mensagem decifrada com sucesso! Bob conseguiu ler a mensagem da Alice.');
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
    mostrarAviso('aviso-resumo', 'sucesso', 'As mensagens são idênticas: a comunicação foi segura e íntegra.');
  } else {
    mostrarAviso('aviso-resumo', 'erro', 'Bob não leu a mensagem original: a chave estava errada ou a mensagem foi alterada.');
  }
}

gerarChave();
