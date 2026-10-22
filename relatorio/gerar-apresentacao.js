const path = require('path');
const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Gael Felix, Guilherme Bertero, Guilherme Francisco e João Gabriel';
pptx.company = 'IFSP — Campus Cubatão';
pptx.subject = 'Segurança da Informação';
pptx.title = 'Criptografia, Hash e Assinatura Digital';
pptx.lang = 'pt-BR';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'pt-BR',
};

const OUT = path.join(__dirname, 'Apresentacao-Criptografia-Hash-Assinatura-Digital.pptx');
const IMG = (name) => path.join(__dirname, '..', 'public', 'images', name);

const C = {
  bg: '06130F',
  panel: '0C241B',
  panel2: '122E23',
  green: '43E58F',
  green2: '79F1B0',
  blue: '61A5FF',
  purple: 'B989FF',
  orange: 'FFB060',
  white: 'F5F8F6',
  muted: 'A7BBB2',
  dim: '60776D',
  line: '24463A',
  dark: '020A07',
  red: 'FF6B6B',
};

const SH = pptx.ShapeType;
const SLIDE_COUNT = 12;

function addImage(slide, file, x, y, w, h, type = 'cover', options = {}) {
  slide.addImage({
    path: IMG(file), x, y, w, h,
    sizing: { type, w, h },
    transparency: options.transparency,
    rounding: options.rounding,
    shadow: options.shadow,
  });
}

function addBase(slide, number, section, speaker, accent = C.green) {
  slide.background = { color: C.bg };
  for (let x = 0.4; x < 13.3; x += 0.72) {
    slide.addShape(SH.line, { x, y: 0, w: 0, h: 7.5, line: { color: '113026', transparency: 56, width: 0.45 } });
  }
  for (let y = 0.42; y < 7.5; y += 0.72) {
    slide.addShape(SH.line, { x: 0, y, w: 13.33, h: 0, line: { color: '113026', transparency: 56, width: 0.45 } });
  }
  slide.addShape(SH.rect, { x: 0, y: 0, w: 13.33, h: 0.055, fill: { color: accent }, line: { color: accent } });
  slide.addText(section.toUpperCase(), { x: 0.58, y: 0.23, w: 4.2, h: 0.25, fontFace: 'Aptos', fontSize: 8.5, bold: true, charSpacing: 1.7, color: accent, margin: 0 });
  slide.addText(speaker, { x: 0.58, y: 7.13, w: 4.7, h: 0.18, fontSize: 8.5, color: C.muted, bold: true, margin: 0 });
  slide.addText(`${String(number).padStart(2, '0')} / ${SLIDE_COUNT}`, { x: 11.9, y: 7.12, w: 0.82, h: 0.18, fontSize: 8.5, color: C.muted, align: 'right', margin: 0 });
  slide.addShape(SH.line, { x: 0.58, y: 6.98, w: 12.14, h: 0, line: { color: C.line, width: 0.7 } });
  slide.addShape(SH.line, { x: 0.58, y: 6.98, w: 12.14 * (number / SLIDE_COUNT), h: 0, line: { color: accent, width: 1.5 } });
}

function addTitle(slide, kicker, title, subtitle, accent = C.green, opts = {}) {
  if (kicker) slide.addText(kicker.toUpperCase(), { x: opts.x || 0.68, y: opts.y || 0.66, w: opts.w || 5.6, h: 0.24, fontSize: 9, bold: true, charSpacing: 1.8, color: accent, margin: 0 });
  slide.addText(title, { x: opts.x || 0.68, y: (opts.y || 0.66) + 0.34, w: opts.w || 6.2, h: opts.titleH || 0.9, fontFace: 'Aptos Display', fontSize: opts.size || 30, bold: true, color: C.white, margin: 0, breakLine: false, fit: 'shrink', valign: 'mid' });
  if (subtitle) slide.addText(subtitle, { x: opts.x || 0.68, y: (opts.y || 0.66) + (opts.titleH || 0.9) + 0.48, w: opts.w || 6.1, h: opts.subH || 0.7, fontSize: opts.subSize || 14, color: C.muted, margin: 0, breakLine: false, fit: 'shrink', valign: 'top', lineSpacingMultiple: 1.05 });
}

function pill(slide, text, x, y, w, color = C.green, darkText = true) {
  slide.addShape(SH.roundRect, { x, y, w, h: 0.34, rectRadius: 0.08, fill: { color }, line: { color }, radius: 0.08 });
  slide.addText(text, { x: x + 0.08, y: y + 0.085, w: w - 0.16, h: 0.14, align: 'center', fontSize: 8, bold: true, color: darkText ? C.dark : C.white, margin: 0 });
}

function card(slide, x, y, w, h, title, body, accent = C.green, number) {
  slide.addShape(SH.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: C.panel, transparency: 4 }, line: { color: C.line, width: 1 } });
  slide.addShape(SH.roundRect, { x: x + 0.22, y: y + 0.22, w: 0.48, h: 0.48, rectRadius: 0.08, fill: { color: accent, transparency: 84 }, line: { color: accent, transparency: 35, width: 1 } });
  slide.addText(number || '•', { x: x + 0.22, y: y + 0.325, w: 0.48, h: 0.16, fontSize: number ? 10 : 16, bold: true, color: accent, align: 'center', margin: 0 });
  slide.addText(title, { x: x + 0.22, y: y + 0.88, w: w - 0.44, h: 0.35, fontSize: 16, bold: true, color: C.white, margin: 0, fit: 'shrink' });
  slide.addText(body, { x: x + 0.22, y: y + 1.32, w: w - 0.44, h: h - 1.52, fontSize: 11.5, color: C.muted, margin: 0, fit: 'shrink', valign: 'top' });
}

function imageCard(slide, file, x, y, w, h, type = 'cover') {
  slide.addShape(SH.roundRect, { x, y, w, h, rectRadius: 0.1, fill: { color: C.panel2 }, line: { color: C.line, width: 1 } });
  addImage(slide, file, x + 0.06, y + 0.06, w - 0.12, h - 0.12, type, { rounding: true, shadow: { type: 'outer', color: '000000', opacity: 0.24, blur: 2, angle: 45, distance: 1 } });
}

function stepRow(slide, items, x, y, w, accent = C.green) {
  const gap = 0.2;
  const itemW = (w - gap * (items.length - 1)) / items.length;
  items.forEach((item, index) => {
    const px = x + index * (itemW + gap);
    slide.addShape(SH.roundRect, { x: px, y, w: itemW, h: 0.9, rectRadius: 0.07, fill: { color: C.panel }, line: { color: C.line, width: 1 } });
    slide.addText(String(index + 1).padStart(2, '0'), { x: px + 0.14, y: y + 0.16, w: 0.35, h: 0.15, fontSize: 8, bold: true, color: accent, margin: 0 });
    slide.addText(item, { x: px + 0.14, y: y + 0.39, w: itemW - 0.28, h: 0.31, fontSize: 10.5, bold: true, color: C.white, margin: 0, fit: 'shrink', valign: 'mid' });
  });
}

// 01 — Capa
{
  const slide = pptx.addSlide();
  slide.background = { color: C.bg };
  addImage(slide, 'hero-apresentacao-criptografia-v2.png', 0, 0, 13.33, 7.5, 'cover');
  slide.addShape(SH.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: C.dark, transparency: 38 }, line: { color: C.dark, transparency: 100 } });
  slide.addShape(SH.rect, { x: 0, y: 0, w: 7.6, h: 7.5, fill: { color: C.dark, transparency: 8 }, line: { color: C.dark, transparency: 100 } });
  slide.addImage({ path: IMG('logo-ifsp-cubatao-transparent.png'), x: 0.72, y: 0.48, w: 2.05, h: 0.74, sizing: { type: 'contain', w: 2.05, h: 0.74 } });
  slide.addText('SEGURANÇA DA INFORMAÇÃO', { x: 0.74, y: 1.62, w: 4.4, h: 0.24, fontSize: 9, bold: true, charSpacing: 2.1, color: C.green, margin: 0 });
  slide.addText('Criptografia, hash\ne assinatura digital', { x: 0.72, y: 2.02, w: 6.8, h: 1.75, fontFace: 'Aptos Display', fontSize: 38, bold: true, color: C.white, margin: 0, breakLine: false, fit: 'shrink' });
  slide.addText('Como proteger dados, verificar integridade e comprovar autoria por meio de aplicações interativas.', { x: 0.76, y: 4.03, w: 5.75, h: 0.78, fontSize: 16, color: 'D5E3DC', margin: 0, fit: 'shrink' });
  pill(slide, 'APRESENTAÇÃO · 15 MIN', 0.76, 5.08, 1.9, C.green);
  slide.addText('Gael Felix  ·  Guilherme Bertero  ·  Guilherme Francisco  ·  João Gabriel', { x: 0.76, y: 6.56, w: 8.7, h: 0.22, fontSize: 10, color: C.white, bold: true, margin: 0 });
  slide.addNotes('Gael Felix — abertura. Apresentar o grupo, o tema e o objetivo: compreender criptografia, hash e assinatura digital com demonstrações interativas.');
}

// 02 — Conceitos essenciais
{
  const slide = pptx.addSlide();
  addBase(slide, 2, 'Conceitos essenciais', 'Gael Felix · 1min20', C.green);
  addTitle(slide, 'O que precisamos proteger?', 'Três objetivos orientam todo o projeto', 'Cada técnica responde a uma necessidade diferente da segurança da informação.', C.green, { w: 7.1, titleH: 0.62, size: 27, subH: 0.46, subSize: 13 });
  imageCard(slide, 'conceitos-seguranca-informacao.png', 0.68, 2.42, 4.1, 4.03, 'cover');
  card(slide, 5.08, 2.42, 2.38, 4.03, 'Confidencialidade', 'Somente pessoas autorizadas conseguem compreender o conteúdo.', C.green, '01');
  card(slide, 7.62, 2.42, 2.38, 4.03, 'Integridade', 'Qualquer alteração na mensagem ou no arquivo pode ser identificada.', C.blue, '02');
  card(slide, 10.16, 2.42, 2.38, 4.03, 'Autenticidade', 'A origem do conteúdo e a identidade do autor podem ser confirmadas.', C.purple, '03');
  slide.addNotes('Gael Felix — explicar rapidamente confidencialidade, integridade e autenticidade. Diferenciar: criptografia protege o conteúdo; hash detecta alterações; assinatura digital comprova autoria e integridade.');
}

// 03 — Tecnologias
{
  const slide = pptx.addSlide();
  addBase(slide, 3, 'Construção da aplicação', 'Gael Felix · 1min10', C.blue);
  addTitle(slide, 'Por que essas tecnologias?', 'Uma arquitetura simples, didática e confiável', 'A interface explica o processo; o servidor executa as operações criptográficas.', C.blue, { w: 7.4, titleH: 0.62, size: 28, subH: 0.46, subSize: 13 });
  const techs = [
    ['HTML · CSS · JS', 'Interfaces interativas executadas diretamente no navegador.', C.green, '01'],
    ['Node.js', 'JavaScript também no servidor, mantendo uma única linguagem no projeto.', C.blue, '02'],
    ['Express', 'Recebe requisições, organiza as rotas da API e devolve os resultados.', C.orange, '03'],
    ['crypto + node-forge', 'Algoritmos nativos confiáveis e criação de certificados X.509.', C.purple, '04'],
  ];
  techs.forEach((t, i) => card(slide, 0.68 + i * 3.02, 2.55, 2.82, 3.15, t[0], t[1], t[2], t[3]));
  slide.addShape(SH.roundRect, { x: 1.06, y: 6.03, w: 11.16, h: 0.55, rectRadius: 0.08, fill: { color: '0A1C15' }, line: { color: C.line, width: 1 } });
  slide.addText('NAVEGADOR', { x: 1.28, y: 6.23, w: 1.2, h: 0.14, fontSize: 8.5, bold: true, color: C.green, align: 'center', margin: 0 });
  slide.addText('→', { x: 2.54, y: 6.14, w: 0.4, h: 0.22, fontSize: 14, bold: true, color: C.dim, align: 'center', margin: 0 });
  slide.addText('EXPRESS / API', { x: 3.05, y: 6.23, w: 1.3, h: 0.14, fontSize: 8.5, bold: true, color: C.orange, align: 'center', margin: 0 });
  slide.addText('→', { x: 4.45, y: 6.14, w: 0.4, h: 0.22, fontSize: 14, bold: true, color: C.dim, align: 'center', margin: 0 });
  slide.addText('LÓGICA CRIPTOGRÁFICA', { x: 4.93, y: 6.23, w: 2.15, h: 0.14, fontSize: 8.5, bold: true, color: C.purple, align: 'center', margin: 0 });
  slide.addText('→', { x: 7.17, y: 6.14, w: 0.4, h: 0.22, fontSize: 14, bold: true, color: C.dim, align: 'center', margin: 0 });
  slide.addText('RESULTADO EM JSON', { x: 7.66, y: 6.23, w: 1.8, h: 0.14, fontSize: 8.5, bold: true, color: C.blue, align: 'center', margin: 0 });
  slide.addText('→', { x: 9.57, y: 6.14, w: 0.4, h: 0.22, fontSize: 14, bold: true, color: C.dim, align: 'center', margin: 0 });
  slide.addText('TELA ATUALIZADA', { x: 10.08, y: 6.23, w: 1.62, h: 0.14, fontSize: 8.5, bold: true, color: C.green, align: 'center', margin: 0 });
  slide.addNotes('Gael Felix — explicar as escolhas: HTML/CSS/JS para telas; Node.js para executar JavaScript no servidor; Express para criar o servidor, receber requisições e organizar rotas; crypto para AES, RSA, SHA-256 e assinaturas; node-forge porque o crypto valida, mas não cria certificados X.509.');
}

// 04 — Simétrica
{
  const slide = pptx.addSlide();
  addBase(slide, 4, 'Criptografia simétrica', 'Guilherme Bertero · 1min35', C.green);
  addTitle(slide, 'AES-256-GCM', 'Uma chave para cifrar e decifrar', 'Rápida para grandes volumes, mas exige que a chave secreta seja compartilhada com segurança.', C.green, { w: 5.05, titleH: 0.65, size: 30, subH: 0.8, subSize: 13.5 });
  imageCard(slide, 'fluxo-criptografia-simetrica.png', 6.05, 0.72, 6.6, 4.55, 'cover');
  pill(slide, 'MESMA CHAVE', 0.7, 2.75, 1.45, C.green);
  slide.addText('Alice', { x: 0.72, y: 3.35, w: 1.1, h: 0.28, fontSize: 19, bold: true, color: C.white, margin: 0 });
  slide.addText('mensagem', { x: 0.72, y: 3.75, w: 1.15, h: 0.2, fontSize: 10, color: C.muted, margin: 0 });
  slide.addText('→', { x: 2.05, y: 3.38, w: 0.55, h: 0.3, fontSize: 22, bold: true, color: C.green, align: 'center', margin: 0 });
  slide.addShape(SH.roundRect, { x: 2.75, y: 3.1, w: 1.28, h: 0.95, rectRadius: 0.08, fill: { color: C.panel2 }, line: { color: C.green, width: 1.2 } });
  slide.addText('AES', { x: 2.75, y: 3.33, w: 1.28, h: 0.22, fontSize: 18, bold: true, color: C.green, align: 'center', margin: 0 });
  slide.addText('→', { x: 4.2, y: 3.38, w: 0.55, h: 0.3, fontSize: 22, bold: true, color: C.green, align: 'center', margin: 0 });
  slide.addText('Bob', { x: 4.93, y: 3.35, w: 0.9, h: 0.28, fontSize: 19, bold: true, color: C.white, align: 'right', margin: 0 });
  slide.addText('mensagem', { x: 4.68, y: 3.75, w: 1.15, h: 0.2, fontSize: 10, color: C.muted, align: 'right', margin: 0 });
  stepRow(slide, ['Combinar chave', 'Cifrar', 'Transmitir', 'Decifrar'], 0.7, 5.56, 11.95, C.green);
  slide.addNotes('Guilherme Bertero — mesma chave para cifrar e decifrar. AES-256 indica chave de 256 bits; GCM adiciona autenticação e detecta alterações. Vantagem: velocidade. Desafio: distribuição segura da chave.');
}

// 05 — Elementos do AES-GCM
{
  const slide = pptx.addSlide();
  addBase(slide, 5, 'Criptografia simétrica', 'Guilherme Bertero · 1min50', C.green);
  addTitle(slide, 'Demonstração', 'O pacote cifrado possui três partes', 'Apenas a chave é secreta. O IV e a tag acompanham o texto cifrado.', C.green, { w: 7.2, titleH: 0.62, size: 28, subH: 0.42, subSize: 13 });
  imageCard(slide, 'simetrica-passo-1.png', 0.68, 2.33, 3.75, 2.45, 'cover');
  imageCard(slide, 'simetrica-passo-2.png', 4.78, 2.33, 3.75, 2.45, 'cover');
  imageCard(slide, 'simetrica-passo-4.png', 8.88, 2.33, 3.75, 2.45, 'cover');
  card(slide, 0.68, 5.03, 3.75, 1.43, 'Chave · 256 bits', 'Secreta. Cifra e decifra.', C.green, 'K');
  card(slide, 4.78, 5.03, 3.75, 1.43, 'IV · 96 bits', 'Aleatório. Evita resultados repetidos.', C.blue, 'IV');
  card(slide, 8.88, 5.03, 3.75, 1.43, 'Tag · 128 bits', 'Detecta chave errada ou conteúdo alterado.', C.orange, 'T');
  slide.addNotes('Guilherme Bertero — mostrar na aplicação: geração da chave, cifragem e decifragem. Explicar que IV e tag não precisam ser secretos. Demonstrar que uma chave errada ou uma alteração no pacote faz a autenticação falhar.');
}

// 06 — Assimétrica
{
  const slide = pptx.addSlide();
  addBase(slide, 6, 'Criptografia assimétrica', 'Guilherme Francisco · 1min20', C.blue);
  imageCard(slide, 'fluxo-criptografia-assimetrica.png', 6.15, 0.7, 6.48, 4.6, 'cover');
  addTitle(slide, 'RSA-2048 + OAEP', 'Duas chaves, funções diferentes', 'A pública pode ser compartilhada. A privada permanece somente com o proprietário.', C.blue, { w: 5.1, titleH: 0.72, size: 28, subH: 0.75, subSize: 13 });
  slide.addShape(SH.roundRect, { x: 0.72, y: 3.0, w: 2.35, h: 1.45, rectRadius: 0.08, fill: { color: C.blue, transparency: 83 }, line: { color: C.blue, width: 1.2 } });
  slide.addText('CHAVE PÚBLICA', { x: 0.92, y: 3.28, w: 1.95, h: 0.2, fontSize: 10, bold: true, color: C.blue, align: 'center', margin: 0 });
  slide.addText('cifra', { x: 0.92, y: 3.73, w: 1.95, h: 0.25, fontSize: 19, bold: true, color: C.white, align: 'center', margin: 0 });
  slide.addShape(SH.roundRect, { x: 3.38, y: 3.0, w: 2.35, h: 1.45, rectRadius: 0.08, fill: { color: C.purple, transparency: 83 }, line: { color: C.purple, width: 1.2 } });
  slide.addText('CHAVE PRIVADA', { x: 3.58, y: 3.28, w: 1.95, h: 0.2, fontSize: 10, bold: true, color: C.purple, align: 'center', margin: 0 });
  slide.addText('decifra', { x: 3.58, y: 3.73, w: 1.95, h: 0.25, fontSize: 19, bold: true, color: C.white, align: 'center', margin: 0 });
  stepRow(slide, ['Gerar par', 'Publicar chave', 'Alice cifra', 'Bob decifra'], 0.72, 5.55, 11.91, C.blue);
  slide.addNotes('Guilherme Francisco — explicar chave pública e privada. A Alice cifra com a pública do Bob; somente a privada correspondente decifra. OAEP adiciona aleatoriedade. O espião não decifra com a chave pública.');
}

// 07 — Criptografia híbrida
{
  const slide = pptx.addSlide();
  addBase(slide, 7, 'Criptografia assimétrica', 'Guilherme Francisco · 45s', C.blue);
  addTitle(slide, 'Uso real', 'RSA e AES trabalham juntos', 'A criptografia híbrida reúne a velocidade do AES e a distribuição segura de chaves do RSA.', C.blue, { w: 8, titleH: 0.62, size: 29, subH: 0.5, subSize: 13 });
  const blocks = [
    { x: 0.75, n: '01', t: 'Gerar chave AES', b: 'Uma chave aleatória e rápida.', c: C.green },
    { x: 3.84, n: '02', t: 'Cifrar os dados', b: 'AES protege arquivos de qualquer tamanho.', c: C.green },
    { x: 6.93, n: '03', t: 'Proteger a chave', b: 'RSA cifra apenas a chave AES.', c: C.blue },
    { x: 10.02, n: '04', t: 'Recuperar e abrir', b: 'Bob usa sua privada e depois o AES.', c: C.purple },
  ];
  blocks.forEach((item, i) => {
    card(slide, item.x, 2.62, 2.55, 2.72, item.t, item.b, item.c, item.n);
    if (i < blocks.length - 1) slide.addText('→', { x: item.x + 2.59, y: 3.78, w: 0.42, h: 0.28, fontSize: 20, bold: true, color: C.dim, align: 'center', margin: 0 });
  });
  slide.addShape(SH.roundRect, { x: 2.35, y: 5.72, w: 8.62, h: 0.56, rectRadius: 0.08, fill: { color: C.panel2 }, line: { color: C.line, width: 1 } });
  slide.addText('HTTPS  ·  PGP  ·  aplicativos de mensagem', { x: 2.55, y: 5.92, w: 8.22, h: 0.16, fontSize: 11, bold: true, color: C.white, align: 'center', margin: 0 });
  slide.addNotes('Guilherme Francisco — destacar que RSA é mais lento e limitado a mensagens pequenas. Por isso sistemas reais cifram os dados com AES e usam RSA apenas para proteger a chave AES.');
}

// 08 — Hash
{
  const slide = pptx.addSlide();
  addBase(slide, 8, 'Hash', 'Guilherme Francisco · 55s', C.orange);
  addTitle(slide, 'SHA-256', 'Uma impressão digital do conteúdo', 'Entradas de qualquer tamanho produzem sempre um resumo de 256 bits — 64 caracteres hexadecimais.', C.orange, { w: 5.2, titleH: 0.72, size: 30, subH: 0.85, subSize: 13 });
  imageCard(slide, 'fluxo-gerar-hash.png', 6.12, 0.7, 6.5, 4.55, 'cover');
  const props = [
    ['Determinístico', 'mesma entrada, mesmo hash'],
    ['Mão única', 'não existe “decifrar”'],
    ['Efeito avalanche', '1 bit muda todo o resultado'],
    ['Tamanho fixo', 'sempre 256 bits'],
  ];
  props.forEach((item, i) => {
    const x = 0.72 + (i % 2) * 2.65;
    const y = 3.42 + Math.floor(i / 2) * 1.1;
    slide.addShape(SH.roundRect, { x, y, w: 2.45, h: 0.88, rectRadius: 0.07, fill: { color: C.panel }, line: { color: C.line, width: 1 } });
    slide.addText(item[0], { x: x + 0.15, y: y + 0.16, w: 2.15, h: 0.18, fontSize: 11, bold: true, color: C.orange, margin: 0 });
    slide.addText(item[1], { x: x + 0.15, y: y + 0.47, w: 2.15, h: 0.16, fontSize: 9.5, color: C.muted, margin: 0 });
  });
  slide.addText('HASH ≠ CRIPTOGRAFIA', { x: 6.72, y: 5.74, w: 5.3, h: 0.35, fontSize: 18, bold: true, color: C.orange, align: 'center', margin: 0 });
  slide.addText('Não usa chave e não é reversível.', { x: 6.72, y: 6.17, w: 5.3, h: 0.2, fontSize: 11.5, color: C.muted, align: 'center', margin: 0 });
  slide.addNotes('Guilherme Francisco — hash recebe qualquer conteúdo e produz resumo fixo. SHA-256 gera 256 bits. Mesma entrada gera o mesmo hash; uma alteração mínima causa efeito avalanche. Reforçar que hash não usa chave e não é reversível.');
}

// 09 — Verificação de hash
{
  const slide = pptx.addSlide();
  addBase(slide, 9, 'Hash', 'Guilherme Francisco · 45s', C.orange);
  addTitle(slide, 'Integridade', 'Gerar em uma tela, conferir em outra', 'O hash esperado é comparado ao hash calculado novamente a partir dos dados recebidos.', C.orange, { w: 8.2, titleH: 0.62, size: 28, subH: 0.48, subSize: 13 });
  imageCard(slide, 'fluxo-verificar-hash.png', 0.7, 2.35, 5.75, 3.85, 'cover');
  slide.addShape(SH.roundRect, { x: 6.82, y: 2.35, w: 5.8, h: 1.68, rectRadius: 0.08, fill: { color: C.green, transparency: 85 }, line: { color: C.green, width: 1.2 } });
  slide.addText('✓  HASHES IGUAIS', { x: 7.08, y: 2.72, w: 5.25, h: 0.25, fontSize: 20, bold: true, color: C.green, margin: 0 });
  slide.addText('O conteúdo recebido permanece íntegro.', { x: 7.08, y: 3.19, w: 5.25, h: 0.2, fontSize: 12, color: C.white, margin: 0 });
  slide.addShape(SH.roundRect, { x: 6.82, y: 4.28, w: 5.8, h: 1.68, rectRadius: 0.08, fill: { color: C.red, transparency: 87 }, line: { color: C.red, width: 1.2 } });
  slide.addText('×  HASHES DIFERENTES', { x: 7.08, y: 4.65, w: 5.25, h: 0.25, fontSize: 20, bold: true, color: C.red, margin: 0 });
  slide.addText('A mensagem ou o arquivo foi modificado.', { x: 7.08, y: 5.12, w: 5.25, h: 0.2, fontSize: 12, color: C.white, margin: 0 });
  slide.addText('Limitação: um atacante pode trocar o arquivo e o hash. Para provar a autoria, usamos assinatura digital.', { x: 6.84, y: 6.23, w: 5.75, h: 0.43, fontSize: 10.5, color: C.muted, margin: 0, fit: 'shrink' });
  slide.addNotes('Guilherme Francisco — demonstrar as duas telas exigidas: gerar e verificar. Usar o último hash gerado e alterar uma letra para mostrar a falha. Explicar que hash sozinho garante integridade, mas não autoria.');
}

// 10 — Assinatura
{
  const slide = pptx.addSlide();
  addBase(slide, 10, 'Assinatura digital', 'João Gabriel · 1min20', C.purple);
  addTitle(slide, 'RSA-PSS + SHA-256', 'Assinar com a privada. Verificar com a pública.', 'A assinatura combina hash e criptografia assimétrica para comprovar autoria e integridade.', C.purple, { w: 5.1, titleH: 0.9, size: 27, subH: 0.8, subSize: 13 });
  imageCard(slide, 'fluxo-assinatura-digital.png', 6.12, 0.7, 6.5, 4.55, 'cover');
  stepRow(slide, ['Calcular hash', 'Assinar', 'Enviar', 'Verificar'], 0.72, 5.54, 11.9, C.purple);
  slide.addShape(SH.roundRect, { x: 0.72, y: 3.8, w: 4.95, h: 1.12, rectRadius: 0.08, fill: { color: C.panel }, line: { color: C.line, width: 1 } });
  slide.addText('Garante', { x: 0.94, y: 4.03, w: 0.85, h: 0.18, fontSize: 10, bold: true, color: C.purple, margin: 0 });
  slide.addText('integridade  ·  autenticidade  ·  não repúdio', { x: 1.8, y: 4.01, w: 3.55, h: 0.22, fontSize: 12.5, bold: true, color: C.white, margin: 0, fit: 'shrink' });
  slide.addText('Não garante sigilo: o conteúdo continua legível.', { x: 0.94, y: 4.48, w: 4.35, h: 0.18, fontSize: 10, color: C.muted, margin: 0 });
  slide.addNotes('João Gabriel — a Alice assina o hash do conteúdo com sua chave privada. Bob verifica usando a chave pública. A assinatura garante integridade, autenticidade e não repúdio, mas não esconde o conteúdo.');
}

// 11 — Certificado
{
  const slide = pptx.addSlide();
  addBase(slide, 11, 'Certificado digital', 'João Gabriel · 1min45', C.purple);
  imageCard(slide, 'assinatura-passo-2.png', 0.7, 0.72, 5.75, 5.82, 'cover');
  addTitle(slide, 'X.509', 'Quem garante que a chave é realmente da Alice?', 'O certificado liga identidade e chave pública. A confiança vem da assinatura da Autoridade Certificadora.', C.purple, { x: 6.85, y: 0.72, w: 5.65, titleH: 0.86, size: 26, subH: 0.82, subSize: 12.5 });
  const fields = [
    ['Titular', 'nome, organização e e-mail'],
    ['Emissor', 'Autoridade Certificadora'],
    ['Validade', 'período em que o certificado é aceito'],
    ['Chave pública', 'usada para verificar a assinatura'],
  ];
  fields.forEach((item, i) => {
    const y = 3.02 + i * 0.73;
    slide.addShape(SH.roundRect, { x: 6.86, y, w: 5.63, h: 0.57, rectRadius: 0.05, fill: { color: C.panel }, line: { color: C.line, width: 0.8 } });
    slide.addText(item[0].toUpperCase(), { x: 7.03, y: y + 0.2, w: 1.14, h: 0.14, fontSize: 8, bold: true, color: C.purple, margin: 0 });
    slide.addText(item[1], { x: 8.22, y: y + 0.16, w: 4.05, h: 0.21, fontSize: 10.5, color: C.white, margin: 0, fit: 'shrink' });
  });
  slide.addText('VERIFICAÇÃO FINAL', { x: 6.88, y: 6.06, w: 1.5, h: 0.16, fontSize: 8.5, bold: true, color: C.green, margin: 0 });
  slide.addText('✓ emitido pela AC   ✓ dentro da validade   ✓ assinatura confere', { x: 8.35, y: 6.02, w: 4.1, h: 0.22, fontSize: 10, bold: true, color: C.white, margin: 0, fit: 'shrink' });
  slide.addNotes('João Gabriel — explicar que uma chave pública isolada não prova identidade. O projeto simula uma AC Raiz, cria certificados X.509 com node-forge e verifica emissão, validade e assinatura com o crypto do Node. Mostrar que alterar o arquivo ou usar certificado falso invalida o resultado.');
}

// 12 — Conclusão
{
  const slide = pptx.addSlide();
  addBase(slide, 12, 'Conclusão', 'João Gabriel · 40s', C.green);
  addTitle(slide, 'Resultado', 'Do conceito à demonstração prática', 'O projeto cobre os requisitos da atividade e permite observar sucessos e falhas em cada mecanismo.', C.green, { w: 8.6, titleH: 0.62, size: 29, subH: 0.5, subSize: 13 });
  const outcomes = [
    ['AES-256-GCM', 'sigilo + integridade', C.green],
    ['RSA-2048', 'distribuição segura de chaves', C.blue],
    ['SHA-256', 'verificação de integridade', C.orange],
    ['RSA-PSS + X.509', 'autoria + confiança', C.purple],
  ];
  outcomes.forEach((item, i) => card(slide, 0.7 + i * 3.0, 2.5, 2.78, 2.35, item[0], item[1], item[2], '✓'));
  slide.addShape(SH.roundRect, { x: 1.45, y: 5.35, w: 10.42, h: 0.72, rectRadius: 0.09, fill: { color: C.green, transparency: 82 }, line: { color: C.green, width: 1.2 } });
  slide.addText('Aplicações interativas · testes de alteração · relatório · apresentação', { x: 1.75, y: 5.61, w: 9.82, h: 0.2, fontSize: 12.5, bold: true, color: C.white, align: 'center', margin: 0 });
  slide.addText('Obrigado!', { x: 4.75, y: 6.35, w: 3.85, h: 0.36, fontFace: 'Aptos Display', fontSize: 25, bold: true, color: C.green, align: 'center', margin: 0 });
  slide.addNotes('João Gabriel — concluir que os requisitos foram atendidos: criptografia simétrica e assimétrica, hash gerado e verificado em telas diferentes, assinatura e verificação de arquivo e explicação da geração das chaves e do certificado. Agradecer e abrir para perguntas.');
}

pptx.writeFile({ fileName: OUT });

