import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
});

async function googleaiSearch(query) {
	try {
		const interaction = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: query,
		});
		return interaction;

	} catch (err) {
		console.error('Google AI interaction failed:', err);
		throw err;
	}
}

export default googleaiSearch;