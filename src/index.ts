import fs from 'fs';
import { Configuration, OpenAIApi } from 'openai';
import { Command } from 'commander';
import glob from 'glob';
import ProgressBar from 'progress';
import Table from 'cli-table3';
import {getPrompt, getToken, wait} from "./helpers";

const { version } = require('../package.json')

const RE_SCRIPT = /(<script lang="ts">.*<\/script>)/s;

class RefactorEngine {
    private bar: ProgressBar;
    private metrics: { file: string, old_length: number, new_length: number, time: number }[];
    private model: string;
    private token: string;
    private prompt: string;
    private timeout: number;
    private max_tokens: number;

    constructor(model: string, token: string, prompt: string, timeout = 20000, max_tokens = 4096) {
        this.model = model;
        this.token = token;
        this.prompt = prompt;
        this.timeout = timeout;
        this.max_tokens = max_tokens;
        this.bar = new ProgressBar(':bar :percent :etas', { total: 100 });
        this.metrics = [];
    }

    async refactorFilesInDirectory(directory: string): Promise<void> {
        const files = glob.sync(`${directory}/**/*.vue`);
        this.bar.total = files.length;

        for (const file of files) {
            console.log(`converting file: ${file}`);
            try {
                await this.refactor(file);
            } catch (error) {
                console.error(`An error occurred while refactoring file: ${file}`);
                console.error(error);
            }
            this.bar.tick();
            await wait(this.timeout); // Ожидание перед отправкой следующего запроса
        }
    }

    async refactor(filename: string): Promise<void> {
        const newFilename = filename.replace('.vue', '_refactored.vue');

        // Check if the file already exists
        if (fs.existsSync(newFilename)) {
            console.log(`File ${newFilename} already exists. Skipping...`);
            return;
        }

        const start = Date.now();
        const content = fs.readFileSync(filename, 'utf8');

        // Extract the script tag from <script lang="ts"> to </script>
        const match = content.match(RE_SCRIPT);
        if (!match) {
            console.log('ERR: No script tag found');
            process.exit(1);
        }
        const [scriptTag] = match;
        const spanstart = match.index;
        if (spanstart === undefined) {
            console.log('ERR: Unable to determine script tag index');
            process.exit(1);
        }
        const spanend = spanstart + scriptTag.length;

        const old_len = scriptTag.length;

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

        console.log(`Refactored code saved to ${newFilename}`);


        const time = Date.now() - start;
        this.metrics.push({ file: filename, old_length: old_len, new_length: length, time });
    }

    printMetrics(): void {
        const table = new Table({
            head: ['File', 'Old Length', 'New Length', 'Time (ms)'],
            colWidths: [100, 10, 10, 20]
        });


        for (const metric of this.metrics) {
            table.push([metric.file, metric.old_length, metric.new_length, `${metric.time}ms`]);
        }

        console.log(table.toString());
    }
}

class ProgramRunner {
    private program: Command;

    constructor() {
        this.program = new Command();
        this.program
            .name('vue3-migrate')
            .description('CLI utilizes ChatGPT to automatically refactor Vue.js code from version 2 to version 3')
            .version(version);
    }

    run(): void {
        this.program
            .command('directory')
            .arguments('<directory>')
            .description('Refactor all Vue files in a directory')
            .option('-m, --model <model>', 'Specify the GPT model', 'gpt-3.5-turbo-16k')
            .option('-t, --token <token>', 'Specify the GPT token', '')
            .option('-p, --prompt <prompt>', 'Start prompt path', '')
            .option('-t, --timeout <timeout>', 'Specify the timeout in milliseconds (default: 20000)', parseInt)
            .option('-mt, --max_tokens <max_tokens>', 'GPT max tokens (default: 4096)', parseInt)
            .action(async (directory, options) => {
                const model = options.model;
                const token = getToken(options);
                const prompt = getPrompt(options);
                const timeout = options.timeout || 20000;
                const max_tokens = options.max_tokens || 4096;

                const engine = new RefactorEngine(model, token, prompt, timeout, max_tokens);
                await engine.refactorFilesInDirectory(directory);

                engine.printMetrics();
            });

        this.program
            .command('convert')
            .arguments('<filename>')
            .description('Refactor Vue file in a directory')
            .option('-m, --model <model>', 'Specify the GPT model', 'gpt-3.5-turbo-16k')
            .option('-t, --token <token>', 'Specify the GPT token', '')
            .option('-p, --prompt <prompt>', 'Start prompt path', '')
            .option('-mt, --max_tokens <max_tokens>', 'GPT max tokens (default: 4096)', parseInt)
            .action(async (filename, options) => {
                if (!filename) {
                    console.log('ERR: No file specified');
                    process.exit(1);
                }
                const model = options.model;
                const token = getToken(options);
                const prompt = getPrompt(options);
                const timeout = options.timeout || 20000;
                const max_tokens = options.max_tokens || 4096;

                const engine = new RefactorEngine(model, token, prompt, timeout, max_tokens);
                await engine.refactor(filename);

                engine.printMetrics();
            });

        this.program.parse(process.argv);
    }
}

export default ProgramRunner;

// Run the main function if the file is executed directly
if (require.main === module) {
    new ProgramRunner().run();
}
