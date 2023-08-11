import fs from "fs";
import path from "path";
import { stdout } from 'process';

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
    return new Promise((resolve) => {
        let timeElapsed = 0;
        const intervalId = setInterval(() => {
            timeElapsed += 1000;
            stdout.clearLine(0);
            stdout.cursorTo(0);
            stdout.write(`Time elapsed: ${timeElapsed / 1000} seconds`);
            if (timeElapsed >= ms) {
                clearInterval(intervalId);
                resolve();
            }
        }, 1000);
    });
}

export function getTimestamp() {
    const date = new Date();
    return `[${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}]`;

}
