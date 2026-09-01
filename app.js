const VERSES = [
  'וַיַּעֲל֤וּ כׇל־הָעָם֙ אַחֲרָ֔יו וְהָעָם֙ מְחַלְּלִ֣ים בַּחֲלִלִ֔ים וּשְׂמֵחִ֖ים שִׂמְחָ֣ה גְדוֹלָ֑ה וַתִּבָּקַ֥ע הָאָ֖רֶץ בְּקוֹלָֽם׃',
  'וַיִּשְׁמַ֣ע אֲדֹנִיָּ֗הוּ וְכׇל־הַקְּרֻאִים֙ אֲשֶׁ֣ר אִתּ֔וֹ וְהֵ֖ם כִּלּ֣וּ לֶאֱכֹ֑ל וַיִּשְׁמַ֤ע יוֹאָב֙ אֶת־ק֣וֹל הַשּׁוֹפָ֔ר וַיֹּ֕אמֶר מַדּ֥וּעַ קֽוֹל־הַקִּרְיָ֖ה הוֹמָֽה׃',
  'עוֹדֶ֣נּוּ מְדַבֵּ֔ר וְהִנֵּ֧ה יוֹנָתָ֛ן בֶּן־אֶבְיָתָ֥ר הַכֹּהֵ֖ן בָּ֑א וַיֹּ֤אמֶר אֲדֹנִיָּ֙הוּ֙ בֹּ֔א כִּ֣י אִ֥ישׁ חַ֛יִל אַ֖תָּה וְט֥וֹב תְּבַשֵּֽׂר׃',
  'וַיַּ֙עַן֙ יֽוֹנָתָ֔ן וַיֹּ֖אמֶר לַאֲדֹנִיָּ֑הוּ אֲבָ֕ל אֲדֹנֵ֥ינוּ הַמֶּלֶךְ־דָּוִ֖ד הִמְלִ֥יךְ אֶת־שְׁלֹמֹֽה׃',
  'וַיִּשְׁלַ֣ח אִתּֽוֹ־הַ֠מֶּ֠לֶךְ אֶת־צָד֨וֹק הַכֹּהֵ֜ן וְאֶת־נָתָ֣ן הַנָּבִ֗יא וּבְנָיָ֙הוּ֙ בֶּן־יְה֣וֹיָדָ֔ע וְהַכְּרֵתִ֖י וְהַפְּלֵתִ֑י וַיַּרְכִּ֣בוּ אֹת֔וֹ עַ֖ל פִּרְדַּ֥ת הַמֶּֽלֶךְ׃',
  'וַיִּמְשְׁח֣וּ אֹת֡וֹ צָד֣וֹק הַכֹּהֵ֣ן וְנָתָן֩ הַנָּבִ֨יא ׀ לְמֶ֜לֶךְ בְּגִח֗וֹן וַיַּעֲל֤וּ מִשָּׁם֙ שְׂמֵחִ֔ים וַתֵּהֹ֖ם הַקִּרְיָ֑ה ה֥וּא הַקּ֖וֹל אֲשֶׁ֥ר שְׁמַעְתֶּֽם׃'
];

const passage = document.querySelector('#passage');
const status = document.querySelector('#status');
const tropeToggle = document.querySelector('#trope-toggle');
const audioToggle = document.querySelector('#audio-toggle');
const dialog = document.querySelector('#recorder-dialog');
const phraseNode = document.querySelector('#recorder-phrase');
const recordButton = document.querySelector('#record-button');
const playButton = document.querySelector('#play-button');
const deleteButton = document.querySelector('#delete-recording-button');
const STORAGE_KEY = 'brady-haftorah-groups-kings-1-40-45-v1';
let groups = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let showTrope = true;
let audioEnabled = true;
let selectedGroup = null;
let recorder = null;
let recorderStream = null;
let chunks = [];
let activeAudio = null;

function wordsFor(verse) { return VERSES[verse - 40].split(/\s+/); }
function phraseFor(group) { return wordsFor(group.verse).slice(group.start, group.end + 1).join(' '); }
function saveGroups() { localStorage.setItem(STORAGE_KEY, JSON.stringify(groups)); }
function displayText(text) { return showTrope ? text : text.replace(/[\u0591-\u05AF]/g, ''); }
function groupAt(verse, word) { return groups.find(group => group.verse === verse && word >= group.start && word <= group.end); }

function render() {
  passage.replaceChildren();
  VERSES.forEach((text, offset) => {
    const verse = offset + 40;
    const row = document.createElement('div'); row.className = 'verse-row'; row.dir = 'rtl';
    const number = document.createElement('button'); number.className = 'verse-number'; number.type = 'button'; number.textContent = verse; number.dataset.verse = verse; number.setAttribute('aria-label', `Play verse ${verse} phrase recordings`);
    const line = document.createElement('span'); line.className = 'verse-line'; line.lang = 'he'; line.dataset.verse = verse;
    wordsFor(verse).forEach((word, index) => {
      const group = groupAt(verse, index);
      const span = document.createElement('span'); span.className = 'word'; span.dataset.word = index; span.textContent = displayText(word);
      if (group) { span.classList.add(`highlight-${group.color}`); span.dataset.groupId = group.id; }
      line.append(span);
      if (index < wordsFor(verse).length - 1) {
        const space = document.createElement('span'); space.className = 'word-space'; space.textContent = ' ';
        if (group && group.end > index) { space.classList.add(`highlight-${group.color}`); space.dataset.groupId = group.id; }
        line.append(space);
      }
    });
    row.append(number, line); passage.append(row);
  });
}

passage.addEventListener('mouseup', event => {
  const clicked = event.target.closest('[data-group-id]');
  const selection = window.getSelection();
  if ((!selection || selection.isCollapsed) && clicked) { openGroup(clicked.dataset.groupId); return; }
  if (!selection || selection.isCollapsed || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  const selected = [...passage.querySelectorAll('.word')].filter(word => { try { return range.intersectsNode(word); } catch { return false; } });
  if (!selected.length) return;
  const line = selected[0].closest('.verse-line');
  if (!selected.every(word => word.closest('.verse-line') === line)) { selection.removeAllRanges(); status.textContent = 'Select words from one verse at a time.'; return; }
  const verse = Number(line.dataset.verse);
  const indices = selected.map(word => Number(word.dataset.word));
  const start = Math.min(...indices), end = Math.max(...indices);
  const overlaps = groups.filter(group => group.verse === verse && group.start <= end && group.end >= start);
  if (overlaps.length) {
    groups = groups.filter(group => !overlaps.includes(group));
    Promise.all(overlaps.map(group => deleteRecording(group.id))).catch(() => {});
    status.textContent = `Cleared the selected phrase in verse ${verse}.`;
  } else {
    groups.push({ id: crypto.randomUUID(), verse, start, end, color: groups.length && groups.at(-1).color === 1 ? 2 : 1 });
    status.textContent = `Saved a phrase in verse ${verse}. Select it to record audio.`;
  }
  selection.removeAllRanges(); saveGroups(); render();
});

async function openGroup(id) {
  selectedGroup = groups.find(group => group.id === id);
  if (!selectedGroup) return;
  phraseNode.textContent = displayText(phraseFor(selectedGroup));
  const exists = await getRecording(id);
  playButton.disabled = !exists || !audioEnabled;
  deleteButton.disabled = !exists;
  dialog.showModal();
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('brady-haftorah-audio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('recordings');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
async function dbAction(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => { const tx = db.transaction('recordings', mode); const req = action(tx.objectStore('recordings')); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); tx.oncomplete = () => db.close(); });
}
const getRecording = id => dbAction('readonly', store => store.get(id));
const putRecording = (id, blob) => dbAction('readwrite', store => store.put(blob, id));
const deleteRecording = id => dbAction('readwrite', store => store.delete(id));

recordButton.addEventListener('click', async () => {
  if (recorder?.state === 'recording') { recorder.stop(); return; }
  try {
    recorderStream = await navigator.mediaDevices.getUserMedia({ audio:true }); chunks = [];
    recorder = new MediaRecorder(recorderStream);
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = async () => {
      recorderStream.getTracks().forEach(track => track.stop());
      await putRecording(selectedGroup.id, new Blob(chunks, { type:recorder.mimeType }));
      recordButton.classList.remove('recording'); recordButton.textContent = '● Record again'; playButton.disabled = !audioEnabled; deleteButton.disabled = false;
      status.textContent = `Recording saved for verse ${selectedGroup.verse}.`;
    };
    recorder.start(); recordButton.classList.add('recording'); recordButton.textContent = '■ Stop';
  } catch { status.textContent = 'Microphone permission is needed to record.'; }
});

async function playGroup(group, mark = true) {
  if (!audioEnabled) return false;
  const blob = await getRecording(group.id); if (!blob) return false;
  stopAudio();
  const url = URL.createObjectURL(blob); activeAudio = new Audio(url);
  if (mark) passage.querySelectorAll(`[data-group-id="${group.id}"]`).forEach(node => node.classList.add('audio-active'));
  await new Promise(resolve => { activeAudio.onended = resolve; activeAudio.onerror = resolve; activeAudio.play().catch(resolve); });
  URL.revokeObjectURL(url); passage.querySelectorAll('.audio-active').forEach(node => node.classList.remove('audio-active')); activeAudio = null; return true;
}
function stopAudio() { if (activeAudio) { activeAudio.pause(); activeAudio = null; } passage.querySelectorAll('.audio-active').forEach(node => node.classList.remove('audio-active')); }
playButton.addEventListener('click', () => selectedGroup && playGroup(selectedGroup));
deleteButton.addEventListener('click', async () => { if (!selectedGroup) return; await deleteRecording(selectedGroup.id); playButton.disabled = true; deleteButton.disabled = true; recordButton.textContent = '● Record'; status.textContent = 'Recording deleted.'; });

passage.addEventListener('click', async event => {
  const button = event.target.closest('.verse-number'); if (!button || !audioEnabled) return;
  const verse = Number(button.dataset.verse); const queue = groups.filter(group => group.verse === verse).sort((a,b) => a.start - b.start);
  if (!queue.length) { status.textContent = `Verse ${verse} has no phrase recordings yet.`; return; }
  button.classList.add('playing'); button.textContent = '■'; status.textContent = `Playing verse ${verse}.`;
  for (const group of queue) await playGroup(group);
  button.classList.remove('playing'); button.textContent = verse; status.textContent = `Verse ${verse} complete.`;
});

tropeToggle.addEventListener('click', () => { showTrope = !showTrope; tropeToggle.classList.toggle('active', showTrope); tropeToggle.setAttribute('aria-pressed', String(showTrope)); render(); if (selectedGroup) phraseNode.textContent = displayText(phraseFor(selectedGroup)); });
audioToggle.addEventListener('change', () => { audioEnabled = audioToggle.checked; if (!audioEnabled) stopAudio(); playButton.disabled = !audioEnabled; });
dialog.addEventListener('close', () => { if (recorder?.state === 'recording') recorder.stop(); selectedGroup = null; });
render();
