// Scoring only; this module does not contact a model or execute model output.
export function scoreGgufSmoke(answers) {
  if (!Array.isArray(answers) || answers.length !== 3 || answers.some(a => typeof a !== 'string'))
    throw Error('THREE_MODEL_ANSWERS_REQUIRED');
  return [
    {id:'identity', passed:/velion/i.test(answers[0])},
    {id:'conversation-context', passed:/ирина/i.test(answers[1])},
    {id:'basic-arithmetic', passed:/^\s*(4|четыре)[.!]?\s*$/iu.test(answers[2])},
  ];
}
