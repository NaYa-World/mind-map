const fs = require('fs');

function stripWrapper(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Remove the `import { ... } from './utils.js';`
  content = content.replace(/^import \{.*$\n/m, '');
  content = content.replace(/^import \{.*$\n/m, ''); // in case of multiples
  
  // Remove `export const ... = class {`
  content = content.replace(/export const \w+Mixin = class \{\n/, '');
  
  // Remove `}.prototype;`
  content = content.replace(/\}\.prototype;\n?$/, '');
  
  return content;
}

// refactor.cjs extraction:
/*
const preamble = extract(1, 222); 
const init = extract(224, 238);
const crudLines = extract(290, 343) + '\n' + extract(345, 536);
const layoutLines = extract(538, 815);
const renderLines = extract(817, 1276) + '\n' + extract(240, 288);
const eventsLines = extract(1453, 2160);
const storageLines = extract(2162, 2231) + '\n' + extract(2316, 2988);
const historyLines = extract(2233, 2314); 
const modalLines = extract(1278, 1428);
const miscLines = extract(2990, 3053);
*/

// Wait, the new app.js has:
// preamble, init, and the Object.assign at the bottom.
// I can just recreate the exact lines!

// Actually, let's read the extracted parts, and put them in a Map or array by their original line numbers!
const chunks = {};

// We can read the raw files we wrote in refactor.cjs. Wait, setup_imports.cjs modified them!
// We can strip the imports as above.

function getLines(file) {
  return stripWrapper(file).split('\n');
}

// But I grouped them!
// render.js has lines 817-1276 AND 240-288.
// Let's just manually reassemble them.
// Wait, renderLines = extract(817, 1276) + '\n' + extract(240, 288);
// So in render.js, the first 1276 - 817 + 1 = 460 lines are 817-1276.
// The rest is 240-288.

let renderArr = getLines('src/ui/render.js');
let render1 = renderArr.slice(0, 460).join('\n');
let measurer = renderArr.slice(460).join('\n');

let crudArr = getLines('src/core/crud.js');
// crudLines = extract(290, 343) + '\n' + extract(345, 536);
// 343 - 290 + 1 = 54 lines.
let sampleData = crudArr.slice(0, 54).join('\n');
let crud = crudArr.slice(54).join('\n');

let storageArr = getLines('src/core/storage.js');
// storageLines = extract(2162, 2231) + '\n' + extract(2316, 2988);
// 2231 - 2162 + 1 = 70 lines.
let storage1 = storageArr.slice(0, 70).join('\n');
let storage2 = storageArr.slice(70).join('\n');

let modalArr = getLines('src/ui/modals.js');
// modalLines = extract(1278, 1428) + '\n' + extract(2990, 3053);
// 1428 - 1278 + 1 = 151 lines.
let modals = modalArr.slice(0, 151).join('\n');
let misc = modalArr.slice(151).join('\n');

let layout = stripWrapper('src/core/layout.js');
let events = stripWrapper('src/ui/events.js');
let history = stripWrapper('src/core/history.js');

// Now, what about the original app.js pieces?
// We need preamble, init, and postamble.
let appCurrent = fs.readFileSync('app.js', 'utf8');
// The preamble was extract(1, 222). It's at the top of app.js.
// Wait, setup_imports.cjs REMOVED lines 1-174 and put them in utils.js!
// So lines 1-174 are in utils.js.
let utilsCode = fs.readFileSync('src/core/utils.js', 'utf8');
utilsCode = utilsCode.replace(/export \{.*\};\n$/, ''); // strip export
let preamble1_174 = utilsCode.trim();

// The rest of preamble (175-222) and init (224-238) are in app.js right now.
// Let's just find them by looking at app.js.
let appLines = appCurrent.split('\n');
// We can find `class MindMapApp {` to get the start of the class.
let startClassIdx = appLines.findIndex(l => l.includes('class MindMapApp {'));
let endClassIdx = appLines.findIndex(l => l.includes('Object.assign'));
let insideClass = appLines.slice(startClassIdx, endClassIdx);
// The first part of insideClass is preamble and init.
// Specifically: constructor and init.
// Actually, since we know exactly what is missing, let's just stitch them by line numbers!

let finalLines = new Array(3200).fill(''); 
function place(start, end, text) {
  let lines = text.split('\n');
  for(let i=0; i<lines.length; i++) {
    finalLines[start - 1 + i] = lines[i];
  }
}

place(1, 174, preamble1_174);
place(538, 815, layout);
place(817, 1276, render1);
place(240, 288, measurer);
place(1453, 2160, events);
place(2162, 2231, storage1);
place(2316, 2988, storage2);
place(2233, 2314, history);
place(290, 343, sampleData);
place(345, 536, crud);
place(1278, 1428, modals);
place(2990, 3053, misc);

// For the rest, we just fill from refactor.cjs strings if any.
// Lines 175-222 and 224-238 and 3055-end are in appCurrent!
// But where exactly? 
// appCurrent has:
// import ...
// [lines 175 to 222]
// [lines 224 to 238]
// }
// import ...
// Object.assign ...
// [lines 3055 to end]

let currentClassContent = appCurrent.replace(/import .*?\n/g, '').replace(/Object\.assign.*?\n/g, '').split('\n');
// Let's just manually extract the pieces we need from appCurrent since there are only 3 pieces.
let idx1 = currentClassContent.findIndex(l => l.includes('/* ============================================================')); // line 176
let idx2 = currentClassContent.findIndex(l => l.includes('init() {')); // line 227
let idx3 = currentClassContent.findIndex(l => l.includes('window.app = new MindMapApp();')); // around 3055

let part1 = currentClassContent.slice(idx1, idx2 - 3).join('\n'); // 176-222
let part2 = currentClassContent.slice(idx2 - 3, idx2 + 12).join('\n'); // 224-238
let part3 = currentClassContent.slice(idx3 - 2).join('\n'); // 3055-end

place(175, 222, part1);
place(224, 238, part2);
place(3055, 3100, part3);

let result = finalLines.join('\n');
fs.writeFileSync('app_recovered.js', result);
console.log('Recovered!');
