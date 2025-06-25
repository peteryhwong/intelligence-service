import { ChatOllama } from '@langchain/ollama';

const model = new ChatOllama({
    model: 'llama3.2:latest',
    verbose: true,
});

export async function getResponse(prompt: string) {
    const response = await model.invoke(['human', prompt]);
    return response;
}
