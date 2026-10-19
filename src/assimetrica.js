const crypto = require('crypto');

const TAMANHO_CHAVE_BITS = 2048;

// Com RSA-2048 e padding OAEP com SHA-256, o maior bloco cifrável é
// 256 bytes (tamanho da chave) - 2 * 32 bytes (hash) - 2 = 190 bytes
const TAMANHO_MAXIMO_MENSAGEM = 190;

const OPCOES_PADDING = {
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha256',
};

function gerarParDeChaves() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: TAMANHO_CHAVE_BITS,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { chavePublica: publicKey, chavePrivada: privateKey };
}

function cifrar(mensagem, chavePublicaPem) {
  const dados = Buffer.from(mensagem, 'utf8');
  if (dados.length > TAMANHO_MAXIMO_MENSAGEM) {
    throw new Error(
      `A mensagem tem ${dados.length} bytes. O RSA-2048 só cifra até ${TAMANHO_MAXIMO_MENSAGEM} bytes por vez.`
    );
  }

  try {
    const textoCifrado = crypto.publicEncrypt({ key: chavePublicaPem, ...OPCOES_PADDING }, dados);
    return { textoCifrado: textoCifrado.toString('base64') };
  } catch {
    throw new Error('Chave pública inválida.');
  }
}

function decifrar(textoCifradoBase64, chavePrivadaPem) {
  try {
    const mensagem = crypto.privateDecrypt(
      { key: chavePrivadaPem, ...OPCOES_PADDING },
      Buffer.from(textoCifradoBase64, 'base64')
    );
    return mensagem.toString('utf8');
  } catch {
    throw new Error('Falha ao decifrar: a chave não é a chave privada correta ou a mensagem foi alterada.');
  }
}

module.exports = { gerarParDeChaves, cifrar, decifrar, TAMANHO_MAXIMO_MENSAGEM };
