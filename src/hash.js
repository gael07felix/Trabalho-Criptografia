const crypto = require('crypto');

function calcular(dados, algoritmo = 'sha256') {
  return crypto.createHash(algoritmo).update(dados).digest('hex');
}

// Devolve o SHA-256 (usado no projeto) e outros algoritmos para comparação
function gerar(dadosBase64) {
  const dados = Buffer.from(dadosBase64, 'base64');
  return {
    tamanhoBytes: dados.length,
    sha256: calcular(dados, 'sha256'),
    comparacao: {
      md5: calcular(dados, 'md5'),
      sha1: calcular(dados, 'sha1'),
      sha512: calcular(dados, 'sha512'),
    },
  };
}

// Aceita o hash puro ou uma linha no formato do sha256sum: "<hash>  <nome do arquivo>"
function normalizarHash(hashEsperado) {
  const hash = String(hashEsperado || '').trim().split(/\s+/)[0].toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) {
    throw new Error('O hash esperado deve ter 64 caracteres hexadecimais (SHA-256).');
  }
  return hash;
}

function verificar(dadosBase64, hashEsperado) {
  const esperado = normalizarHash(hashEsperado);
  const calculado = calcular(Buffer.from(dadosBase64, 'base64'));

  // timingSafeEqual compara em tempo constante, evitando ataques de temporização
  const confere = crypto.timingSafeEqual(Buffer.from(esperado, 'hex'), Buffer.from(calculado, 'hex'));

  return { confere, hashEsperado: esperado, hashCalculado: calculado };
}

module.exports = { gerar, verificar };
