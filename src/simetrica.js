const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';
const TAMANHO_CHAVE = 32; // 32 bytes = 256 bits
const TAMANHO_IV = 12; // 12 bytes = 96 bits, tamanho recomendado para o GCM
const TAMANHO_TAG = 16; // 16 bytes = 128 bits

function gerarChave() {
  return crypto.randomBytes(TAMANHO_CHAVE).toString('hex');
}

function converterChave(chaveHex) {
  const chave = Buffer.from(chaveHex, 'hex');
  if (chave.length !== TAMANHO_CHAVE) {
    throw new Error('A chave deve ter 64 caracteres hexadecimais (256 bits).');
  }
  return chave;
}

// O pacote junta IV + tag + texto cifrado em um único valor Base64,
// que é o que de fato seria enviado ao destinatário
function cifrar(mensagem, chaveHex) {
  const chave = converterChave(chaveHex);
  const iv = crypto.randomBytes(TAMANHO_IV);

  const cifrador = crypto.createCipheriv(ALGORITMO, chave, iv);
  const textoCifrado = Buffer.concat([
    cifrador.update(mensagem, 'utf8'),
    cifrador.final(),
  ]);
  const tag = cifrador.getAuthTag();

  return {
    pacote: Buffer.concat([iv, tag, textoCifrado]).toString('base64'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    textoCifrado: textoCifrado.toString('base64'),
  };
}

function decifrar(pacoteBase64, chaveHex) {
  const chave = converterChave(chaveHex);
  const pacote = Buffer.from(pacoteBase64, 'base64');

  if (pacote.length < TAMANHO_IV + TAMANHO_TAG) {
    throw new Error('Mensagem cifrada inválida ou incompleta.');
  }

  const iv = pacote.subarray(0, TAMANHO_IV);
  const tag = pacote.subarray(TAMANHO_IV, TAMANHO_IV + TAMANHO_TAG);
  const textoCifrado = pacote.subarray(TAMANHO_IV + TAMANHO_TAG);

  const decifrador = crypto.createDecipheriv(ALGORITMO, chave, iv);
  decifrador.setAuthTag(tag);

  try {
    const mensagem = Buffer.concat([
      decifrador.update(textoCifrado),
      decifrador.final(),
    ]);
    return mensagem.toString('utf8');
  } catch {
    // O GCM falha aqui se a chave estiver errada ou se algum dado foi alterado
    throw new Error('Falha ao decifrar: chave incorreta ou mensagem alterada.');
  }
}

module.exports = { gerarChave, cifrar, decifrar };
