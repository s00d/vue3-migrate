import fs from "fs";
import REFACTOR_PROMPT from "./promt";

export function getPrompt(options: { [key: string]: string|number }): string {
    let prompt = options.prompt;
    if (!prompt) {
        prompt = REFACTOR_PROMPT;
    } else {
        prompt = fs.readFileSync(prompt, 'utf8');
    }
    return prompt.toString();
}

export function getToken(options: { [key: string]: string|number }): string {
    const token = options.token;
    if (!token) {
        console.log('ERR: No token specified, use --token=sk-...');
        process.exit(1);
    }
    return token.toString()
}

export function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
