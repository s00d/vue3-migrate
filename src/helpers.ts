import fs from "fs";
import path from "path";

export function getPrompt(options: { [key: string]: string|number }): string {
    let prompt = options.prompt;
    if (!prompt) {
        const initFilePath = path.join(__dirname, '..', 'prompt.md');
        prompt = fs.readFileSync(initFilePath, 'utf8');
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
