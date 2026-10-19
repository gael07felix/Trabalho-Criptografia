# Explicações do Projeto - Criptografia, Hash e Assinatura Digital

Este arquivo reúne as explicações de cada etapa do projeto: os conceitos, as decisões tomadas e o que cada parte do código faz. Ele serve de base para o relatório e para a apresentação.

---

## Visão geral

### Tecnologias

| Tecnologia | Para que serve no projeto |
|---|---|
| **HTML, CSS e JavaScript** | Telas que o usuário vê no navegador (front-end) |
| **Node.js** | Executa o JavaScript no servidor (back-end) |
| **Express** | Biblioteca que cria o servidor web e as rotas da API |
| **Módulo `crypto` do Node** | Biblioteca nativa que faz AES, RSA, SHA-256 e assinaturas |
| **`node-forge`** | Gera o certificado digital X.509 (Etapa 4) |

### Estrutura de pastas

```
├── package.json      -> configuração do projeto e dependências
├── server.js         -> servidor Express e rotas da API
├── src/              -> lógica de criptografia (back-end)
└── public/           -> telas (front-end)
    ├── css/          -> visual compartilhado
    └── js/           -> scripts de cada tela
```

### Como uma tela conversa com o servidor

Todas as telas seguem o mesmo fluxo:

1. O usuário preenche o formulário na página HTML.
2. O JavaScript da página (`public/js/...`) envia os dados ao servidor com `fetch`.
3. O `server.js` recebe a requisição numa rota (por exemplo, `POST /api/simetrica/cifrar`).
4. A rota chama a função correspondente em `src/`, que usa o módulo `crypto`.
5. O servidor devolve o resultado em JSON e a página mostra na tela.

A lógica de criptografia fica separada em `src/` para que o código seja fácil de ler e de mostrar no relatório, sem misturar com detalhes do servidor.

> **Observação de segurança:** neste projeto as chaves trafegam entre o navegador e o servidor para fins didáticos. Em um sistema real, a chave privada e a chave secreta nunca deveriam sair da máquina do seu dono.

---

## Etapa 0 - Base do projeto

### Objetivo

Deixar o servidor rodando e a página inicial com o menu, sem nenhuma criptografia ainda.

### Arquivos

- **`package.json`**: define o nome do projeto e dois scripts:
  - `npm start`: roda o servidor normalmente.
  - `npm run dev`: roda com `--watch`, que reinicia o servidor sozinho sempre que um arquivo é salvo.
- **`server.js`**: cria o servidor Express com três configurações:
  - `express.json({ limit: '10mb' })`: permite ler os dados em JSON enviados pelas telas. O limite de 10 MB é para quando enviarmos arquivos.
  - `express.static('public')`: entrega os arquivos da pasta `public`. Acessar `http://localhost:3000` devolve o `index.html`.
  - `GET /api/status`: rota de teste que responde se o servidor está funcionando.
- **`public/index.html`**: menu com links para as telas. Ao carregar, chama `/api/status` e mostra se o servidor respondeu.
- **`public/css/style.css`**: estilos compartilhados por todas as telas.

### Como rodar

```bash
npm install     # apenas na primeira vez, instala as dependências
npm run dev     # inicia o servidor em http://localhost:3000
```

---

## Etapa 1 - Criptografia simétrica (AES-256-GCM)

### Conceito

Na criptografia **simétrica**, a **mesma chave** é usada para cifrar e para decifrar. Quem tiver a chave consegue ler a mensagem.

- **Vantagem:** é muito rápida, ideal para grandes volumes de dados.
- **Desvantagem:** o problema da **distribuição de chaves**. Como enviar a chave para a outra pessoa sem que alguém a intercepte? Esse problema é resolvido pela criptografia assimétrica (Etapa 2).
- **Exemplos de algoritmos:** DES (obsoleto), 3DES (obsoleto), **AES** (padrão atual, adotado pelo NIST em 2001).

### Por que AES-256-GCM

- **AES** (Advanced Encryption Standard) é o algoritmo simétrico mais usado no mundo: HTTPS, Wi-Fi WPA2/WPA3, WhatsApp, etc.
- **256** é o tamanho da chave em bits. Existem também AES-128 e AES-192; o de 256 bits é o mais forte.
- **GCM** (Galois/Counter Mode) é o **modo de operação**. O AES cifra blocos de 16 bytes; o modo define como encadear esses blocos para mensagens maiores. O GCM tem uma vantagem importante: além de cifrar (**confidencialidade**), ele gera uma **tag de autenticação** que garante a **integridade**. Se alguém alterar o texto cifrado, a decifragem falha.

### Os três elementos

| Elemento | Tamanho | É secreto? | Função |
|---|---|---|---|
| **Chave** | 32 bytes (256 bits) | **Sim** | Usada para cifrar e decifrar. Só as partes autorizadas a conhecem. |
| **IV** (vetor de inicialização) | 12 bytes (96 bits) | Não | Valor aleatório gerado a cada cifragem. Faz com que a mesma mensagem, cifrada duas vezes com a mesma chave, gere resultados diferentes. Isso impede que um atacante perceba mensagens repetidas. **Nunca** deve ser reutilizado com a mesma chave. |
| **Tag de autenticação** | 16 bytes (128 bits) | Não | "Selo" calculado durante a cifragem. Na decifragem, o GCM recalcula a tag e compara; se não bater, recusa a mensagem. |

O IV e a tag não são secretos: são enviados junto com o texto cifrado. Apenas a chave precisa ser protegida.

### Formatos de exibição

Os dados criptográficos são bytes, que não podem ser exibidos diretamente como texto. Por isso são convertidos:

- **Hexadecimal (hex):** cada byte vira 2 caracteres (`0-9` e `a-f`). A chave de 32 bytes vira 64 caracteres. Usado para chave, IV e tag.
- **Base64:** representação mais compacta (4 caracteres a cada 3 bytes). Usado para o texto cifrado.

### Código - `src/simetrica.js`

- **`gerarChave()`**: usa `crypto.randomBytes(32)` para gerar 32 bytes aleatórios criptograficamente seguros e devolve em hex.
- **`cifrar(mensagem, chaveHex)`**:
  1. Converte a chave de hex para bytes e valida se tem 32 bytes.
  2. Gera um IV aleatório de 12 bytes.
  3. Cria o cifrador com `crypto.createCipheriv('aes-256-gcm', chave, iv)`.
  4. Passa a mensagem por `update()` e finaliza com `final()`.
  5. Obtém a tag com `getAuthTag()`.
  6. Junta tudo em um **pacote**: `IV (12 bytes) + tag (16 bytes) + texto cifrado`, convertido para Base64. Também devolve as partes separadas, para exibição nos detalhes técnicos.
- **`decifrar(pacote, chaveHex)`**:
  1. Converte o pacote de Base64 para bytes e separa as partes pela posição: os 12 primeiros bytes são o IV, os 16 seguintes são a tag e o restante é o texto cifrado.
  2. Cria o decifrador com `crypto.createDecipheriv` usando a chave e o IV.
  3. Informa a tag esperada com `setAuthTag()`.
  4. Decifra com `update()` e `final()`. Se a chave estiver errada ou qualquer byte do pacote tiver sido alterado, o `final()` lança um erro, e devolvemos a mensagem "chave incorreta ou mensagem alterada".

### Por que juntar tudo em um pacote

Na prática, o destinatário precisa receber o IV, a tag e o texto cifrado. Em vez de enviar três valores separados, eles são concatenados em um único bloco. Como o IV e a tag têm tamanhos fixos, o destinatário sabe exatamente onde cada parte começa e termina. Esse é o formato usado em sistemas reais, e deixa a tela mais simples: só existe **uma** mensagem cifrada viajando pela rede.

### Rotas - `server.js`

| Rota | Recebe | Devolve |
|---|---|---|
| `POST /api/simetrica/gerar-chave` | nada | `{ chave }` |
| `POST /api/simetrica/cifrar` | `{ mensagem, chave }` | `{ pacote, iv, tag, textoCifrado }` |
| `POST /api/simetrica/decifrar` | `{ pacote, chave }` | `{ mensagem }` ou `{ erro }` |

### Tela - `public/simetrica.html`

A tela é um **passo a passo** que conta uma história: **Alice** quer mandar uma mensagem secreta para **Bob**. Cada passo tem uma ilustração, uma explicação curta e um aviso (verde para sucesso, vermelho para erro) depois de cada ação.

| Passo | O que acontece | Libera o "Próximo" quando |
|---|---|---|
| 1. Alice e Bob combinam uma chave secreta | A chave é gerada automaticamente ao abrir a página | Já vem liberado |
| 2. Alice escreve e cifra a mensagem | Alice digita a mensagem e clica em "Cifrar mensagem" | A mensagem for cifrada |
| 3. A mensagem cifrada viaja pela rede | Mostra o que um espião veria. O campo é editável para simular um atacante. Os "detalhes técnicos" mostram o IV, a tag e o texto cifrado | Já vem liberado |
| 4. Bob decifra com a mesma chave | Bob usa a chave dele (editável para simular uma chave errada) e clica em "Decifrar mensagem" | Bob tentar decifrar |
| 5. Resumo | Compara a mensagem enviada com a lida e resume os conceitos | Botão vira "Recomeçar" |

### Passo a passo reutilizável - `public/js/comum.js`

Para que todas as telas sigam o mesmo modelo, as partes comuns ficam em um arquivo compartilhado:

- **`enviar(rota, dados)`**: faz o `fetch` para o servidor e lança um erro se a resposta indicar falha.
- **`mostrarAviso(id, tipo, texto)`** e **`limparAviso(id)`**: exibem ou escondem os avisos de sucesso, erro ou informação.
- **`iniciarPassoAPasso(container, { aoMostrar })`**: transforma cada `<div class="passo">` em uma etapa. Ele cria automaticamente o número e o título de cada passo (a partir do atributo `data-titulo`), os pontos de progresso e os botões Voltar e Próximo. Passos com o atributo `data-requer-acao` só liberam o "Próximo" quando a página chama `liberar(indice)`. A função `aoMostrar` é chamada sempre que um passo aparece, permitindo, por exemplo, montar o resumo ao chegar no último passo.

### Demonstrações para a apresentação

1. **Funcionamento normal:** seguir os 5 passos sem alterar nada. O resumo mostra que as mensagens são idênticas.
2. **Mesma mensagem, resultados diferentes:** no passo 2, cifrar a mesma mensagem duas vezes. O pacote muda por causa do IV aleatório.
3. **Chave errada:** no passo 4, alterar um caractere da chave do Bob e decifrar. A decifragem falha.
4. **Integridade:** no passo 3, alterar um caractere da mensagem viajando pela rede. No passo 4, a decifragem falha, mostrando que o GCM detecta alterações.

---

## Etapa 2 - Criptografia assimétrica (RSA-2048)

### Conceito

Na criptografia **assimétrica**, cada pessoa tem um **par de chaves** ligadas matematicamente:

- **Chave pública:** pode ser divulgada para qualquer pessoa.
- **Chave privada:** fica guardada apenas com o dono e nunca é compartilhada.

O que é cifrado com a chave pública **só pode ser decifrado com a chave privada** correspondente. Assim, qualquer pessoa pode enviar uma mensagem secreta para Bob usando a chave pública dele, mas só Bob consegue ler.

- **Vantagem:** resolve o **problema da distribuição de chaves** da criptografia simétrica. Alice e Bob não precisam combinar nenhum segredo antes.
- **Desvantagens:** é muito mais lenta que a simétrica e só consegue cifrar mensagens pequenas.
- **Exemplos de algoritmos:** **RSA** (1977), ECC (curvas elípticas), ElGamal. O Diffie-Hellman é usado para troca de chaves.

### Como o RSA funciona (resumo matemático)

1. Escolhem-se dois números primos muito grandes, `p` e `q`.
2. Calcula-se `n = p × q`. O `n` faz parte das duas chaves.
3. A partir de `p` e `q`, calculam-se dois expoentes: `e` (público, normalmente 65537) e `d` (privado).
4. **Chave pública:** `(n, e)`. **Chave privada:** `(n, d)`.
5. Cifrar: `c = m^e mod n`. Decifrar: `m = c^d mod n`.

A segurança vem da dificuldade de **fatorar** `n`: conhecendo apenas `n`, é inviável descobrir `p` e `q` (e, portanto, `d`) quando `n` tem 2048 bits.

### Decisões tomadas

- **RSA com chave de 2048 bits:** tamanho mínimo recomendado atualmente pelo NIST.
- **Padding OAEP com SHA-256:** o RSA "puro" é determinístico (a mesma mensagem sempre gera o mesmo resultado) e vulnerável a ataques. O **OAEP** (Optimal Asymmetric Encryption Padding) adiciona aleatoriedade antes de cifrar, então a mesma mensagem gera resultados diferentes a cada vez.
- **Limite de 190 bytes:** com chave de 2048 bits (256 bytes) e OAEP com SHA-256, sobram `256 - 2 × 32 - 2 = 190` bytes para a mensagem. A tela mostra um contador de bytes. Letras acentuadas ocupam 2 bytes em UTF-8.

### Formato PEM

As chaves são exibidas no formato **PEM**: o conteúdo binário da chave em Base64, entre as linhas `-----BEGIN ...-----` e `-----END ...-----`.

- Chave pública no padrão **SPKI** (`BEGIN PUBLIC KEY`).
- Chave privada no padrão **PKCS#8** (`BEGIN PRIVATE KEY`).

### Código - `src/assimetrica.js`

- **`gerarParDeChaves()`**: usa `crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })` e devolve as duas chaves em PEM.
- **`cifrar(mensagem, chavePublica)`**: valida o limite de 190 bytes e cifra com `crypto.publicEncrypt`, usando OAEP com SHA-256. Devolve o resultado em Base64.
- **`decifrar(textoCifrado, chavePrivada)`**: decifra com `crypto.privateDecrypt`. Se a chave não for a privada correta (por exemplo, a chave pública ou a privada de outro par) ou se a mensagem tiver sido alterada, lança o erro "a chave não é a chave privada correta ou a mensagem foi alterada".

### Rotas - `server.js`

| Rota | Recebe | Devolve |
|---|---|---|
| `POST /api/assimetrica/gerar-chaves` | nada | `{ chavePublica, chavePrivada }` |
| `POST /api/assimetrica/cifrar` | `{ mensagem, chavePublica }` | `{ textoCifrado }` |
| `POST /api/assimetrica/decifrar` | `{ textoCifrado, chavePrivada }` | `{ mensagem }` ou `{ erro }` |

### Tela - `public/assimetrica.html`

| Passo | O que acontece | Libera o "Próximo" quando |
|---|---|---|
| 1. Bob gera um par de chaves | Bob clica em "Gerar par de chaves" e vê a chave pública e a privada lado a lado | O par for gerado |
| 2. Alice cifra com a chave pública do Bob | Alice recebe a chave pública, digita a mensagem (com contador de bytes) e cifra | A mensagem for cifrada |
| 3. Um espião intercepta a mensagem | O espião tenta decifrar usando a chave pública, e falha | Já vem liberado |
| 4. Bob decifra com a chave privada | Bob decifra com a chave privada. O botão "Simular chave privada errada" troca a chave pela de outro par | Bob tentar decifrar |
| 5. Resumo | Compara as mensagens e resume os conceitos, incluindo a criptografia híbrida | Botão vira "Recomeçar" |

### Criptografia híbrida

Como o RSA é lento e só cifra mensagens pequenas, na prática os dois tipos de criptografia são combinados:

1. Alice gera uma chave AES aleatória (simétrica).
2. Alice cifra a mensagem (de qualquer tamanho) com essa chave AES.
3. Alice cifra a chave AES com a chave pública RSA do Bob.
4. Bob decifra a chave AES com a chave privada dele e, com ela, decifra a mensagem.

Assim se tem a velocidade do AES e a facilidade de distribuição de chaves do RSA. É o que acontece no HTTPS (TLS), no e-mail cifrado (PGP) e em aplicativos de mensagem.

### Demonstrações para a apresentação

1. **Funcionamento normal:** seguir os 5 passos. Bob lê a mensagem da Alice.
2. **Espião com a chave pública:** no passo 3, clicar em "Espião tenta decifrar". Falha, mostrando que a chave pública não decifra.
3. **Chave privada errada:** no passo 4, clicar em "Simular chave privada errada" e decifrar. Falha.
4. **Mesma mensagem, resultados diferentes:** no passo 2, cifrar a mesma mensagem duas vezes. O resultado muda por causa do OAEP.
5. **Limite de tamanho:** digitar uma mensagem com mais de 190 bytes. O contador fica vermelho e a cifragem é recusada.

---

## Etapa 3 - Hash (SHA-256)

### Conceito

Uma **função hash** recebe dados de qualquer tamanho e produz um resumo de **tamanho fixo**, chamado de hash (ou digest). Funciona como uma "impressão digital" dos dados.

Propriedades de uma função hash criptográfica:

| Propriedade | Significado |
|---|---|
| **Determinística** | A mesma entrada sempre gera o mesmo hash |
| **Tamanho fixo** | O SHA-256 sempre gera 256 bits, seja a entrada 1 letra ou 1 GB |
| **Mão única** | A partir do hash, é inviável descobrir os dados originais. Não existe "decifrar" um hash |
| **Efeito avalanche** | Mudar 1 bit da entrada muda, em média, metade dos bits do hash |
| **Resistência a colisões** | É inviável encontrar duas entradas diferentes com o mesmo hash |

**Hash não é criptografia:** a criptografia é reversível (quem tem a chave decifra); o hash não é reversível e não usa chave.

### Algoritmos

| Algoritmo | Tamanho | Situação |
|---|---|---|
| MD5 | 128 bits | **Inseguro**: colisões encontradas em 2004 |
| SHA-1 | 160 bits | **Inseguro**: colisão demonstrada pelo Google em 2017 (ataque SHAttered) |
| **SHA-256** (família SHA-2) | 256 bits | **Seguro**, padrão atual. Usado neste projeto |
| SHA-512 (família SHA-2) | 512 bits | Seguro |
| SHA-3 | variável | Seguro, padrão mais recente do NIST (2015) |

### Usos

- **Integridade de arquivos:** sites divulgam o hash dos downloads para que o usuário confira se o arquivo não foi corrompido ou adulterado.
- **Armazenamento de senhas:** o sistema guarda o hash da senha (com "sal" e algoritmos lentos como bcrypt ou Argon2), nunca a senha em si.
- **Assinatura digital:** assina-se o hash do arquivo, e não o arquivo inteiro (Etapa 4).
- **Blockchain:** cada bloco contém o hash do bloco anterior.

### Limitação importante

O hash garante **integridade**, mas sozinho não garante **autenticidade**. Se um atacante trocar o arquivo, ele também pode trocar o hash divulgado. Para provar quem gerou o arquivo, é preciso a **assinatura digital**.

### Como o projeto atende ao enunciado

O enunciado exige calcular o hash de uma mensagem ou arquivo e **conferir em outra tela**. Por isso existem duas telas independentes:

- **Tela 1 - `hash-gerar.html`:** calcula o hash e permite copiá-lo ou baixar um arquivo `.sha256`.
- **Tela 2 - `hash-verificar.html`:** recebe o hash esperado e os dados recebidos, recalcula o hash e informa se confere.

O hash é levado de uma tela para a outra de três formas: copiando e colando, carregando o arquivo `.sha256`, ou pelo botão "Usar o último hash gerado", que lê o valor salvo no `localStorage` do navegador.

### Envio de arquivos

O navegador lê os bytes do texto (convertido com `TextEncoder`, em UTF-8) ou do arquivo e os envia ao servidor em **Base64** dentro do JSON. O Base64 ocupa cerca de 33% a mais que o original, por isso o limite do servidor foi aumentado para 30 MB e o limite de arquivo na tela é de 20 MB.

### Código - `src/hash.js`

- **`gerar(dadosBase64)`**: converte de Base64 para bytes e calcula o hash com `crypto.createHash('sha256').update(dados).digest('hex')`. Também calcula MD5, SHA-1 e SHA-512 para comparação.
- **`verificar(dadosBase64, hashEsperado)`**:
  1. Normaliza o hash esperado: remove espaços, converte para minúsculas e aceita o formato do comando `sha256sum` (`<hash>  <nome do arquivo>`).
  2. Valida se tem 64 caracteres hexadecimais.
  3. Calcula o hash dos dados recebidos.
  4. Compara com `crypto.timingSafeEqual`, que leva sempre o mesmo tempo, independentemente de onde está a primeira diferença. Isso evita **ataques de temporização**, em que o atacante mede o tempo da comparação para descobrir o hash aos poucos.

### Rotas - `server.js`

| Rota | Recebe | Devolve |
|---|---|---|
| `POST /api/hash/gerar` | `{ dados }` (Base64) | `{ tamanhoBytes, sha256, comparacao: { md5, sha1, sha512 } }` |
| `POST /api/hash/verificar` | `{ dados, hashEsperado }` | `{ confere, hashEsperado, hashCalculado }` |

### Tela 1 - Gerar hash

| Passo | O que acontece | Libera o "Próximo" quando |
|---|---|---|
| 1. Escolha uma mensagem ou arquivo | Abas para digitar uma mensagem ou escolher um arquivo | Houver conteúdo |
| 2. Calcule o hash | Mostra o SHA-256 e, opcionalmente, MD5, SHA-1 e SHA-512 | O hash for calculado |
| 3. Efeito avalanche | Altera 1 bit do último byte, recalcula e destaca em vermelho os caracteres que mudaram, informando quantos dos 256 bits mudaram | Já vem liberado |
| 4. Guarde o hash | Botões para copiar o hash, baixar o `.sha256` e abrir a tela de verificação | Botão vira "Recomeçar" |

### Tela 2 - Verificar hash

| Passo | O que acontece | Libera o "Próximo" quando |
|---|---|---|
| 1. Informe o hash esperado | Colar, carregar `.sha256` ou usar o último hash gerado. Valida o formato na hora | O hash for válido |
| 2. Informe a mensagem ou arquivo recebido | Mesmas abas da tela 1 | Houver conteúdo |
| 3. Compare os hashes | Resultado em destaque: "O hash confere" (verde) ou "O hash NÃO confere" (vermelho), com os dois hashes | A verificação for feita |
| 4. O que isso significa | Explica o resultado e a limitação do hash | Botão vira "Recomeçar" |

### Testes realizados

- O SHA-256 de `abc` gerado pelo servidor é igual ao valor de referência oficial do NIST: `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`.
- O hash de um arquivo de 5 MB gerado pelo servidor é igual ao calculado pelo comando `Get-FileHash` do Windows.

### Demonstrações para a apresentação

1. **Funcionamento normal:** gerar o hash de um arquivo na tela 1, baixar o `.sha256`, abrir a tela 2, carregar o `.sha256` e o mesmo arquivo. Resultado: confere.
2. **Arquivo alterado:** repetir com um arquivo levemente modificado (por exemplo, um `.txt` com uma letra a mais). Resultado: não confere.
3. **Efeito avalanche:** no passo 3 da tela 1, alterar 1 bit e mostrar que cerca de 50% dos bits do hash mudaram.
4. **Conferência externa:** mostrar que o hash da tela é igual ao do comando `Get-FileHash arquivo -Algorithm SHA256` no PowerShell, provando que o padrão é universal.

---

## Etapa 4 - Assinatura digital com certificado X.509

### Conceito

A **assinatura digital** usa a criptografia assimétrica "ao contrário" da cifragem:

| | Cifragem (Etapa 2) | Assinatura digital |
|---|---|---|
| Objetivo | Sigilo | Integridade, autenticidade e não repúdio |
| Quem usa a chave **privada** | O destinatário, para decifrar | O autor, para **assinar** |
| Quem usa a chave **pública** | O remetente, para cifrar | Qualquer pessoa, para **verificar** |

Garantias da assinatura digital:

- **Integridade:** se o conteúdo for alterado depois de assinado, a verificação falha.
- **Autenticidade:** só quem tem a chave privada consegue gerar uma assinatura que confere com a chave pública dele.
- **Não repúdio:** como só o autor tem a chave privada, ele não pode negar que assinou.

A assinatura **não garante sigilo**: o conteúdo continua legível. Para sigilo, combina-se assinatura com criptografia.

### Como funciona a assinatura

**Assinar (Alice):**
1. Calcula o **hash SHA-256** do conteúdo.
2. Cifra esse hash com a sua **chave privada**. O resultado é a assinatura.
3. Envia o conteúdo, a assinatura e o seu certificado.

**Verificar (Bob):**
1. Calcula o hash SHA-256 do conteúdo recebido.
2. Usa a **chave pública** (que está no certificado) para conferir a assinatura contra esse hash.
3. Se conferir, o conteúdo é íntegro e foi assinado pelo dono da chave privada.

Assina-se o hash, e não o conteúdo inteiro, porque o RSA só processa blocos pequenos (como visto na Etapa 2) e porque o hash representa o conteúdo de forma única.

### Por que é preciso um certificado digital

Uma chave pública sozinha não diz **de quem** ela é. Um impostor poderia gerar um par de chaves e dizer "esta é a chave pública da Alice". O **certificado digital** resolve isso: é um documento eletrônico que **liga uma chave pública à identidade do titular**, e é **assinado por uma Autoridade Certificadora (AC)** em quem todos confiam.

Conteúdo de um certificado no padrão **X.509 v3**:

| Campo | Exemplo no projeto |
|---|---|
| Titular (Subject) | `CN=Alice, O=IFSP, C=BR, emailAddress=alice@ifsp.edu.br` |
| Emissor (Issuer) | `CN=AC Raiz IFSP - Segurança da Informação (simulada), O=IFSP, C=BR` |
| Número de série | 128 bits aleatórios, único para cada certificado |
| Validade | De hoje até daqui a 1 ano |
| Chave pública do titular | RSA 2048 bits |
| Extensões | Uso da chave: assinatura digital e não repúdio; não é uma AC |
| Assinatura da AC | SHA-256 com RSA, feita com a chave privada da AC |

### Cadeia de confiança e AC simulada

No mundo real existe uma hierarquia: a **AC Raiz** assina os certificados das ACs intermediárias, que assinam os certificados dos usuários. No Brasil, essa estrutura é a **ICP-Brasil** (Infraestrutura de Chaves Públicas Brasileira), cuja raiz é mantida pelo ITI. Os certificados das ACs raiz vêm pré-instalados nos sistemas operacionais e navegadores.

O projeto simula essa estrutura com uma **AC Raiz própria**:

- Na primeira vez que o servidor sobe, ele cria a AC: um par de chaves RSA-2048 e um certificado **autoassinado** (emissor = titular), válido por 10 anos, com as extensões `basicConstraints: cA=true` e `keyUsage: keyCertSign, cRLSign`.
- A chave privada e o certificado da AC são salvos em `dados/ac/`. Assim, os certificados emitidos continuam verificáveis depois de reiniciar o servidor. Essa pasta está no `.gitignore`, porque uma chave privada nunca deve ir para um repositório.
- O certificado da AC pode ser baixado no último passo da tela.

### Método de geração das chaves

As chaves da Alice são geradas com o módulo `crypto` do Node (mesma função da Etapa 2):

```js
crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
```

- **Algoritmo:** RSA, com módulo de 2048 bits e expoente público 65537.
- **Formato:** PEM, com a chave pública em SPKI e a privada em PKCS#8.

### Método de geração do certificado

O certificado é criado com a biblioteca **`node-forge`**, porque o módulo `crypto` do Node consegue ler e validar certificados, mas não criá-los:

1. Cria um certificado vazio com `forge.pki.createCertificate()`.
2. Coloca a **chave pública da Alice**.
3. Gera um **número de série** aleatório de 128 bits (com o primeiro bit zerado, pois o padrão exige número positivo).
4. Define a **validade** (1 ano).
5. Define o **titular** (nome, organização, país e e-mail) e o **emissor** (nome da AC). Os nomes usam o tipo `UTF8String` para aceitar acentos.
6. Adiciona as **extensões**: `basicConstraints: cA=false`, `keyUsage: digitalSignature, nonRepudiation`, `subjectKeyIdentifier` e `authorityKeyIdentifier`.
7. A AC **assina** o certificado com a chave privada dela usando SHA-256 com RSA: `certificado.sign(chavePrivadaAC, forge.md.sha256.create())`.
8. Exporta no formato PEM (`-----BEGIN CERTIFICATE-----`).

> **Simplificação em relação ao mundo real:** uma AC real recebe uma **CSR** (Certificate Signing Request), assinada com a chave privada do solicitante para provar que ele a possui, e verifica a identidade da pessoa (na ICP-Brasil, presencialmente ou por videoconferência). No projeto, a AC emite o certificado diretamente a partir da chave pública e dos dados informados.

### Comandos OpenSSL equivalentes

O mesmo processo pode ser feito pelo terminal com o OpenSSL, o que é útil para mostrar no relatório:

```bash
# 1. AC Raiz: chave e certificado autoassinado (10 anos)
openssl genrsa -out ac.key 2048
openssl req -x509 -new -key ac.key -sha256 -days 3650 -out ac.crt -subj "/CN=AC Raiz IFSP/O=IFSP/C=BR"

# 2. Alice: par de chaves e pedido de certificado (CSR)
openssl genrsa -out alice.key 2048
openssl req -new -key alice.key -out alice.csr -subj "/CN=Alice/O=IFSP/C=BR"

# 3. A AC assina o pedido e emite o certificado da Alice (1 ano)
openssl x509 -req -in alice.csr -CA ac.crt -CAkey ac.key -CAcreateserial -sha256 -days 365 -out alice.crt

# 4. Alice assina um arquivo (RSA-PSS com SHA-256)
openssl dgst -sha256 -sigopt rsa_padding_mode:pss -sign alice.key -out arquivo.sig arquivo.pdf

# 5. Bob verifica o certificado e a assinatura
openssl verify -CAfile ac.crt alice.crt
openssl x509 -in alice.crt -pubkey -noout > alice.pub
openssl dgst -sha256 -sigopt rsa_padding_mode:pss -verify alice.pub -signature arquivo.sig arquivo.pdf
```

O certificado gerado pelo projeto foi validado com `openssl verify -CAfile ac.crt certificado.crt`, que respondeu `OK`, confirmando que ele segue o padrão X.509.

> **Diferença de formato:** o arquivo `.sig` gerado pela aplicação contém a assinatura em Base64 (texto), enquanto o OpenSSL gera a assinatura em binário. Para usar o `.sig` da aplicação no OpenSSL, é preciso decodificá-lo antes (`openssl base64 -d -in arquivo.sig -out arquivo.bin`).

### Esquema de assinatura: RSA-PSS

A assinatura usa **RSA-PSS** (Probabilistic Signature Scheme) com SHA-256 e sal de 32 bytes. O PSS adiciona aleatoriedade, então assinar o mesmo conteúdo duas vezes gera assinaturas diferentes, e as duas são válidas. É o esquema recomendado atualmente, mais seguro que o antigo PKCS#1 v1.5.

### Código - `src/assinatura.js`

- **`criarAC()` e `carregarAC()`**: criam a AC na primeira execução e a carregam de `dados/ac/` nas seguintes.
- **`emitirCertificado(dados)`**: monta e assina o certificado da Alice com a chave privada da AC.
- **`emitirCertificadoFalso(dados)`**: simula um impostor. O certificado tem o mesmo nome de emissor da AC, mas é assinado com outra chave. Serve para demonstrar que copiar o nome da AC não engana a verificação.
- **`assinar(dados, chavePrivada)`**: `crypto.sign('sha256', dados, { key, padding: PSS })`. O próprio `crypto.sign` calcula o hash SHA-256 e assina. Também devolve o hash, para exibição.
- **`verificar(dados, assinatura, certificado)`**: faz três verificações com o módulo `crypto` nativo:
  1. **Emitido pela AC:** `certificado.checkIssued(certificadoAC)` (o emissor é a AC) e `certificado.verify(chavePublicaAC)` (a assinatura da AC no certificado confere).
  2. **Validade:** a data atual está entre `validFrom` e `validTo`.
  3. **Assinatura:** `crypto.verify('sha256', dados, { key: chavePublicaDoCertificado, padding: PSS }, assinatura)`.

  A assinatura só é considerada **válida** se as três verificações passarem.

> **Sobre o alerta do `npm audit`:** o `node-forge` tem uma vulnerabilidade conhecida na **verificação** de assinaturas PKCS#1 v1.5. O projeto usa o `node-forge` apenas para **criar** certificados; toda a verificação é feita pelo módulo `crypto` nativo do Node. Por isso, o projeto não é afetado.

### Rotas - `server.js`

| Rota | Recebe | Devolve |
|---|---|---|
| `POST /api/assinatura/gerar-chaves` | nada | `{ chavePublica, chavePrivada }` |
| `GET /api/assinatura/ac` | nada | `{ certificado, detalhes }` da AC |
| `POST /api/assinatura/emitir-certificado` | `{ nome, email, organizacao, chavePublica }` | `{ certificado, detalhes }` |
| `POST /api/assinatura/emitir-certificado-falso` | `{ nome, email, organizacao, chavePublica }` | `{ certificado, detalhes }` |
| `POST /api/assinatura/assinar` | `{ dados, chavePrivada }` | `{ hash, assinatura }` |
| `POST /api/assinatura/verificar` | `{ dados, assinatura, certificado }` | `{ valida, verificacoes, hash, certificado }` |

### Tela - `public/assinatura.html`

| Passo | O que acontece | Libera o "Próximo" quando |
|---|---|---|
| 1. Alice gera o par de chaves | Gera e mostra a chave pública e a privada | O par for gerado |
| 2. A AC emite o certificado | Alice informa nome, e-mail e organização e solicita o certificado. A tela mostra uma tabela com os campos do certificado, o PEM e um botão para baixar o `.crt` | O certificado for emitido |
| 3. Alice assina um arquivo | Escolhe uma mensagem ou arquivo e assina. Mostra o hash e a assinatura, com botão para baixar o `.sig` | O conteúdo for assinado |
| 4. Bob verifica a assinatura | Os campos já vêm preenchidos com o conteúdo, a assinatura e o certificado, e tudo pode ser alterado ou carregado de arquivos. Mostra as três verificações (com &#10003; ou &#10007;) e o resultado | Bob verificar |
| 5. Resumo | Explica as garantias da assinatura e permite baixar o certificado da AC | Botão vira "Recomeçar" |

### Testes realizados

| Cenário | Emitido pela AC | Validade | Assinatura | Resultado |
|---|---|---|---|---|
| Tudo correto | Sim | Sim | Sim | **Válida** |
| Conteúdo alterado ("R$ 100,00" trocado por "R$ 900,00") | Sim | Sim | Não | Inválida |
| Assinado com outra chave privada | Sim | Sim | Não | Inválida |
| Certificado falsificado por um impostor | Não | Sim | Sim | Inválida |
| Assinatura vazia | Sim | Sim | Não | Inválida |
| Certificado em formato inválido | - | - | - | Erro: "Certificado inválido" |

Além disso, o certificado foi validado pelo OpenSSL (`openssl verify` respondeu `OK`) e os acentos do nome do titular e da AC aparecem corretamente.

### Demonstrações para a apresentação

1. **Funcionamento normal:** seguir os 5 passos. Resultado: assinatura válida, com as três verificações aprovadas.
2. **Conteúdo alterado:** no passo 4, desmarcar "Usar exatamente o conteúdo que a Alice assinou" e digitar a mensagem com uma alteração. A verificação da assinatura falha.
3. **Certificado falsificado:** no passo 4, clicar em "Simular certificado falsificado". A verificação "emitido pela AC" falha, mesmo com o nome da AC copiado.
4. **Arquivos reais:** assinar um PDF, baixar o `.crt` e o `.sig`, recomeçar a tela e, no passo 4, carregar o PDF, o `.sig` e o `.crt` de novo.
5. **Visualizar o certificado no Windows:** abrir o `.crt` baixado com dois cliques. O Windows mostra os campos (titular, emissor, validade) e avisa que a AC não é confiável, porque ela não está instalada no sistema. Isso ilustra bem o papel da cadeia de confiança.
