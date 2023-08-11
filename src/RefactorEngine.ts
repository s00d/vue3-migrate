import glob from "glob";
import {getTimestamp, wait} from "./helpers";
import fs from "fs";
import {Configuration, OpenAIApi} from "openai";
import Table from "cli-table3";
import type {MultiBar} from "cli-progress";
import * as ProgressBar from 'cli-progress';
import chalk from "chalk";

const RE_SCRIPT = /(<script lang="ts">.*<\/script>)/s;

const print_error = function(...msg: any) {
    console.error('\n', chalk.red(getTimestamp()), ...msg);
};

const print_info = function(...msg: any) {
    console.info('\n', chalk.blue(getTimestamp()), ...msg);
};

export class RefactorEngine {
    private bar: MultiBar;
    private metrics: { file: string, old_length: number, new_length: number, time: number, token_count: number }[];
    private model: string;
    private token: string;
    private prompt: string;
    private timeout: number;
    private max_tokens: number;
    private replace: boolean;

    constructor(model: string, token: string, prompt: string, timeout = 20000, max_tokens = 4096, replace = false) {
        this.model = model;
        this.token = token;
        this.prompt = prompt;
        this.timeout = timeout;
        this.max_tokens = max_tokens;
        this.replace = replace;
        this.bar = new ProgressBar.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            format: ' {bar} | {filename} | {value}/{total}',
        }, ProgressBar.Presets.shades_grey);

        this.metrics = [];
    }

    async refactorFilesInDirectory(directory: string): Promise<void> {
        const files = glob.sync(`${directory}/**/*.vue`);
        const bar = this.bar.create(files.length, 0);


        for (const file of files) {
            try {
                bar.increment({filename: file});
                await this.refactor(file);
            } catch (error) {
                print_error(`An error occurred while refactoring file: ${file}`, error);
            }
            await wait(this.timeout); // Ожидание перед отправкой следующего запроса
        }
        this.bar.stop()
    }

    async refactorFile(filename: string): Promise<void> {
        await this.refactor(filename);
        this.bar.stop()
    }

    countTokens(text: string) {
        // Split the text into words and punctuation marks
        const tokens = text.split(/[\s,.;:!?()]+/);

        // Count the number of non-empty tokens
        return tokens.reduce((count, token) => token.length > 0 ? count + 1 : count, 0);
    }

    async refactor(filename: string): Promise<void> {
        print_info(`Converting file: ${filename}`);

        const newFilename = filename.replace('.vue', '_refactored.vue');

        // Check if the file already exists
        if (!this.replace && fs.existsSync(newFilename)) {
            print_error(`File ${newFilename} already exists. Skipping...`);
            return;
        }

        const start = Date.now();
        const content = fs.readFileSync(filename, 'utf8');

        // Extract the script tag from <script lang="ts"> to </script>
        const match = content.match(RE_SCRIPT);
        if (!match) {
            print_error('ERR: No script tag found');
            process.exit(1);
        }
        const [scriptTag] = match;
        const spanstart = match.index;
        if (spanstart === undefined) {
            print_error('ERR: Unable to determine script tag index');
            process.exit(1);
        }
        const spanend = spanstart + scriptTag.length;

        const old_len = scriptTag.length;


        const token_count = this.countTokens(scriptTag);
        const estimatedTime = parseInt((token_count * 0.1).toString(), 10);
        const progressBar = this.bar.create(estimatedTime, 0, {filename});

        const intervalId = setInterval(() => {
            progressBar.increment();
        }, 1000);

        // Ask for refactoring
        const configuration = new Configuration({
            apiKey: this.token,
        });

        const openaiInstance = new OpenAIApi(configuration);
        const response = await openaiInstance.createChatCompletion({
            model: this.model,
            max_tokens: this.max_tokens,
            messages: [
                { role: 'system', content: this.prompt },
                { role: 'user', content: scriptTag },
            ],
        });

        clearInterval(intervalId);
        progressBar.stop();

        // Get the refactored script
        let refactoredContent = content.slice(0, spanstart);
        let length = 0;
        for (const choice of response.data.choices) {
            if (choice.finish_reason !== 'stop') break;

            const message = choice.message?.content;
            if (message) {
                refactoredContent += message;
                length += message.length;
            }
        }
        refactoredContent += content.slice(spanend);

        // Save the refactored content to a new file
        fs.writeFileSync(newFilename, refactoredContent, 'utf8');

        print_info(`Refactored code saved to ${newFilename}`);

        const time = Date.now() - start;
        this.metrics.push({ file: filename, old_length: old_len, new_length: length, time, token_count });
    }

    printMetrics(): void {
        const table = new Table({
            head: ['File', 'Old Length', 'New Length', 'Time (ms)', 'Token Count'],
            colWidths: [100, 10, 10, 20, 20]
        });

        for (const metric of this.metrics) {
            table.push([metric.file, metric.old_length, metric.new_length, `${metric.time}ms`, metric.token_count]);
        }

        console.log(table.toString());
    }
}
