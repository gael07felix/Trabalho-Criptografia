const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

const { gerarParDeChaves } = require('./assimetrica');

const PASTA_AC = path.join(__dirname, '..', 'dados', 'ac');
const ARQUIVO_CHAVE_AC = path.join(PASTA_AC, 'ac-chave-privada.pem');
const ARQUIVO_CERTIFICADO_AC = path.join(PASTA_AC, 'ac-certificado.crt');

const DADOS_AC = {
  nome: 'AC Raiz IFSP - Segurança da Informação (simulada)',
  organizacao: 'IFSP',
};

// RSA-PSS com SHA-256 e sal do mesmo tamanho do hash (32 bytes)
const OPCOES_PSS = {
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
};

// Atributos com UTF8String para aceitar acentos nos nomes
function montarNomeDistinto({ nome, organizacao, email }) {
  const atributos = [
    { name: 'commonName', value: nome, valueTagClass: forge.asn1.Type.UTF8 },
    { name: 'organizationName', value: organizacao, valueTagClass: forge.asn1.Type.UTF8 },
    { name: 'countryName', value: 'BR' },
  ];
  if (email) atributos.push({ name: 'emailAddress', value: email });
  return atributos;
}

// O número de série precisa ser positivo: o primeiro bit do primeiro byte deve ser 0
function gerarNumeroDeSerie() {
  const bytes = crypto.randomBytes(16);
  bytes[0] &= 0x7f;
  return bytes.toString('hex');
}

/*
 * Autoridade Certificadora (AC) simulada.
 * É criada uma única vez e salva em disco, para que os certificados emitidos
 * continuem verificáveis mesmo depois de reiniciar o servidor.
 */
function criarAC() {
  const { chavePublica, chavePrivada } = gerarParDeChaves();
  const chavePrivadaForge = forge.pki.privateKeyFromPem(chavePrivada);

  const certificado = forge.pki.createCertificate();
  certificado.publicKey = forge.pki.publicKeyFromPem(chavePublica);
  certificado.serialNumber = gerarNumeroDeSerie();
  certificado.validity.notBefore = new Date();
  certificado.validity.notAfter = new Date();
  certificado.validity.notAfter.setFullYear(certificado.validity.notBefore.getFullYear() + 10);

  const nomeAC = montarNomeDistinto(DADOS_AC);
  certificado.setSubject(nomeAC);
  certificado.setIssuer(nomeAC); // Certificado raiz: emissor e titular são a própria AC
  certificado.setExtensions([
    { name: 'basicConstraints', cA: true, critical: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
    { name: 'subjectKeyIdentifier' },
  ]);
  certificado.sign(chavePrivadaForge, forge.md.sha256.create());

  fs.mkdirSync(PASTA_AC, { recursive: true });
  fs.writeFileSync(ARQUIVO_CHAVE_AC, chavePrivada);
  fs.writeFileSync(ARQUIVO_CERTIFICADO_AC, forge.pki.certificateToPem(certificado));
}

function carregarAC() {
  if (!fs.existsSync(ARQUIVO_CHAVE_AC) || !fs.existsSync(ARQUIVO_CERTIFICADO_AC)) {
    criarAC();
  }
  const certificadoPem = fs.readFileSync(ARQUIVO_CERTIFICADO_AC, 'utf8');
  const chavePrivadaPem = fs.readFileSync(ARQUIVO_CHAVE_AC, 'utf8');
  return {
    certificadoPem,
    certificado: new crypto.X509Certificate(certificadoPem),
    certificadoForge: forge.pki.certificateFromPem(certificadoPem),
    chavePrivadaForge: forge.pki.privateKeyFromPem(chavePrivadaPem),
  };
}

const ac = carregarAC();

function descreverCertificado(certificado) {
  return {
    titular: certificado.subject,
    emissor: certificado.issuer,
    numeroDeSerie: certificado.serialNumber,
    validoDe: new Date(certificado.validFrom).toISOString(),
    validoAte: new Date(certificado.validTo).toISOString(),
    algoritmoChave: `${certificado.publicKey.asymmetricKeyType.toUpperCase()} ${certificado.publicKey.asymmetricKeyDetails.modulusLength} bits`,
    impressaoDigitalSha256: certificado.fingerprint256,
  };
}

function obterAC() {
  return { certificado: ac.certificadoPem, detalhes: descreverCertificado(ac.certificado) };
}

function emitirCertificado(dadosTitular) {
  return montarCertificadoDoTitular(dadosTitular, ac.chavePrivadaForge);
}

// Simula um impostor: o certificado diz ter sido emitido pela AC, mas é assinado por outra chave
function emitirCertificadoFalso(dadosTitular) {
  const chavePrivadaImpostor = forge.pki.privateKeyFromPem(gerarParDeChaves().chavePrivada);
  return montarCertificadoDoTitular(dadosTitular, chavePrivadaImpostor);
}

function montarCertificadoDoTitular({ nome, email, organizacao, chavePublica }, chavePrivadaEmissor) {
  if (!nome || !nome.trim()) throw new Error('Informe o nome do titular do certificado.');

  let chavePublicaForge;
  try {
    chavePublicaForge = forge.pki.publicKeyFromPem(chavePublica);
  } catch {
    throw new Error('Chave pública inválida. Gere o par de chaves no passo 1.');
  }

  const certificado = forge.pki.createCertificate();
  certificado.publicKey = chavePublicaForge;
  certificado.serialNumber = gerarNumeroDeSerie();
  certificado.validity.notBefore = new Date();
  certificado.validity.notAfter = new Date();
  certificado.validity.notAfter.setFullYear(certificado.validity.notBefore.getFullYear() + 1);

  certificado.setSubject(
    montarNomeDistinto({
      nome: nome.trim(),
      organizacao: (organizacao || '').trim() || 'IFSP',
      email: (email || '').trim(),
    })
  );
  // O nome é remontado a partir da constante: reaproveitar os atributos lidos pelo
  // node-forge codificaria os acentos em UTF-8 duas vezes e o emissor não bateria com a AC
  certificado.setIssuer(montarNomeDistinto(DADOS_AC));
  certificado.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, nonRepudiation: true, critical: true },
    { name: 'subjectKeyIdentifier' },
    { name: 'authorityKeyIdentifier', keyIdentifier: ac.certificadoForge.generateSubjectKeyIdentifier().getBytes() },
  ]);

  // O emissor (normalmente a AC) assina o certificado com a chave privada dele
  certificado.sign(chavePrivadaEmissor, forge.md.sha256.create());

  const certificadoPem = forge.pki.certificateToPem(certificado);
  return {
    certificado: certificadoPem,
    detalhes: descreverCertificado(new crypto.X509Certificate(certificadoPem)),
  };
}

function assinar(dadosBase64, chavePrivadaPem) {
  const dados = Buffer.from(dadosBase64, 'base64');
  let assinatura;
  try {
    assinatura = crypto.sign('sha256', dados, { key: chavePrivadaPem, ...OPCOES_PSS });
  } catch {
    throw new Error('Chave privada inválida.');
  }
  return {
    hash: crypto.createHash('sha256').update(dados).digest('hex'),
    assinatura: assinatura.toString('base64'),
  };
}

function verificar(dadosBase64, assinaturaBase64, certificadoPem) {
  let certificado;
  try {
    certificado = new crypto.X509Certificate(certificadoPem);
  } catch {
    throw new Error('Certificado inválido: não está no formato PEM esperado.');
  }

  const dados = Buffer.from(dadosBase64, 'base64');
  const agora = new Date();

  // 1. O certificado foi emitido (assinado) pela nossa AC confiável?
  const emitidoPelaAC = certificado.checkIssued(ac.certificado) && certificado.verify(ac.certificado.publicKey);

  // 2. O certificado está dentro do período de validade?
  const dentroDaValidade = agora >= new Date(certificado.validFrom) && agora <= new Date(certificado.validTo);

  // 3. A assinatura confere com os dados, usando a chave pública que está no certificado?
  let assinaturaConfere = false;
  try {
    assinaturaConfere = crypto.verify(
      'sha256',
      dados,
      { key: certificado.publicKey, ...OPCOES_PSS },
      Buffer.from(assinaturaBase64 || '', 'base64')
    );
  } catch {
    assinaturaConfere = false;
  }

  return {
    valida: emitidoPelaAC && dentroDaValidade && assinaturaConfere,
    verificacoes: { emitidoPelaAC, dentroDaValidade, assinaturaConfere },
    hash: crypto.createHash('sha256').update(dados).digest('hex'),
    certificado: descreverCertificado(certificado),
  };
}

module.exports = { gerarParDeChaves, obterAC, emitirCertificado, emitirCertificadoFalso, assinar, verificar };
