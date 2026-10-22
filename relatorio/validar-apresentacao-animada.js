const fs = require('fs');
const JSZip = require('jszip');
const xmljs = require('xml-js');

const file = 'Apresentacao-Criptografia-Hash-Assinatura-Digital-Animada.pptx';

async function validate() {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const slides = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  let targetCount = 0;

  for (const slide of slides) {
    const xml = await zip.file(slide).async('string');
    xmljs.xml2js(xml, { compact: false });

    const shapeIds = new Set([...xml.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)].map(match => match[1]));
    const targets = [...xml.matchAll(/<p:spTgt\b[^>]*\bspid="(\d+)"/g)].map(match => match[1]);
    const timeNodeIds = [...xml.matchAll(/<p:cTn\b[^>]*\bid="(\d+)"/g)].map(match => match[1]);
    const duplicatedIds = timeNodeIds.filter((value, index, list) => list.indexOf(value) !== index);
    const invalidTargets = targets.filter(id => !shapeIds.has(id));
    const effects = (xml.match(/<p:animEffect\b/g) || []).length;
    const builds = (xml.match(/<p:bldP\b/g) || []).length;

    if (!xml.includes('<p:timing>') || !xml.includes('<p:transition') || invalidTargets.length || duplicatedIds.length || effects !== builds) {
      throw new Error(`${slide}: efeitos=${effects}, builds=${builds}, alvos inválidos=${invalidTargets}, IDs duplicados=${duplicatedIds}`);
    }

    targetCount += effects;
    console.log(`${slide}: ${effects} efeitos, XML válido`);
  }

  const size = fs.statSync(file).size / 1048576;
  console.log(`OK: ${slides.length} slides, ${targetCount} efeitos, ${size.toFixed(2)} MB`);
}

validate().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
