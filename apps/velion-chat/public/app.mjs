// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Local, single-browser conversation. No model output is executed.
import {renderAnswer} from './answer-renderer.mjs';
const translations = {
  'ru-RU': {
    sidebar: 'Панель разговоров',
    closeMenu: 'Закрыть меню',
    newChat: 'Новый разговор',
    recent: 'ВАШИ РАЗГОВОРЫ',
    chats: 'Разговоры',
    localSession: 'Локальная сессия',
    settings: 'Настройки',
    openMenu: 'Открыть меню',
    assistant: 'Ассистент',
    privateSession: 'ЛОКАЛЬНЫЙ РЕЖИМ',
    chat: 'Чат',
    greeting: 'Здравствуйте,\nАрхитектор.',
    intro: 'Я VELION. Чем займёмся сегодня?',
    planTitle: 'Создать план',
    planSub: 'Превратить идею в шаги ↗',
    ideasTitle: 'Обсудить идею',
    ideasSub: 'Посмотреть шире ↗',
    learnTitle: 'Узнать новое',
    learnSub: 'Разобраться в теме ↗',
    planPrompt: 'Помоги мне составить план: ',
    ideasPrompt: 'Давай обсудим идею: ',
    learnPrompt: 'Объясни мне, пожалуйста: ',
    conversation: 'Диалог',
    ready: 'Подключите локальную модель в настройках.',
    message: 'Сообщение',
    placeholder: 'Спросите VELION о чём угодно…',
    dictate: 'Диктовать',
    voice: 'Голос',
    finishDictation: 'Завершить диктовку',
    readAnswer: 'Озвучить ответ',
    listen: 'Слушать',
    stop: 'Остановить',
    send: 'Отправить',
    caption: 'VELION может ошибаться. Проверяйте важную информацию.',
    close: 'Закрыть',
    language: 'Язык',
    token: 'Ключ локальной сессии',
    tokenPlaceholder: 'Введите токен локального сервера',
    tokenHint: 'Ключ хранится только в этой вкладке. Ответ формирует отдельно подключённая локальная модель.',
    autoSpeak: 'Озвучивать ответы',
    saveHistory: 'Сохранять диалоги в этом браузере',
    historyHint:
      'Без сохранения диалоги исчезнут при закрытии страницы. Не включайте сохранение на общем устройстве.',
    voiceNotice:
      'Микрофон включается по нажатию. Голос зависит от браузера: он может передавать аудио своему сервису распознавания. Проверьте текст перед отправкой.',
    deleteChat: 'Удалить текущий разговор',
    untitled: 'Новый разговор',
    waiting: 'VELION готовит ответ…',
    listening: 'Микрофон включён. Продиктуйте сообщение.',
    dictated: 'Проверьте распознанный текст перед отправкой.',
    noVoice: 'Распознавание речи недоступно в этом браузере. Можно печатать.',
    voiceError: 'Не удалось распознать речь. Проверьте разрешение на микрофон.',
    noSpeech: 'Озвучивание недоступно в этом браузере.',
    noAnswer: 'Сначала получите ответ модели.',
    speechError: 'Не удалось озвучить ответ на этом устройстве.',
    cancelled: 'Запрос остановлен.',
    deleted: 'Разговор удалён.',
    enterToken: 'Укажите ключ локальной сессии в настройках.',
    notLocal: 'Откройте страницу через локальный адрес 127.0.0.1.',
    disabled: 'Локальный чат не включён на сервере.',
    auth: 'Ключ локальной сессии не принят.',
    busy: 'Модель обрабатывает другой запрос.',
    unavailable: 'Локальная модель недоступна. Проверьте сервер модели.',
    invalid: 'Запрос или ответ модели не прошёл проверку.',
    failed: 'Не удалось получить ответ. Проверьте локальный сервер.',
    storageError: 'Не удалось сохранить историю в браузере.',
    copy: 'Копировать',
    copied: 'Ответ скопирован.',
    copyError: 'Не удалось скопировать ответ.',
    read: 'Озвучить',
  },
  'en-US': {
    sidebar: 'Conversation sidebar',
    closeMenu: 'Close menu',
    newChat: 'New conversation',
    recent: 'YOUR CONVERSATIONS',
    chats: 'Conversations',
    localSession: 'Local session',
    settings: 'Settings',
    openMenu: 'Open menu',
    assistant: 'Assistant',
    privateSession: 'LOCAL MODE',
    chat: 'Chat',
    greeting: 'Hello,\nArchitect.',
    intro: 'I’m VELION. What shall we work on today?',
    planTitle: 'Create a plan',
    planSub: 'Turn an idea into steps ↗',
    ideasTitle: 'Explore an idea',
    ideasSub: 'Look at the bigger picture ↗',
    learnTitle: 'Learn something',
    learnSub: 'Understand a subject ↗',
    planPrompt: 'Help me make a plan: ',
    ideasPrompt: 'Let’s discuss an idea: ',
    learnPrompt: 'Please explain: ',
    conversation: 'Conversation',
    ready: 'Connect a local model in settings.',
    message: 'Message',
    placeholder: 'Ask VELION anything…',
    dictate: 'Dictate',
    voice: 'Voice',
    finishDictation: 'Finish dictation',
    readAnswer: 'Read response aloud',
    listen: 'Listen',
    stop: 'Stop',
    send: 'Send',
    caption: 'VELION can make mistakes. Check important information.',
    close: 'Close',
    language: 'Language',
    token: 'Local session token',
    tokenPlaceholder: 'Enter the local server token',
    tokenHint: 'The token stays in this tab. Responses come from a separately configured local model.',
    autoSpeak: 'Read answers aloud',
    saveHistory: 'Save conversations in this browser',
    historyHint:
      'Without saving, conversations disappear when the page closes. Avoid saving on shared devices.',
    voiceNotice:
      'The microphone starts only when selected. Voice features depend on the browser, which may send audio to its recognition service. Review the text before sending.',
    deleteChat: 'Delete current conversation',
    untitled: 'New conversation',
    waiting: 'VELION is preparing a response…',
    listening: 'Microphone is on. Speak your message.',
    dictated: 'Review the transcript before sending.',
    noVoice: 'Speech recognition is unavailable in this browser. You can type.',
    voiceError: 'Speech recognition failed. Check microphone permission.',
    noSpeech: 'Speech output is unavailable in this browser.',
    noAnswer: 'Get a model response first.',
    speechError: 'The response could not be spoken on this device.',
    cancelled: 'Request stopped.',
    deleted: 'Conversation deleted.',
    enterToken: 'Enter the local session token in settings.',
    notLocal: 'Open this page at the local 127.0.0.1 address.',
    disabled: 'Local chat is not enabled on the server.',
    auth: 'The local session token was not accepted.',
    busy: 'The model is handling another request.',
    unavailable: 'The local model is unavailable. Check the model server.',
    invalid: 'The request or model response failed validation.',
    failed: 'Could not get a response. Check the local server.',
    storageError: 'Could not save conversation history in this browser.',
    copy: 'Copy',
    copied: 'Response copied.',
    copyError: 'Could not copy the response.',
    read: 'Read aloud',
  },
  'uk-UA': {
    sidebar: 'Панель розмов',
    closeMenu: 'Закрити меню',
    newChat: 'Нова розмова',
    recent: 'ВАШІ РОЗМОВИ',
    chats: 'Розмови',
    localSession: 'Локальна сесія',
    settings: 'Налаштування',
    openMenu: 'Відкрити меню',
    assistant: 'Асистент',
    privateSession: 'ЛОКАЛЬНИЙ РЕЖИМ',
    chat: 'Чат',
    greeting: 'Вітаю,\nАрхітекторе.',
    intro: 'Я VELION. Чим займемося сьогодні?',
    planTitle: 'Створити план',
    planSub: 'Перетворити ідею на кроки ↗',
    ideasTitle: 'Обговорити ідею',
    ideasSub: 'Подивитися ширше ↗',
    learnTitle: 'Дізнатися нове',
    learnSub: 'Розібратися в темі ↗',
    planPrompt: 'Допоможи мені скласти план: ',
    ideasPrompt: 'Обговорімо ідею: ',
    learnPrompt: 'Поясни мені, будь ласка: ',
    conversation: 'Діалог',
    ready: 'Підключіть локальну модель у налаштуваннях.',
    message: 'Повідомлення',
    placeholder: 'Запитайте VELION про що завгодно…',
    dictate: 'Диктувати',
    voice: 'Голос',
    finishDictation: 'Завершити диктування',
    readAnswer: 'Озвучити відповідь',
    listen: 'Слухати',
    stop: 'Зупинити',
    send: 'Надіслати',
    caption: 'VELION може помилятися. Перевіряйте важливу інформацію.',
    close: 'Закрити',
    language: 'Мова',
    token: 'Ключ локальної сесії',
    tokenPlaceholder: 'Введіть токен локального сервера',
    tokenHint: 'Ключ зберігається лише в цій вкладці. Відповідь формує окремо підключена локальна модель.',
    autoSpeak: 'Озвучувати відповіді',
    saveHistory: 'Зберігати діалоги в цьому браузері',
    historyHint:
      'Без збереження діалоги зникнуть після закриття сторінки. Не вмикайте збереження на спільному пристрої.',
    voiceNotice:
      'Мікрофон вмикається після натискання. Голос залежить від браузера: він може надсилати аудіо своєму сервісу розпізнавання. Перевірте текст перед надсиланням.',
    deleteChat: 'Видалити поточну розмову',
    untitled: 'Нова розмова',
    waiting: 'VELION готує відповідь…',
    listening: 'Мікрофон увімкнено. Продиктуйте повідомлення.',
    dictated: 'Перевірте розпізнаний текст перед надсиланням.',
    noVoice: 'Розпізнавання мовлення недоступне в цьому браузері. Можна друкувати.',
    voiceError: 'Не вдалося розпізнати мовлення. Перевірте дозвіл на мікрофон.',
    noSpeech: 'Озвучування недоступне в цьому браузері.',
    noAnswer: 'Спочатку отримайте відповідь моделі.',
    speechError: 'Не вдалося озвучити відповідь на цьому пристрої.',
    cancelled: 'Запит зупинено.',
    deleted: 'Розмову видалено.',
    enterToken: 'Вкажіть ключ локальної сесії в налаштуваннях.',
    notLocal: 'Відкрийте сторінку за локальною адресою 127.0.0.1.',
    disabled: 'Локальний чат не увімкнено на сервері.',
    auth: 'Ключ локальної сесії не прийнято.',
    busy: 'Модель обробляє інший запит.',
    unavailable: 'Локальна модель недоступна. Перевірте сервер моделі.',
    invalid: 'Запит або відповідь моделі не пройшли перевірку.',
    failed: 'Не вдалося отримати відповідь. Перевірте локальний сервер.',
    storageError: 'Не вдалося зберегти історію в браузері.',
    copy: 'Копіювати',
    copied: 'Відповідь скопійовано.',
    copyError: 'Не вдалося скопіювати відповідь.',
    read: 'Озвучити',
  },
};
const $ = (q) => document.querySelector(q),
  language = $('#language'),
  token = $('#token'),
  prompt = $('#prompt'),
  status = $('#status');
const chatList = $('#chat-list'),
  messagesBox = $('#messages'),
  welcome = $('#welcome'),
  dialog = $('#settings-dialog');
const sidebar = $('#sidebar'),
  scrim = $('#sidebar-scrim'),
  menu = $('#open-sidebar'),
  app = document.querySelector('.app'),
  mobileLayout = window.matchMedia('(max-width: 760px)'),
  mic = $('#mic'),
  stop = $('#stop'),
  send = $('#send');
const saveHistory = $('#save-history'),
  autoSpeak = $('#auto-speak'),
  storageKey = 'velion-chat-history-v1';
const tr = (key) => translations[language.value][key] || translations['en-US'][key] || key;
Object.assign(translations['ru-RU'], {
  limitChats: 'Достигнут предел: 25 разговоров. Удалите ненужный разговор.',
  storageError: 'Не удалось сохранить историю; предыдущая версия может остаться в браузере.',
});
Object.assign(translations['en-US'], {
  limitChats: 'The limit of 25 conversations has been reached. Delete one to continue.',
  storageError: 'Could not save history; an earlier version may remain in the browser.',
});
Object.assign(translations['uk-UA'], {
  limitChats: 'Досягнуто межі: 25 розмов. Видаліть непотрібну розмову.',
  storageError: 'Не вдалося зберегти історію; попередня версія може залишитися в браузері.',
});
Object.assign(translations['ru-RU'], { limitMessages: 'Достигнут предел этого разговора. Начните новый.' });
Object.assign(translations['en-US'], {
  limitMessages: 'This conversation has reached its limit. Start a new one.',
});
Object.assign(translations['uk-UA'], { limitMessages: 'Досягнуто межі цієї розмови. Почніть нову.' });
Object.assign(translations['ru-RU'], { answered: 'Ответ получен от локальной модели.' });
Object.assign(translations['en-US'], { answered: 'Response received from the local model.' });
Object.assign(translations['uk-UA'], { answered: 'Відповідь отримано від локальної моделі.' });
Object.assign(translations['ru-RU'], {
  search: 'Поиск разговоров',
  noResults: 'Разговоры не найдены',
  tokenHint:
    'Ключ не сохраняется в браузере и отправляется только локальному серверу. Ответ формирует отдельно подключённая локальная модель.',
  historyHint:
    'Без сохранения диалоги исчезнут при обновлении или закрытии страницы. Выключение настройки удалит сохранённую копию. Не включайте её на общем устройстве.',
});
Object.assign(translations['en-US'], {
  search: 'Search conversations',
  noResults: 'No conversations found',
  tokenHint:
    'The token is not saved in the browser and is sent only to the local server. Responses come from a separately configured local model.',
  historyHint:
    'Without saving, conversations disappear on refresh or close. Turning this off removes the saved copy. Avoid saving on shared devices.',
});
Object.assign(translations['uk-UA'], {
  search: 'Пошук розмов',
  noResults: 'Розмов не знайдено',
  tokenHint:
    'Ключ не зберігається в браузері та надсилається лише локальному серверу. Відповідь формує окремо підключена локальна модель.',
  historyHint:
    'Без збереження діалоги зникнуть після оновлення або закриття сторінки. Вимкнення видалить збережену копію. Не вмикайте це на спільному пристрої.',
});
Object.assign(translations['ru-RU'], {
  confirmDelete: 'Удалить этот разговор? Восстановить его будет нельзя.',
});
Object.assign(translations['en-US'], { confirmDelete: 'Delete this conversation? It cannot be recovered.' });
Object.assign(translations['uk-UA'], { confirmDelete: 'Видалити цю розмову? Відновити її буде неможливо.' });
Object.assign(translations['ru-RU'], { code: 'Код', copyCode: 'Копировать код', codeCopied: 'Код скопирован.' });
Object.assign(translations['en-US'], { code: 'Code', copyCode: 'Copy code', codeCopied: 'Code copied.' });
Object.assign(translations['uk-UA'], { code: 'Код', copyCode: 'Копіювати код', codeCopied: 'Код скопійовано.' });
Object.assign(translations['ru-RU'], {
  failedMessage: 'Предыдущий запрос не выполнен. Ваш новый черновик сохранён в поле ниже.',
  failedMessageHint: 'Чтобы восстановить запрос, сначала очистите поле ввода. Или скопируйте его и закройте это сообщение.',
  restoreFailed: 'Восстановить запрос', copyFailed: 'Копировать запрос', dismissFailed: 'Закрыть',
  resolveFailed: 'Сначала восстановите предыдущий запрос или закройте сообщение.',
  failedCopied: 'Предыдущий запрос скопирован.',
});
Object.assign(translations['en-US'], {
  failedMessage: 'The previous request did not finish. Your new draft remains in the field below.',
  failedMessageHint: 'Clear the input to restore the request, or copy it and dismiss this message.',
  restoreFailed: 'Restore request', copyFailed: 'Copy request', dismissFailed: 'Dismiss',
  resolveFailed: 'Restore the previous request or dismiss its message first.',
  failedCopied: 'Previous request copied.',
});
Object.assign(translations['uk-UA'], {
  failedMessage: 'Попередній запит не виконано. Ваша нова чернетка залишилася в полі нижче.',
  failedMessageHint: 'Щоб відновити запит, спочатку очистьте поле введення. Або скопіюйте його і закрийте це повідомлення.',
  restoreFailed: 'Відновити запит', copyFailed: 'Копіювати запит', dismissFailed: 'Закрити',
  resolveFailed: 'Спочатку відновіть попередній запит або закрийте повідомлення.',
  failedCopied: 'Попередній запит скопійовано.',
});
const setStatus = (key) => {
  status.textContent = tr(key);
};
const freshChat = () => ({ id: crypto.randomUUID(), title: '', messages: [] });
// A failed request and a subsequently typed draft must never overwrite each other.
// Recoveries are deliberately kept only in this page's memory.
const failedRequests = new Map();
let chats = [freshChat()],
  current = chats[0].id,
  controller = null,
  recognition = null,
  listening = false;
const selected = () => chats.find((chat) => chat.id === current);
function save() {
  if (!saveHistory.checked) return true;
  // A request in progress has an unmatched user message; never persist a partial exchange.
  const completed = chats.map((chat) => ({
    ...chat,
    messages: chat.messages.length % 2 ? chat.messages.slice(0, -1) : chat.messages,
  }));
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, chats: completed, current }));
    return true;
  } catch {
    saveHistory.checked = false;
    setStatus('storageError');
    return false;
  }
}
function restore() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw || raw.length > 1500000) return;
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.chats) || !data.chats.length || data.chats.length > 25)
      return;
    for (const chat of data.chats) {
      if (
        typeof chat.id !== 'string' ||
        typeof chat.title !== 'string' ||
        !Array.isArray(chat.messages) ||
        chat.messages.length > 50
      )
        return;
      if (
        chat.messages.some(
          (m, i) =>
            !m ||
            m.role !== (i % 2 ? 'assistant' : 'user') ||
            typeof m.content !== 'string' ||
            m.content.length > 4000,
        )
      )
        return;
      if (chat.messages.length % 2) return;
    }
    chats = data.chats;
    current = chats.some((chat) => chat.id === data.current) ? data.current : chats[0].id;
    saveHistory.checked = true;
  } catch {}
}
function localEndpoint() {
  try {
    const url = new URL(location.href);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password)
      return null;
    return new URL('/api/chat', url.origin).href;
  } catch {
    return null;
  }
}
function translate() {
  document.documentElement.lang = language.value.split('-')[0];
  for (const node of document.querySelectorAll('[data-i18n]')) {
    if (node.dataset.i18n === 'greeting') {
      const parts = tr('greeting').split('\n');
      node.replaceChildren(document.createTextNode(parts[0]), document.createElement('br'));
      const em = document.createElement('em');
      em.textContent = parts[1];
      node.append(em);
    } else node.textContent = tr(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll('[data-i18n-placeholder]'))
    node.placeholder = tr(node.dataset.i18nPlaceholder);
  for (const node of document.querySelectorAll('[data-i18n-aria]'))
    node.setAttribute('aria-label', tr(node.dataset.i18nAria));
  for (const node of document.querySelectorAll('[data-i18n-title]')) node.title = tr(node.dataset.i18nTitle);
  updateMic();
  updateMenuLabel();
  renderList();
  renderMessages();
}
function renderList() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  const found = chats.filter(
    (chat) =>
      !query ||
      (chat.title + ' ' + chat.messages.map((m) => m.content).join(' ')).toLocaleLowerCase().includes(query),
  );
  chatList.replaceChildren();
  if (!found.length) {
    const hint = document.createElement('p');
    hint.className = 'empty-search';
    hint.textContent = tr('noResults');
    chatList.append(hint);
  }
  for (const chat of found) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-item' + (chat.id === current ? ' active' : '');
    button.textContent = chat.title || tr('untitled');
    button.title = button.textContent;
    button.setAttribute('aria-current', chat.id === current ? 'page' : 'false');
    button.addEventListener('click', () => {
      if (controller) return;
      current = chat.id;
      render();
      closeSidebar();
    });
    chatList.append(button);
  }
}
function speakText(text) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    setStatus('noSpeech');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language.value;
  utterance.onerror = (event) => {
    if (!['canceled', 'interrupted'].includes(event.error)) setStatus('speechError');
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
function renderMessages() {
  const chat = selected();
  welcome.hidden = chat.messages.length > 0;
  messagesBox.replaceChildren();
  for (const item of chat.messages) {
    const row = document.createElement('div');
    row.className = 'message ' + item.role;
    if (item.role === 'assistant') {
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.textContent = 'V';
      avatar.setAttribute('aria-hidden', 'true');
      row.append(avatar);
      const body = document.createElement('div');
      body.className = 'answer-body';
      const content = document.createElement('div');
      renderAnswer(content, item.content, {
        codeLabel: tr('code'), copyLabel: tr('copyCode'),
        copyCode: async (code) => {
          try { await navigator.clipboard.writeText(code); setStatus('codeCopied'); }
          catch { setStatus('copyError'); }
        },
      });
      body.append(content);
      const actions = document.createElement('div');
      actions.className = 'message-actions';
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = tr('copy');
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(item.content);
          setStatus('copied');
        } catch {
          setStatus('copyError');
        }
      });
      const read = document.createElement('button');
      read.type = 'button';
      read.textContent = tr('read');
      read.addEventListener('click', () => speakText(item.content));
      actions.append(copy, read);
      body.append(actions);
      row.append(body);
    } else row.textContent = item.content;
    messagesBox.append(row);
  }
  renderFailedRequest();
}
function renderFailedRequest() {
  const failed = failedRequests.get(current);
  $('#failed-message').hidden = failed === undefined;
  $('#failed-message-text').textContent = failed ?? '';
  $('#restore-failed').disabled = failed === undefined || prompt.value.length > 0;
}
prompt.addEventListener('input', renderFailedRequest);
$('#restore-failed').addEventListener('click', () => {
  const failed = failedRequests.get(current);
  if (failed === undefined || prompt.value.length) return;
  prompt.value = failed;
  failedRequests.delete(current);
  renderFailedRequest();
  prompt.focus();
});
$('#copy-failed').addEventListener('click', async () => {
  const failed = failedRequests.get(current);
  if (failed === undefined) return;
  try { await navigator.clipboard.writeText(failed); setStatus('failedCopied'); }
  catch { setStatus('copyError'); }
});
$('#dismiss-failed').addEventListener('click', () => {
  failedRequests.delete(current);
  renderFailedRequest();
  prompt.focus();
});
function render() {
  renderList();
  renderMessages();
  return save();
}
function updateMenuLabel() {
  const isOpen = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-label', tr(isOpen ? 'closeMenu' : 'openMenu'));
  menu.title = tr(isOpen ? 'closeMenu' : 'openMenu');
}
function setSidebar(open) {
  sidebar.classList.toggle('open', mobileLayout.matches && open);
  app.classList.toggle('sidebar-collapsed', !mobileLayout.matches && !open);
  sidebar.inert = !open;
  scrim.hidden = !mobileLayout.matches || !open;
  menu.setAttribute('aria-expanded', String(open));
  updateMenuLabel();
}
function closeSidebar() {
  if (!mobileLayout.matches || !sidebar.classList.contains('open')) return;
  const hadFocus = sidebar.contains(document.activeElement);
  setSidebar(false);
  if (hadFocus) menu.focus();
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  setSidebar(open);
  if (open && mobileLayout.matches) $('#close-sidebar').focus();
});
mobileLayout.addEventListener('change', () => setSidebar(!mobileLayout.matches));
$('#close-sidebar').addEventListener('click', closeSidebar);
scrim.addEventListener('click', closeSidebar);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSidebar();
});
for (const id of ['#open-settings', '#settings-top'])
  $(id).addEventListener('click', () => {
    closeSidebar();
    dialog.showModal();
  });
$('#close-settings').addEventListener('click', () => dialog.close());
$('#new-chat').addEventListener('click', () => {
  if (controller) return;
  if (chats.length >= 25) {
    setStatus('limitChats');
    return;
  }
  const chat = freshChat();
  chats.unshift(chat);
  current = chat.id;
  prompt.value = '';
  $('#search').value = '';
  const saved = render();
  closeSidebar();
  if (saved) setStatus('ready');
  prompt.focus();
});
$('#delete-chat').addEventListener('click', () => {
  if (controller || !window.confirm(tr('confirmDelete'))) return;
  failedRequests.delete(current);
  chats = chats.filter((chat) => chat.id !== current);
  if (!chats.length) chats = [freshChat()];
  current = chats[0].id;
  prompt.value = '';
  const saved = render();
  dialog.close();
  if (saved) setStatus('deleted');
});
language.addEventListener('change', () => {
  translate();
  setStatus('ready');
});
$('#search').addEventListener('input', renderList);
saveHistory.addEventListener('change', () => {
  if (saveHistory.checked) save();
  else
    try {
      localStorage.removeItem(storageKey);
    } catch {
      setStatus('storageError');
    }
});
for (const button of document.querySelectorAll('[data-suggestion]'))
  button.addEventListener('click', () => {
    prompt.value = tr(button.dataset.suggestion + 'Prompt');
    renderFailedRequest();
    prompt.focus();
  });
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
function updateMic() {
  mic.disabled = !Recognition;
  mic.setAttribute('aria-label', tr(listening ? 'finishDictation' : 'dictate'));
  mic.title = tr(!Recognition ? 'noVoice' : listening ? 'finishDictation' : 'dictate');
  const span = mic.querySelector('span');
  if (span) span.textContent = tr(listening ? 'finishDictation' : 'voice');
}
mic.addEventListener('click', () => {
  if (!Recognition) {
    setStatus('noVoice');
    return;
  }
  if (listening) {
    recognition.stop();
    return;
  }
  recognition = new Recognition();
  recognition.lang = language.value;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onstart = () => {
    listening = true;
    updateMic();
    setStatus('listening');
  };
  recognition.onresult = (event) => {
    const text = Array.from(event.results)
      .filter((result) => result.isFinal)
      .map((result) => result[0].transcript)
      .join(' ')
      .trim();
    if (text) {
      prompt.value = (prompt.value.trim() + ' ' + text).trim().slice(0, 4000);
      renderFailedRequest();
      setStatus('dictated');
      prompt.focus();
    }
  };
  recognition.onerror = (event) => {
    if (event.error !== 'aborted') setStatus('voiceError');
  };
  recognition.onend = () => {
    listening = false;
    updateMic();
  };
  try {
    recognition.start();
  } catch {
    setStatus('voiceError');
  }
});
$('#speak').addEventListener('click', () => {
  const message = [...selected().messages].reverse().find((item) => item.role === 'assistant');
  if (!message) {
    setStatus('noAnswer');
    return;
  }
  speakText(message.content);
});
stop.addEventListener('click', () => {
  controller?.abort();
  if (listening) recognition.stop();
  window.speechSynthesis?.cancel();
  setStatus('cancelled');
});
prompt.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    $('#chat-form').requestSubmit();
  }
});
$('#chat-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (controller) return;
  if (failedRequests.has(current)) {
    setStatus('resolveFailed');
    return;
  }
  const endpoint = localEndpoint(),
    value = prompt.value.trim();
  if (!endpoint) {
    setStatus('notLocal');
    return;
  }
  if (!token.value) {
    setStatus('enterToken');
    dialog.showModal();
    token.focus();
    return;
  }
  if (!value) return;
  if (selected().messages.length >= 50) {
    setStatus('limitMessages');
    return;
  }
  if (listening) recognition.stop();
  const chat = selected();
  chat.messages.push({ role: 'user', content: value });
  renderMessages();
  prompt.value = '';
  const requestMessages = chat.messages.slice(-11);
  const bytes = () => requestMessages.reduce((n, m) => n + new TextEncoder().encode(m.content).length, 0);
  while (
    requestMessages.length > 1 &&
    (bytes() > 24000 ||
      new TextEncoder().encode(JSON.stringify({ messages: requestMessages })).length > 32000)
  )
    requestMessages.splice(0, 2);
  send.disabled = true;
  stop.disabled = false;
  setStatus('waiting');
  controller = new AbortController();
  const active = controller;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      mode: 'same-origin',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.any([active.signal, AbortSignal.timeout(115000)]),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token.value },
      body: JSON.stringify({ messages: requestMessages }),
    });
    const data = await response.json();
    if (!response.ok) {
      const errors = {
        CHAT_DISABLED: 'disabled',
        LOCAL_ACCESS_TOKEN_REQUIRED: 'auth',
        CHAT_BUSY: 'busy',
        CHAT_MODEL_UNAVAILABLE: 'unavailable',
        CHAT_MODEL_HTTP_FAILED: 'unavailable',
        CHAT_INVALID_MESSAGES: 'invalid',
        CHAT_MODEL_RESPONSE_INVALID: 'invalid',
        CHAT_MODEL_RESPONSE_TOO_LARGE: 'invalid',
      };
      throw Object.assign(Error('Request failed'), { display: errors[data.code] || 'failed' });
    }
    if (
      typeof data.answer !== 'string' ||
      !data.answer.trim() ||
      data.answer.length > 4000 ||
      !['ollama-local', 'llama-cpp-local'].includes(data.receipt?.provider) ||
      data.receipt?.toolAccess !== 'NONE'
    )
      throw Error('Invalid response');
    chat.messages.push({ role: 'assistant', content: data.answer });
    if (!chat.title) chat.title = value.slice(0, 48);
    const saved = render();
    if (saved) setStatus('answered');
    messagesBox.lastElementChild?.scrollIntoView({ block: 'nearest' });
    if (autoSpeak.checked) speakText(data.answer);
  } catch (cause) {
    chat.messages.pop();
    if (prompt.value.length) failedRequests.set(chat.id, value);
    else prompt.value = value;
    renderMessages();
    setStatus(active.signal.aborted ? 'cancelled' : cause.display || 'failed');
  } finally {
    controller = null;
    send.disabled = false;
    stop.disabled = true;
  }
});
window.addEventListener('pagehide', () => {
  controller?.abort();
  if (listening) recognition?.abort();
  window.speechSynthesis?.cancel();
  token.value = '';
});
restore();
setSidebar(!mobileLayout.matches);
translate();
setStatus('ready');
