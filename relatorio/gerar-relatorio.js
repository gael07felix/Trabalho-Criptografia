const fs = require('fs');
const path = require('path');
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require('docx');

const ARQUIVO_SAIDA = path.join(__dirname, 'Relatorio-Criptografia-Hash-Assinatura-Digital.docx');

const FONTE = 'Arial';
const FONTE_CODIGO = 'Consolas';
const COR_DESTAQUE = '1F4E79';

// ---------- Auxiliares de formatação ----------

// Converte "texto **negrito** texto" em TextRuns
function trechos(texto, opcoes = {}) {
  return texto
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((parte) =>
      parte.startsWith('**')
        ? new TextRun({ text: parte.slice(2, -2), bold: true, ...opcoes })
        : new TextRun({ text: parte, ...opcoes })
    );
}

const titulo1 = (texto) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(texto)], spacing: { before: 360, after: 160 } });

const titulo2 = (texto) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(texto)], spacing: { before: 240, after: 120 } });

const paragrafo = (texto) =>
  new Paragraph({ children: trechos(texto), alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 300 } });

const marcadores = (itens) =>
  itens.map(
    (item) => new Paragraph({ children: trechos(item), bullet: { level: 0 }, spacing: { after: 60, line: 280 } })
  );

const numerados = (itens) =>
  itens.map((item, i) => paragrafo(`${i + 1}. ${item}`));

function codigo(linhas) {
  return linhas.map(
    (linha, i) =>
      new Paragraph({
        children: [new TextRun({ text: linha || ' ', font: FONTE_CODIGO, size: 18 })],
        shading: { type: ShadingType.CLEAR, fill: 'F2F2F2' },
        spacing: { before: i === 0 ? 120 : 0, after: i === linhas.length - 1 ? 160 : 0 },
      })
  );
}

function tabela(cabecalho, linhas) {
  const borda = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
  const bordas = { top: borda, bottom: borda, left: borda, right: borda };

  const celula = (texto, ehCabecalho) =>
    new TableCell({
      borders: bordas,
      shading: ehCabecalho ? { type: ShadingType.CLEAR, fill: COR_DESTAQUE } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [
        new Paragraph({
          children: trechos(texto, ehCabecalho ? { bold: true, color: 'FFFFFF', size: 20 } : { size: 20 }),
        }),
      ],
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: cabecalho.map((texto) => celula(texto, true)) }),
      ...linhas.map((linha) => new TableRow({ children: linha.map((texto) => celula(texto, false)) })),
    ],
  });
}

const espaco = () => new Paragraph({ children: [], spacing: { after: 120 } });

const linhaCentralizada = (texto, opcoes = {}) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: opcoes.depois ?? 120 },
    children: [new TextRun({ text: texto, bold: opcoes.negrito, size: opcoes.tamanho, highlight: opcoes.destaque })],
  });

// ---------- Capa ----------

const capa = [
  linhaCentralizada('INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DE SÃO PAULO', { negrito: true, tamanho: 24 }),
  linhaCentralizada('[CÂMPUS]', { negrito: true, tamanho: 24, destaque: 'yellow' }),
  linhaCentralizada('[CURSO]', { tamanho: 22, destaque: 'yellow' }),
  linhaCentralizada('Disciplina: Segurança da Informação', { tamanho: 22, depois: 1800 }),
  linhaCentralizada('CRIPTOGRAFIA, HASH E ASSINATURA DIGITAL', { negrito: true, tamanho: 36, depois: 200 }),
  linhaCentralizada('Relatório e desenvolvimento de aplicações demonstrativas', { tamanho: 24, depois: 1600 }),
  linhaCentralizada('Integrantes:', { negrito: true, tamanho: 22 }),
  linhaCentralizada('Gael Felix', { tamanho: 22, depois: 40 }),
  linhaCentralizada('Guilherme Bertero', { tamanho: 22, depois: 40 }),
  linhaCentralizada('Guilherme Francisco', { tamanho: 22, depois: 40 }),
  linhaCentralizada('João Gabriel', { tamanho: 22, depois: 400 }),
  linhaCentralizada('Professor(a): [NOME DO PROFESSOR]', { tamanho: 22, depois: 1600, destaque: 'yellow' }),
  linhaCentralizada('[CIDADE] - [DATA DE ENTREGA]', { tamanho: 22, destaque: 'yellow' }),
];

// ---------- Conteúdo ----------

const conteudo = [
  // 1
  titulo1('1. Introdução'),
  paragrafo(
    'A segurança da informação se apoia em alguns pilares: **confidencialidade** (só pessoas autorizadas acessam a informação), **integridade** (a informação não é alterada indevidamente), **autenticidade** (é possível confirmar a origem da informação) e **não repúdio** (o autor não pode negar a autoria). A criptografia, as funções hash e a assinatura digital são as principais ferramentas técnicas para garantir esses pilares.'
  ),
  paragrafo(
    'Este relatório apresenta os conceitos de criptografia simétrica, criptografia assimétrica, hash e assinatura digital, e descreve a aplicação web desenvolvida pelo grupo para demonstrar cada um desses processos na prática, incluindo o método usado para gerar as chaves e o certificado digital.'
  ),

  // 2
  titulo1('2. Criptografia simétrica'),
  paragrafo(
    'Na criptografia simétrica, a **mesma chave** é usada para cifrar e decifrar a mensagem. É um método muito rápido, adequado para grandes volumes de dados. Sua principal desvantagem é o **problema da distribuição de chaves**: remetente e destinatário precisam combinar a chave por um canal seguro antes de se comunicarem.'
  ),
  paragrafo(
    'O algoritmo usado no projeto é o **AES** (Advanced Encryption Standard), padrão adotado pelo NIST em 2001 em substituição ao DES. Utilizamos chave de **256 bits** e o modo de operação **GCM** (Galois/Counter Mode), que, além de cifrar, gera uma **tag de autenticação** capaz de detectar qualquer alteração na mensagem cifrada. A cifragem envolve três elementos:'
  ),
  tabela(
    ['Elemento', 'Tamanho', 'Função'],
    [
      ['Chave', '256 bits', 'Secreta. Usada para cifrar e decifrar.'],
      ['IV (vetor de inicialização)', '96 bits', 'Aleatório a cada cifragem. Faz a mesma mensagem gerar resultados diferentes. Não é secreto.'],
      ['Tag de autenticação', '128 bits', 'Detecta alterações no texto cifrado (integridade). Não é secreta.'],
    ]
  ),

  // 3
  titulo1('3. Criptografia assimétrica'),
  paragrafo(
    'Na criptografia assimétrica, cada pessoa possui um **par de chaves** matematicamente relacionadas: a **chave pública**, que pode ser divulgada, e a **chave privada**, que fica apenas com o dono. O que é cifrado com a chave pública só pode ser decifrado com a chave privada correspondente. Isso resolve o problema da distribuição de chaves: qualquer pessoa pode enviar uma mensagem sigilosa usando a chave pública do destinatário, sem combinar nenhum segredo antes.'
  ),
  paragrafo(
    'O algoritmo usado é o **RSA** (1977). Sua segurança se baseia na dificuldade de fatorar o produto de dois números primos muito grandes. Resumidamente: escolhem-se os primos p e q, calcula-se n = p × q, e a partir deles obtêm-se o expoente público e e o privado d. Cifrar é calcular c = m^e mod n, e decifrar é calcular m = c^d mod n.'
  ),
  paragrafo(
    'No projeto, usamos chaves de **2048 bits** com o preenchimento **OAEP** com SHA-256, que adiciona aleatoriedade à cifragem. A desvantagem do RSA é ser lento e cifrar apenas mensagens pequenas (até 190 bytes nessa configuração). Por isso, na prática, usa-se a **criptografia híbrida**: o RSA cifra uma chave AES, e o AES cifra os dados. É assim que funciona o HTTPS.'
  ),

  // 4
  titulo1('4. Hash'),
  paragrafo(
    'Uma **função hash** transforma dados de qualquer tamanho em um resumo de tamanho fixo, que funciona como uma "impressão digital" dos dados. Diferentemente da criptografia, o hash **não é reversível** e não usa chave. Suas principais propriedades são:'
  ),
  ...marcadores([
    '**Determinística:** a mesma entrada sempre gera o mesmo hash.',
    '**Mão única:** é inviável descobrir os dados originais a partir do hash.',
    '**Efeito avalanche:** alterar 1 bit da entrada muda cerca de metade dos bits do hash.',
    '**Resistência a colisões:** é inviável encontrar duas entradas com o mesmo hash.',
  ]),
  tabela(
    ['Algoritmo', 'Tamanho', 'Situação'],
    [
      ['MD5', '128 bits', 'Inseguro (colisões conhecidas desde 2004)'],
      ['SHA-1', '160 bits', 'Inseguro (colisão demonstrada em 2017)'],
      ['**SHA-256**', '256 bits', 'Seguro, padrão atual (usado no projeto)'],
      ['SHA-512', '512 bits', 'Seguro'],
    ]
  ),
  espaco(),
  paragrafo(
    'O hash é usado para verificar a integridade de arquivos, armazenar senhas e como base da assinatura digital. Porém, sozinho, ele **não garante a autoria**: um atacante poderia substituir o arquivo e o hash ao mesmo tempo. Para isso existe a assinatura digital.'
  ),

  // 5
  titulo1('5. Assinatura digital e certificado digital'),
  paragrafo(
    'A **assinatura digital** usa a criptografia assimétrica no sentido inverso ao da cifragem: o autor **assina com a sua chave privada**, e qualquer pessoa **verifica com a chave pública** dele. Ela garante **integridade**, **autenticidade** e **não repúdio**, mas não garante sigilo, pois o conteúdo continua legível.'
  ),
  ...numerados([
    '**Assinar:** calcula-se o hash do documento e cifra-se esse hash com a chave privada do autor.',
    '**Verificar:** calcula-se o hash do documento recebido e confere-se a assinatura com a chave pública do autor. Se conferir, o documento é íntegro e foi assinado pelo dono da chave privada.',
  ]),
  paragrafo(
    'Uma chave pública, porém, não informa a quem pertence. O **certificado digital** (padrão **X.509**) resolve isso: é um documento eletrônico que liga uma chave pública à identidade do titular e é assinado por uma **Autoridade Certificadora (AC)** confiável. Ele contém, entre outros campos, o titular, o emissor, o número de série, o período de validade e a chave pública.'
  ),
  paragrafo(
    'No Brasil, a estrutura de certificação oficial é a **ICP-Brasil**, e a Medida Provisória 2.200-2/2001 garante validade jurídica aos documentos assinados com certificados emitidos por ela.'
  ),

  // 6
  titulo1('6. Desenvolvimento da aplicação'),
  paragrafo(
    'O grupo desenvolveu uma aplicação web em que cada processo é apresentado como um **passo a passo** com personagens: Alice (remetente), Bob (destinatário), um espião e a Autoridade Certificadora. Cada ação mostra uma mensagem de sucesso ou erro, e o usuário pode alterar os dados para ver as falhas sendo detectadas.'
  ),
  tabela(
    ['Tecnologia', 'Uso no projeto'],
    [
      ['HTML, CSS e JavaScript', 'Telas (front-end)'],
      ['Node.js com Express', 'Servidor e rotas da API (back-end)'],
      ['Módulo crypto do Node.js', 'AES, RSA, SHA-256, assinatura e verificação'],
      ['node-forge', 'Geração dos certificados X.509'],
      ['Vercel e GitHub', 'Publicação e versionamento'],
    ]
  ),
  espaco(),
  paragrafo(
    'O navegador envia os dados ao servidor, que executa as operações criptográficas e devolve o resultado. A lógica criptográfica fica separada em módulos (simetrica.js, assimetrica.js, hash.js e assinatura.js).'
  ),
  paragrafo('Aplicação publicada: https://trabalho-criptografia.vercel.app'),
  paragrafo('Código-fonte: https://github.com/gael07felix/Trabalho-Criptografia'),
  paragrafo('A página inicial apresenta cinco opções: criptografia simétrica, criptografia assimétrica, geração de hash, verificação de hash e assinatura digital. Cada card direciona o usuário para o respectivo passo a passo.'),

  titulo2('6.1 Criptografia simétrica'),
  paragrafo(
    'Em cinco passos: Alice e Bob combinam uma chave AES de 256 bits gerada aleatoriamente; Alice cifra a mensagem; a mensagem cifrada "viaja pela rede", podendo ser alterada para simular um ataque; Bob decifra com a mesma chave; e um resumo compara a mensagem enviada com a recebida. O IV, a tag e o texto cifrado são enviados juntos em um único pacote.'
  ),
  paragrafo('Na tela de criptografia simétrica, o usuário visualiza a chave AES compartilhada, informa uma mensagem e solicita a cifragem. O sistema mostra o pacote em Base64 e, nos detalhes técnicos, exibe o IV, a tag de autenticação e o texto cifrado. No passo seguinte, Bob informa a mesma chave e recupera a mensagem original; uma chave incorreta provoca falha na autenticação.'),

  titulo2('6.2 Criptografia assimétrica'),
  paragrafo(
    'Bob gera um par de chaves RSA-2048 e divulga a chave pública. Alice cifra a mensagem com essa chave. Um espião intercepta a mensagem e tenta decifrá-la com a chave pública, sem sucesso. Bob decifra com a chave privada. Também é possível simular uma chave privada errada.'
  ),
  paragrafo('Na tela de criptografia assimétrica, Bob gera um par RSA-2048 e a aplicação exibe a chave pública e a chave privada em PEM. Alice utiliza a chave pública para cifrar uma mensagem. A simulação do espião demonstra que a chave pública não permite decifrar o conteúdo; somente a chave privada correspondente de Bob recupera a mensagem.'),

  titulo2('6.3 Hash'),
  paragrafo(
    'Conforme pedido no enunciado, o hash é gerado e conferido em **telas diferentes**. Na tela **Gerar Hash**, o usuário escolhe uma mensagem ou arquivo, calcula o SHA-256 (com comparação com MD5, SHA-1 e SHA-512), vê o efeito avalanche ao alterar 1 bit e pode copiar o hash ou baixar um arquivo .sha256. Na tela **Verificar Hash**, ele informa o hash esperado e a mensagem ou arquivo recebido, e a aplicação mostra se o hash confere ou não.'
  ),
  paragrafo('Na tela Gerar Hash, o usuário escolhe uma mensagem ou arquivo e recebe o SHA-256 em hexadecimal. A demonstração do efeito avalanche altera um único bit e apresenta um novo hash completamente diferente. Na tela Verificar Hash, o hash esperado é comparado ao hash calculado dos dados recebidos: entradas idênticas produzem o resultado “O hash confere”, enquanto qualquer alteração produz “O hash NÃO confere”.'),

  titulo2('6.4 Assinatura digital'),
  paragrafo(
    'Alice gera seu par de chaves, solicita um certificado à Autoridade Certificadora, assina um arquivo e o envia a Bob, que verifica a assinatura. A seguir são descritos os métodos usados em cada etapa.'
  ),
  paragrafo(
    '**Geração das chaves:** par RSA de 2048 bits (expoente público 65537), gerado com o módulo crypto do Node.js e exportado no formato PEM (chave pública no padrão SPKI e privada no padrão PKCS#8):'
  ),
  ...codigo([
    "crypto.generateKeyPairSync('rsa', {",
    '  modulusLength: 2048,',
    "  publicKeyEncoding: { type: 'spki', format: 'pem' },",
    "  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },",
    '});',
  ]),
  paragrafo(
    '**Autoridade Certificadora:** o projeto simula uma AC Raiz própria. Na primeira execução, o servidor gera um par de chaves RSA-2048 para a AC e um certificado **autoassinado** válido por 10 anos, marcado como AC (extensão basicConstraints com cA=true).'
  ),
  paragrafo('**Geração do certificado da Alice:** feita com a biblioteca node-forge, seguindo o padrão X.509 v3:'),
  ...numerados([
    'Cria-se o certificado e insere-se a chave pública da Alice.',
    'Gera-se um número de série aleatório de 128 bits.',
    'Define-se a validade de 1 ano.',
    'Preenchem-se o titular (nome, organização, país e e-mail) e o emissor (a AC).',
    'Adicionam-se as extensões: uso da chave para assinatura digital e não repúdio, e indicação de que não é uma AC.',
    'A AC assina o certificado com a sua chave privada, usando SHA-256 com RSA.',
  ]),
  paragrafo(
    '**Assinatura:** usa o esquema **RSA-PSS** com SHA-256. O hash do arquivo é calculado e assinado com a chave privada da Alice. A assinatura pode ser baixada em um arquivo .sig, e o certificado em um arquivo .crt.'
  ),
  paragrafo('**Verificação:** a assinatura só é considerada válida se as três verificações abaixo forem aprovadas:'),
  ...numerados([
    'O certificado foi emitido pela AC confiável (a assinatura da AC no certificado confere).',
    'O certificado está dentro do período de validade.',
    'A assinatura confere com o hash do arquivo, usando a chave pública contida no certificado.',
  ]),
  paragrafo('O mesmo processo pode ser reproduzido com o OpenSSL. O certificado gerado pela aplicação foi validado com o comando openssl verify, que retornou OK:'),
  ...codigo([
    'openssl genrsa -out alice.key 2048',
    'openssl req -new -key alice.key -out alice.csr -subj "/CN=Alice/O=IFSP/C=BR"',
    'openssl x509 -req -in alice.csr -CA ac.crt -CAkey ac.key -CAcreateserial -sha256 -days 365 -out alice.crt',
    'openssl verify -CAfile ac.crt alice.crt',
  ]),
  paragrafo('Na tela de assinatura digital, a tabela do certificado apresenta titular, emissor, número de série, validade, algoritmo e impressão digital. Depois da escolha do arquivo, a aplicação mostra o hash SHA-256 e a assinatura RSA-PSS em Base64. Na etapa de conferência, Bob recebe o conteúdo, a assinatura e o certificado; a verificação válida aprova a emissão pela AC, a validade temporal e a correspondência da assinatura. Alterar o arquivo ou usar um certificado falsificado faz pelo menos uma dessas verificações falhar.'),

  // 7
  titulo1('7. Testes e resultados'),
  paragrafo('Foram testados os cenários de sucesso e de falha de cada processo:'),
  tabela(
    ['Processo', 'Cenário testado', 'Resultado'],
    [
      ['Simétrica', 'Decifrar com a chave correta', 'Mensagem original recuperada'],
      ['Simétrica', 'Chave errada ou mensagem alterada', 'Decifragem recusada'],
      ['Assimétrica', 'Espião decifrando com a chave pública', 'Decifragem recusada'],
      ['Assimétrica', 'Chave privada de outro par', 'Decifragem recusada'],
      ['Hash', 'SHA-256 de "abc"', 'Igual ao valor de referência do NIST'],
      ['Hash', 'Arquivo de 5 MB', 'Igual ao Get-FileHash do Windows'],
      ['Hash', 'Mensagem com uma letra alterada', 'Hash não confere'],
      ['Assinatura', 'Arquivo e certificado corretos', 'Assinatura válida'],
      ['Assinatura', 'Conteúdo alterado após a assinatura', 'Assinatura inválida'],
      ['Assinatura', 'Certificado falsificado por um impostor', 'Inválida: não emitido pela AC'],
    ]
  ),

  // 8
  titulo1('8. Limitações'),
  paragrafo('Por ser uma aplicação didática, algumas simplificações foram feitas em relação a um sistema real:'),
  ...marcadores([
    'As chaves são geradas no servidor e trafegam até o navegador. Em um sistema real, a chave privada nunca sairia do dispositivo do dono.',
    'A AC é simulada e emite o certificado diretamente. Uma AC real exige uma requisição de certificado (CSR) e confirma a identidade do solicitante.',
    'O tamanho dos arquivos é limitado a 3 MB, por causa do limite da plataforma de hospedagem.',
  ]),

  // 9
  titulo1('9. Conclusão'),
  paragrafo(
    'O trabalho permitiu compreender, na teoria e na prática, como cada técnica contribui para a segurança da informação: a criptografia simétrica oferece sigilo com eficiência, mas exige o compartilhamento seguro da chave; a assimétrica resolve esse problema, mas é lenta, o que leva ao uso combinado das duas; o hash garante a integridade; e a assinatura digital, apoiada em certificados emitidos por uma Autoridade Certificadora, garante integridade, autenticidade e não repúdio.'
  ),
  paragrafo(
    'A aplicação desenvolvida demonstra esses conceitos de forma interativa, permitindo simular ataques e observar como cada mecanismo os detecta.'
  ),

  // Referências
  titulo1('Referências'),
  ...marcadores([
    'STALLINGS, William. Criptografia e segurança de redes: princípios e práticas. 6. ed. São Paulo: Pearson, 2015.',
    'NIST. FIPS 197: Advanced Encryption Standard (AES). 2001.',
    'NIST. SP 800-38D: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM). 2007.',
    'NIST. FIPS 180-4: Secure Hash Standard (SHS). 2015.',
    'IETF. RFC 8017: PKCS #1: RSA Cryptography Specifications Version 2.2. 2016.',
    'IETF. RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile. 2008.',
    'BRASIL. Medida Provisória nº 2.200-2, de 24 de agosto de 2001. Institui a Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil).',
    'NODE.JS. Crypto - Node.js Documentation. Disponível em: https://nodejs.org/api/crypto.html.',
  ]),
];

// ---------- Documento ----------

const rodape = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18 })],
    }),
  ],
});

const documento = new Document({
  creator: 'Gael Felix, Guilherme Bertero, Guilherme Francisco e João Gabriel',
  title: 'Criptografia, Hash e Assinatura Digital',
  styles: {
    default: { document: { run: { font: FONTE, size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { font: FONTE, size: 30, bold: true, color: COR_DESTAQUE },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { font: FONTE, size: 25, bold: true, color: COR_DESTAQUE },
      },
    ],
  },
  sections: [
    { properties: {}, children: capa },
    { properties: {}, footers: { default: rodape }, children: conteudo },
  ],
});

Packer.toBuffer(documento).then((buffer) => {
  fs.writeFileSync(ARQUIVO_SAIDA, buffer);
  console.log(`Relatório gerado em: ${ARQUIVO_SAIDA}`);
});
