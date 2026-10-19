const express = require('express');
const path = require('path');

const simetrica = require('./src/simetrica');
const assimetrica = require('./src/assimetrica');
const hash = require('./src/hash');
const assinatura = require('./src/assinatura');

const app = express();
const PORTA = 3000;

// Permite ler o corpo das requisições enviadas em JSON pelo fetch do front-end.
// Arquivos são enviados em Base64, que ocupa cerca de 33% a mais que o original.
app.use(express.json({ limit: '30mb' }));

// Serve os arquivos da pasta public (HTML, CSS e JS das telas)
app.use(express.static(path.join(__dirname, 'public')));

// Rota de teste para confirmar que o servidor está respondendo
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', mensagem: 'Servidor de criptografia funcionando' });
});

// ---------- Criptografia simétrica (AES-256-GCM) ----------

app.post('/api/simetrica/gerar-chave', (req, res) => {
  res.json({ chave: simetrica.gerarChave() });
});

app.post('/api/simetrica/cifrar', (req, res) => {
  try {
    const { mensagem, chave } = req.body;
    res.json(simetrica.cifrar(mensagem, chave));
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

app.post('/api/simetrica/decifrar', (req, res) => {
  try {
    const { pacote, chave } = req.body;
    res.json({ mensagem: simetrica.decifrar(pacote, chave) });
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

// ---------- Criptografia assimétrica (RSA-2048) ----------

app.post('/api/assimetrica/gerar-chaves', (req, res) => {
  res.json(assimetrica.gerarParDeChaves());
});

app.post('/api/assimetrica/cifrar', (req, res) => {
  try {
    const { mensagem, chavePublica } = req.body;
    res.json(assimetrica.cifrar(mensagem, chavePublica));
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

app.post('/api/assimetrica/decifrar', (req, res) => {
  try {
    const { textoCifrado, chavePrivada } = req.body;
    res.json({ mensagem: assimetrica.decifrar(textoCifrado, chavePrivada) });
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

// ---------- Hash (SHA-256) ----------

app.post('/api/hash/gerar', (req, res) => {
  try {
    res.json(hash.gerar(req.body.dados));
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

app.post('/api/hash/verificar', (req, res) => {
  try {
    const { dados, hashEsperado } = req.body;
    res.json(hash.verificar(dados, hashEsperado));
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

// ---------- Assinatura digital e certificado X.509 ----------

app.post('/api/assinatura/gerar-chaves', (req, res) => {
  res.json(assinatura.gerarParDeChaves());
});

app.get('/api/assinatura/ac', (req, res) => {
  res.json(assinatura.obterAC());
});

app.post('/api/assinatura/emitir-certificado', (req, res) => {
  try {
    res.json(assinatura.emitirCertificado(req.body));
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

app.post('/api/assinatura/emitir-certificado-falso', (req, res) => {
  try {
    res.json(assinatura.emitirCertificadoFalso(req.body));
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

app.post('/api/assinatura/assinar', (req, res) => {
  try {
    const { dados, chavePrivada } = req.body;
    res.json(assinatura.assinar(dados, chavePrivada));
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

app.post('/api/assinatura/verificar', (req, res) => {
  try {
    const { dados, assinatura: assinaturaBase64, certificado } = req.body;
    res.json(assinatura.verificar(dados, assinaturaBase64, certificado));
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
