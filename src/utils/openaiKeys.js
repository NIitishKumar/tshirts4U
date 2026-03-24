export function openAiKey() {
  return (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_KEY?.trim() ||
    process.env.OPENAI_APIKEY?.trim()
  );
}
