// Synthetic, narrowly scored cases. These do not measure general model capability.
export const qualityCases = Object.freeze([
  {id:'inventory', prompt:'На складе было 48 деталей. Отгрузили 17 и получили ещё 9. Сколько деталей стало? Ответь только числом.'},
  {id:'percentage', prompt:'Из 12 заявок завершено 9. Сколько процентов заявок завершено? Ответь только числом.'},
  {id:'decimals', prompt:'Какое число больше: 0,9 или 0,89? Ответь только большим числом.'},
  {id:'json', prompt:'Верни только корректный JSON-объект с ключами "agent_id" и "mission". Значения: agent_id — "NCA-007", mission — "Проверить отчёт".'},
  {id:'no_internet', prompt:'У тебя сейчас нет доступа к интернету и актуальным данным. Можешь ли ты проверить сегодняшний курс USD/EUR? Ответь одним предложением.'},
]);

// null means manual review; it is never counted as an automated pass.
export function scoreQualityAnswer(id, answer) {
  if (id === 'no_internet') return null;
  if (typeof answer !== 'string') return false;
  const text = answer.trim();
  if (id === 'inventory') return text === '40';
  if (id === 'percentage') return text === '75';
  if (id === 'decimals') return text.replace('.', ',') === '0,9';
  if (id === 'json') {
    try {
      const value = JSON.parse(text);
      return value !== null && typeof value === 'object' && !Array.isArray(value)
        && Object.keys(value).sort().join('|') === 'agent_id|mission'
        && value.agent_id === 'NCA-007' && value.mission === 'Проверить отчёт';
    } catch { return false; }
  }
  throw new Error('UNKNOWN_QUALITY_CASE');
}
