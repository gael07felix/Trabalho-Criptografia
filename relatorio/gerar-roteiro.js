const fs = require('fs');
const path = require('path');
const {
  AlignmentType,
  Document,
  HeadingLevel,
  PageBreak,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require('docx');

const output = path.join(__dirname, 'Roteiro-Falas-Apresentacao-v2.docx');
const FONT = 'Arial';
const BLUE = '1F4E79';

const title = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({ heading: level, children: [new TextRun({ text, font: FONT })], spacing: { before: 280, after: 140 } });

const text = (value, options = {}) =>
  new Paragraph({
    children: [new TextRun({ text: value, font: FONT, size: options.size || 22, bold: options.bold, italics: options.italics, color: options.color })],
    alignment: options.align || AlignmentType.JUSTIFIED,
    spacing: { after: options.after || 130, line: 300 },
  });

const cue = (value) =>
  new Paragraph({
    children: [new TextRun({ text: `Ação na tela: ${value}`, font: FONT, size: 20, italics: true, color: '666666' })],
    shading: { type: ShadingType.CLEAR, fill: 'F2F2F2' },
    spacing: { before: 80, after: 160, line: 280 },
  });

const bullets = (items) => items.map((item) => new Paragraph({
  text: item,
  bullet: { level: 0 },
  style: 'Normal',
  spacing: { after: 70, line: 280 },
}));

const timingTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    ['Integrante', 'Tema', 'Tempo'],
    ['Gael Felix', 'Introdução e conceitos essenciais', '3min30'],
    ['Guilherme Bertero', 'Criptografia simétrica — AES-256-GCM', '3min45'],
    ['Guilherme Francisco', 'Criptografia assimétrica e hash', '3min45'],
    ['João Gabriel', 'Assinatura digital e conclusão', '3min45'],
    ['Total', 'Apresentação completa', '14min45'],
  ].map((row, index) => new TableRow({
    children: row.map((cell) => new TableCell({
      width: { size: 33, type: WidthType.PERCENTAGE },
      shading: index === 0 ? { type: ShadingType.CLEAR, fill: BLUE } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text: cell, font: FONT, size: 20, bold: index === 0 || index === 5, color: index === 0 ? 'FFFFFF' : undefined })] })],
    })),
  })),
});

const content = [
  text('ROTEIRO DE FALAS', { align: AlignmentType.CENTER, bold: true, size: 34, color: BLUE, after: 80 }),
  text('Criptografia, Hash e Assinatura Digital', { align: AlignmentType.CENTER, bold: true, size: 28, after: 180 }),
  text('Apresentação da disciplina de Segurança da Informação', { align: AlignmentType.CENTER, size: 22, after: 80 }),
  text('Integrantes: Gael Felix · Guilherme Bertero · Guilherme Francisco · João Gabriel', { align: AlignmentType.CENTER, size: 20, after: 400 }),
  title('Orientação de uso', HeadingLevel.HEADING_1),
  text('Este roteiro foi elaborado para uma apresentação de aproximadamente 15 minutos. As indicações entre colchetes são ações na aplicação e não precisam ser lidas em voz alta. O ideal é ensaiar com um cronômetro e deixar as aplicações abertas antes do início.'),
  timingTable,
  new Paragraph({ children: [new PageBreak()] }),

  title('Integrante 1 — Gael Felix'),
  text('Tempo estimado: 3 minutos e 30 segundos', { bold: true, color: BLUE, align: AlignmentType.LEFT }),
  cue('Mostrar a hero da home e, em seguida, a seção “O que precisamos proteger?”.'),
  text('Olá, nós somos Gael Felix, Guilherme Bertero, Guilherme Francisco e João Gabriel, e vamos apresentar nosso trabalho sobre criptografia, funções hash e assinatura digital.'),
  text('O objetivo do projeto foi explicar esses conceitos por meio de aplicações interativas, permitindo visualizar como cada técnica funciona na prática.'),
  text('Antes de falar dos algoritmos, precisamos entender três objetivos principais da segurança da informação.'),
  text('O primeiro é a confidencialidade, que significa garantir que somente pessoas autorizadas consigam compreender uma informação. A criptografia é utilizada principalmente para esse objetivo.'),
  text('O segundo é a integridade, que permite verificar se uma mensagem ou arquivo foi alterado. É nesse ponto que entram as funções hash.'),
  text('O terceiro é a autenticidade, que permite confirmar a origem de um arquivo ou mensagem. A assinatura digital ajuda a provar quem assinou determinado conteúdo.'),
  text('É importante diferenciar essas técnicas. A criptografia é reversível: uma mensagem é cifrada e depois pode ser decifrada utilizando uma chave. O hash não é reversível; ele transforma os dados em uma impressão digital. Já a assinatura digital utiliza criptografia assimétrica para comprovar autoria e integridade.'),
  text('Escolhemos HTML, CSS e JavaScript porque são tecnologias simples e adequadas para criar as telas interativas no navegador. Usamos Node.js para executar o JavaScript no servidor e Express, que é uma biblioteca para criar e organizar um servidor web. Ele recebe as requisições feitas pelas telas, identifica a rota correta, como cifrar ou calcular um hash, chama a lógica correspondente e devolve o resultado para o navegador. O módulo nativo crypto foi escolhido por já oferecer implementações confiáveis de AES, RSA, SHA-256 e assinaturas. Para criar os certificados X.509, usamos node-forge, porque o crypto do Node consegue validar certificados, mas não criá-los diretamente.'),
  text('A página inicial foi organizada como uma apresentação. Primeiro mostramos os objetivos de segurança e, depois, podemos abrir cada aplicação para acompanhar o passo a passo.'),
  text('Agora vamos começar pela criptografia simétrica.'),
  text('Transição: passa a palavra para Guilherme Bertero.', { italics: true, color: '666666', align: AlignmentType.LEFT }),

  title('Integrante 2 — Guilherme Bertero'),
  text('Tempo estimado: 3 minutos e 45 segundos', { bold: true, color: BLUE, align: AlignmentType.LEFT }),
  cue('Selecionar a aba “Criptografia simétrica” e abrir a aplicação no modal.'),
  text('A criptografia simétrica utiliza a mesma chave para cifrar e decifrar uma mensagem.'),
  text('Isso torna o processo bastante rápido, sendo adequado para proteger grandes volumes de dados. O principal problema é que as pessoas precisam compartilhar a chave secreta com segurança.'),
  text('Nesta aplicação utilizamos o AES-256-GCM. O número 256 representa o tamanho da chave em bits. Quanto maior a chave, maior o número de possibilidades que um atacante teria que testar.'),
  text('O modo GCM possui uma característica importante: além de proteger a confidencialidade, ele também verifica a integridade da mensagem por meio de uma tag de autenticação.'),
  text('No primeiro passo, Alice e Bob recebem uma chave secreta. Essa chave possui 256 bits e deve permanecer protegida.'),
  text('No segundo passo, Alice escreve uma mensagem e a cifra. O sistema gera também um IV, que é um valor aleatório usado durante a cifragem.'),
  text('O IV não precisa ser secreto e pode ser enviado junto com a mensagem. Porém, ele não deve ser reutilizado com a mesma chave.'),
  text('No terceiro passo, observamos o que seria transmitido pela rede: o IV, a tag de autenticação e o texto cifrado. Um possível espião consegue visualizar o pacote, mas não consegue entender a mensagem sem a chave.'),
  text('No quarto passo, Bob usa a mesma chave para decifrar o conteúdo. Quando a chave está correta, a mensagem original é recuperada.'),
  text('Se alterarmos a chave ou modificarmos algum trecho do pacote, a decifragem falha. Isso acontece porque o GCM verifica a tag de autenticação e identifica que os dados não são mais os mesmos.'),
  text('Portanto, o AES-GCM protege a mensagem com velocidade e também detecta alterações. Porém, ele ainda depende de uma forma segura de compartilhar a chave. Para resolver esse problema, podemos utilizar a criptografia assimétrica.'),
  cue('Avançar até o pacote cifrado e, se houver tempo, demonstrar uma chave incorreta ou uma alteração no conteúdo.'),
  text('Transição: passa a palavra para Guilherme Francisco.', { italics: true, color: '666666', align: AlignmentType.LEFT }),

  title('Integrante 3 — Guilherme Francisco'),
  text('Tempo estimado: 3 minutos e 45 segundos', { bold: true, color: BLUE, align: AlignmentType.LEFT }),
  cue('Selecionar “Criptografia assimétrica” e depois demonstrar as telas de geração e verificação de hash.'),
  text('Diferente da criptografia simétrica, a criptografia assimétrica utiliza duas chaves relacionadas matematicamente: uma chave pública e uma chave privada.'),
  text('A chave pública pode ser compartilhada. Já a chave privada deve permanecer somente com o seu proprietário.'),
  text('Nesta aplicação usamos RSA-2048 com OAEP e SHA-256. Bob começa gerando seu par de chaves. Alice recebe apenas a chave pública de Bob e a utiliza para cifrar a mensagem.'),
  text('Depois da cifragem, somente a chave privada correspondente consegue recuperar o conteúdo. Por isso, um espião que tente usar a chave pública para decifrar a mensagem não consegue.'),
  text('A criptografia assimétrica resolve o problema de distribuição de chaves, mas é mais lenta que a simétrica e possui limite para o tamanho da mensagem. Por isso, na prática, é comum combinar RSA com AES: o AES cifra os dados e o RSA protege apenas a chave AES.'),
  text('Agora vamos falar sobre hash.'),
  text('Uma função hash recebe dados de qualquer tamanho e gera um resumo de tamanho fixo. No nosso caso usamos o SHA-256, que produz 256 bits, apresentados como 64 caracteres hexadecimais.'),
  text('O hash é determinístico: a mesma entrada sempre produz o mesmo resultado. Porém, uma pequena alteração na entrada modifica completamente o hash. Esse comportamento é chamado de efeito avalanche.'),
  text('Na tela “Gerar hash”, podemos informar uma mensagem ou arquivo e calcular seu SHA-256. Depois, na tela “Verificar hash”, usamos o hash esperado e recalculamos o valor a partir dos dados recebidos.'),
  text('Se os dois valores forem iguais, os dados não foram alterados. Se forem diferentes, significa que houve alguma modificação.'),
  text('É importante lembrar que hash não é criptografia. Ele não possui uma chave e não pode ser decifrado. Além disso, o hash sozinho não comprova quem enviou o arquivo. Para isso, precisamos da assinatura digital.'),
  cue('No hash, usar “último hash gerado” e depois alterar uma letra para mostrar que a verificação não confere.'),
  text('Transição: passa a palavra para João Gabriel.', { italics: true, color: '666666', align: AlignmentType.LEFT }),

  title('Integrante 4 — João Gabriel'),
  text('Tempo estimado: 3 minutos e 45 segundos', { bold: true, color: BLUE, align: AlignmentType.LEFT }),
  cue('Selecionar “Assinatura digital” e abrir a aplicação.'),
  text('A assinatura digital combina hash e criptografia assimétrica para garantir integridade, autenticidade e não repúdio.'),
  text('Primeiro, Alice gera um par de chaves RSA. A chave privada fica somente com Alice e a chave pública poderá ser usada por outras pessoas para verificar suas assinaturas.'),
  text('Depois, uma Autoridade Certificadora emite um certificado digital X.509. O certificado associa a chave pública à identidade de Alice.'),
  text('Essa etapa é importante porque uma chave pública sozinha não informa de quem ela é. Um impostor poderia criar uma chave e dizer que ela pertence à Alice. O certificado resolve esse problema ao ser assinado por uma Autoridade Certificadora.'),
  text('No nosso projeto, a Autoridade Certificadora é simulada. Ela utiliza uma chave própria para assinar os certificados emitidos. O certificado contém informações como titular, organização, e-mail, emissor, validade, número de série e chave pública.'),
  text('Quando Alice assina um arquivo, o sistema calcula o hash SHA-256 do conteúdo e gera uma assinatura utilizando a chave privada dela. A aplicação utiliza RSA-PSS com SHA-256.'),
  text('Bob recebe três elementos: o arquivo, a assinatura e o certificado. Ele calcula novamente o hash do arquivo e usa a chave pública presente no certificado para verificar a assinatura.'),
  text('Se o conteúdo tiver sido alterado, a verificação falha. Se a assinatura tiver sido criada por outra chave privada, também falha. E se o certificado for falsificado, a verificação da Autoridade Certificadora não será aprovada.'),
  text('Portanto, a assinatura digital não serve para esconder o conteúdo. Ela serve para provar que o arquivo não foi alterado e que foi assinado pelo titular da chave privada.'),
  text('Com esse projeto atendemos aos requisitos propostos: demonstramos criptografia simétrica e assimétrica, geração e verificação de hash em telas diferentes, além da assinatura e verificação de arquivos com certificado digital.'),
  text('Obrigado pela atenção. Estamos disponíveis para responder às perguntas.'),
  cue('Gerar as chaves, emitir o certificado, assinar uma mensagem ou arquivo e verificar. Se houver tempo, alterar o conteúdo ou usar o certificado falsificado.'),

  title('Checklist antes da apresentação'),
  ...bullets([
    'Abrir o projeto em http://localhost:3000/ e deixar a home carregada.',
    'Testar previamente o servidor e confirmar que as aplicações respondem.',
    'Deixar uma mensagem curta pronta para as demonstrações.',
    'Evitar explicar todos os detalhes técnicos do código; priorizar o conceito e o resultado visual.',
    'Se o tempo estiver curto, demonstrar o fluxo normal e explicar verbalmente os testes de falha.',
  ]),
];

const document = new Document({
  creator: 'Gael Felix, Guilherme Bertero, Guilherme Francisco e João Gabriel',
  title: 'Roteiro de Falas — Criptografia, Hash e Assinatura Digital',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [{ id: 'Normal', name: 'Normal', run: { font: FONT, size: 22 } }],
  },
  sections: [{ properties: {}, children: content }],
});

Packer.toBuffer(document).then((buffer) => {
  fs.writeFileSync(output, buffer);
  console.log(`Roteiro gerado em: ${output}`);
});
