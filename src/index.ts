import { Command } from 'commander';
import {getPrompt, getToken, wait} from "./helpers";
import {RefactorEngine} from "./RefactorEngine";

const { version } = require('../package.json')

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
            .option('-r, --replace', 'replace, if exist')
            .action(async (directory, options) => {
                const model = options.model;
                const token = getToken(options);
                const prompt = getPrompt(options);
                const timeout = options.timeout || 20000;
                const max_tokens = options.max_tokens || 4096;
                const replace = !!options.replace;

                const engine = new RefactorEngine(model, token, prompt, timeout, max_tokens, replace);
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
            .option('-r, --replace', 'replace, if exist')
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
                const replace = !!options.replace;

                const engine = new RefactorEngine(model, token, prompt, timeout, max_tokens, replace);
                await engine.refactorFile(filename);

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
