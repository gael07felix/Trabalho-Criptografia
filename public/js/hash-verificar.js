const PASSO_HASH = 0;
const PASSO_RECEBIDO = 1;
const PASSO_VERIFICAR = 2;
const PASSO_CONCLUSAO = 3;

let ultimoResultado = null;

const wizard = iniciarPassoAPasso(campo('wizard'), {
  aoMostrar(passo) {
    if (passo === PASSO_CONCLUSAO) mostrarConclusao();
  },
});

function limparResultado() {
  ultimoResultado = null;
  campo('area-resultado').hidden = true;
  limparAviso('aviso-verificar');
  wizard.bloquear(PASSO_VERIFICAR);
}

// Aceita o hash puro ou uma linha do sha256sum: "<hash>  <nome do arquivo>"
function extrairHash(texto) {
  return texto.trim().split(/\s+/)[0].toLowerCase();
}

function validarHashEsperado() {
  limparResultado();
  const valor = campo('hash-esperado').value;
  if (!valor.trim()) {
    limparAviso('aviso-hash');
    wizard.bloquear(PASSO_HASH);
  } else if (/^[0-9a-f]{64}$/.test(extrairHash(valor))) {
    mostrarAviso('aviso-hash', 'sucesso', 'Hash válido! Clique em Próximo para informar os dados recebidos.');
    wizard.liberar(PASSO_HASH);
  } else {
    mostrarAviso('aviso-hash', 'erro', 'Hash inválido: um SHA-256 tem 64 caracteres hexadecimais (0-9 e a-f).');
    wizard.bloquear(PASSO_HASH);
  }
}

campo('hash-esperado').addEventListener('input', validarHashEsperado);

campo('arquivo-sha256').addEventListener('change', async () => {
  const arquivo = campo('arquivo-sha256').files[0];
  if (!arquivo) return;
  campo('hash-esperado').value = extrairHash(await arquivo.text());
  validarHashEsperado();
});

campo('btn-ultimo-hash').addEventListener('click', () => {
  const salvo = JSON.parse(localStorage.getItem('ultimoHash') || 'null');
  if (!salvo) {
    mostrarAviso('aviso-hash', 'erro', 'Nenhum hash foi gerado ainda. Use primeiro a tela "Gerar Hash".');
    return;
  }
  campo('hash-esperado').value = salvo.hash;
  validarHashEsperado();
  mostrarAviso('aviso-hash', 'sucesso', `Hash de "${salvo.nome}" carregado! Clique em Próximo.`);
});

const recebido = configurarEntrada('recebido', () => {
  limparResultado();
  if (recebido.temConteudo()) wizard.liberar(PASSO_RECEBIDO);
  else wizard.bloquear(PASSO_RECEBIDO);
});

campo('btn-verificar').addEventListener('click', async () => {
  try {
    const dados = await recebido.obter();
    const resultado = await enviar('/api/hash/verificar', {
      dados: bytesParaBase64(dados.bytes),
      hashEsperado: campo('hash-esperado').value,
    });
    ultimoResultado = resultado;

    const elemento = campo('resultado');
    elemento.textContent = resultado.confere ? 'O hash confere' : 'O hash NÃO confere';
    elemento.className = `resultado-grande ${resultado.confere ? 'confere' : 'nao-confere'}`;
    campo('resultado-esperado').textContent = resultado.hashEsperado;
    campo('resultado-calculado').textContent = resultado.hashCalculado;
    campo('area-resultado').hidden = false;

    if (resultado.confere) {
      mostrarAviso('aviso-verificar', 'sucesso', 'Verificação concluída: os dados estão íntegros.');
    } else {
      mostrarAviso('aviso-verificar', 'erro', 'Verificação concluída: os dados foram alterados ou não são os originais.');
    }
    wizard.liberar(PASSO_VERIFICAR);
  } catch (erro) {
    mostrarAviso('aviso-verificar', 'erro', erro.message);
  }
});

function mostrarConclusao() {
  if (ultimoResultado.confere) {
    mostrarAviso(
      'aviso-conclusao',
      'sucesso',
      'Os hashes são idênticos: a mensagem ou o arquivo recebido é exatamente igual ao original.'
    );
  } else {
    mostrarAviso(
      'aviso-conclusao',
      'erro',
      'Os hashes são diferentes: a mensagem ou o arquivo foi alterado no caminho (ou não é o mesmo). Não confie nele.'
    );
  }
}
