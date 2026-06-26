import {ChatOpenAI} from "@langchain/openai";

const openai = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-3.5-turbo",
});

async function getOpenAIResponse(prompt) {
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  try {
    const response = await openai.invoke(prompt);
    console.log("OpenAI response:", response);
    return response;
  } catch (error) {
    console.error("Error while calling OpenAI API:", error);
    throw new Error(`OpenAI request failed: ${error?.message || error}`);
  }
}

export { getOpenAIResponse };