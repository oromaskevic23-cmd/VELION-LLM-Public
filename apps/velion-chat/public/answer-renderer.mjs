// Render model output as text and fenced code only. Never interpret HTML or execute code.
export function renderAnswer(container, text, {codeLabel, copyLabel, copyCode} = {}) {
  if (typeof text !== 'string' || typeof copyCode !== 'function') throw TypeError('INVALID_ANSWER_RENDER_INPUT');
  const doc = container.ownerDocument;
  const lines = text.split('\n');
  let plainStart = 0;
  const appendPlain = end => {
    const part = lines.slice(plainStart, end).join('\n');
    if (!part) return;
    const block = doc.createElement('div');
    block.className = 'answer-text';
    block.textContent = part;
    container.append(block);
  };
  for (let i = 0; i < lines.length; i++) {
    const opening = /^ {0,3}```([A-Za-z0-9_+.-]{0,32})[ \t]*\r?$/.exec(lines[i]);
    if (!opening) continue;
    let end = i + 1;
    while (end < lines.length && !/^ {0,3}```[ \t]*\r?$/.test(lines[end])) end++;
    if (end === lines.length) break; // An incomplete fence remains ordinary text.
    appendPlain(i);
    const code = lines.slice(i + 1, end).join('\n');
    const wrapper = doc.createElement('section');
    wrapper.className = 'answer-code';
    const header = doc.createElement('div');
    header.className = 'answer-code-header';
    const title = doc.createElement('span');
    title.textContent = opening[1] || codeLabel;
    const button = doc.createElement('button');
    button.type = 'button';
    button.textContent = copyLabel;
    button.setAttribute('aria-label', copyLabel);
    button.addEventListener('click', () => copyCode(code));
    header.append(title, button);
    const pre = doc.createElement('pre');
    const body = doc.createElement('code');
    body.textContent = code;
    pre.append(body);
    wrapper.append(header, pre);
    container.append(wrapper);
    i = end;
    plainStart = end + 1;
  }
  appendPlain(lines.length);
}
