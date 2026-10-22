const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const xmljs = require('xml-js');

const inputPath = path.join(__dirname, 'Apresentacao-Criptografia-Hash-Assinatura-Digital.pptx');
const outputPath = path.join(__dirname, 'Apresentacao-Criptografia-Hash-Assinatura-Digital-Animada.pptx');

const SLIDE_WIDTH = 12192000;
const SLIDE_HEIGHT = 6858000;
const DURATION_MS = 280;
const GROUP_SIZE = 3;
const GROUP_INTERVAL_MS = 330;

function readNumber(block, pattern) {
  const match = block.match(pattern);
  return match ? Number(match[1]) : 0;
}

function collectShapes(xml) {
  const blocks = [];
  const shapePattern = /<(p:sp|p:pic|p:graphicFrame|p:cxnSp)\b[\s\S]*?<\/\1>/g;
  let match;

  while ((match = shapePattern.exec(xml)) !== null) {
    const block = match[0];
    const tag = match[1];
    const metadata = block.match(/<p:cNvPr\b[^>]*\bid="(\d+)"[^>]*\bname="([^"]*)"[^>]*\/?\s*>/);
    if (!metadata) continue;

    const id = Number(metadata[1]);
    const name = metadata[2];
    const x = readNumber(block, /<(?:a|p):off\b[^>]*\bx="(\d+)"/);
    const y = readNumber(block, /<(?:a|p):off\b[^>]*\by="(\d+)"/);
    const cx = readNumber(block, /<(?:a|p):ext\b[^>]*\bcx="(\d+)"/);
    const cy = readNumber(block, /<(?:a|p):ext\b[^>]*\bcy="(\d+)"/);
    const hasText = /<a:t(?:\s[^>]*)?>[\s\S]*?<\/a:t>/.test(block);
    const isLine = tag === 'p:cxnSp' || /<a:prstGeom\b[^>]*\bprst="line"/.test(block) || /^Line\b/i.test(name);
    const coversSlide = cx >= SLIDE_WIDTH * 0.78 && cy >= SLIDE_HEIGHT * 0.72;
    const isFooter = y >= SLIDE_HEIGHT * 0.9;

    // Mantém estáticos somente fundo, grade, linhas de progresso e rodapé.
    if (id <= 1 || isLine || coversSlide || isFooter) continue;

    const isStructuralBar = !hasText && tag === 'p:sp' && cx >= SLIDE_WIDTH * 0.64 && cy <= SLIDE_HEIGHT * 0.14;
    if (isStructuralBar) continue;

    blocks.push({ id, name, x, y, cx, cy });
  }

  return blocks.sort((a, b) => (a.y - b.y) || (a.x - b.x) || (a.id - b.id));
}

function buildEffect(shapeId, nodeType, nextId) {
  const effectId = nextId();
  const visibilityId = nextId();
  const fadeId = nextId();

  return `<p:par><p:cTn id="${effectId}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="${nodeType}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:set><p:cBhvr><p:cTn id="${visibilityId}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${shapeId}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set><p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${fadeId}" dur="${DURATION_MS}"/><p:tgtEl><p:spTgt spid="${shapeId}"/></p:tgtEl></p:cBhvr></p:animEffect></p:childTnLst></p:cTn></p:par>`;
}

function buildTiming(shapes) {
  let idCounter = 4;
  const nextId = () => idCounter++;
  const groups = [];

  for (let offset = 0; offset < shapes.length; offset += GROUP_SIZE) {
    const groupIndex = Math.floor(offset / GROUP_SIZE);
    const group = shapes.slice(offset, offset + GROUP_SIZE);
    const wrapperId = nextId();
    const delay = groupIndex * GROUP_INTERVAL_MS;
    const effects = group.map((shape, index) => {
      if (groupIndex === 0 && index === 0) return buildEffect(shape.id, 'clickEffect', nextId);
      if (index === 0) return buildEffect(shape.id, 'afterEffect', nextId);
      return buildEffect(shape.id, 'withEffect', nextId);
    }).join('');

    groups.push(`<p:par><p:cTn id="${wrapperId}" fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst><p:childTnLst>${effects}</p:childTnLst></p:cTn></p:par>`);
  }

  const builds = shapes.map(shape => `<p:bldP spid="${shape.id}" grpId="0"/>`).join('');

  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>${groups.join('')}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst><p:bldLst>${builds}</p:bldLst></p:timing>`;
}

function insertTiming(xml, timing) {
  let result = xml.replace(/<p:timing\b[\s\S]*?<\/p:timing>/g, '');

  // Uma transição curta deixa a troca de slides coerente com as entradas.
  const transition = '<p:transition spd="fast" advClick="1"><p:fade/></p:transition>';
  result = result.replace(/<p:transition\b[\s\S]*?<\/p:transition>/g, '');

  if (/<p:extLst\b/.test(result)) {
    return result.replace(/<p:extLst\b/, `${transition}${timing}<p:extLst`);
  }

  return result.replace('</p:sld>', `${transition}${timing}</p:sld>`);
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Apresentação não encontrada: ${inputPath}`);
  }

  const zip = await JSZip.loadAsync(fs.readFileSync(inputPath));
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  let total = 0;

  for (const slideFile of slideFiles) {
    const xml = await zip.file(slideFile).async('string');
    const shapes = collectShapes(xml);
    if (!shapes.length) continue;

    const updatedXml = insertTiming(xml, buildTiming(shapes));
    xmljs.xml2js(updatedXml, { compact: false });
    zip.file(slideFile, updatedXml);
    total += shapes.length;

    const slideNumber = Number(slideFile.match(/slide(\d+)\.xml/)[1]);
    console.log(`Slide ${String(slideNumber).padStart(2, '0')}: ${shapes.length} elementos animados`);
  }

  const output = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  fs.writeFileSync(outputPath, output);
  console.log(`Total de animações: ${total}`);
  console.log(`Apresentação animada salva em: ${outputPath}`);
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
