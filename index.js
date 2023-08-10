// Refactoring tool using ChatGPT from Vue 2 to Vue 3
// $ node ./index.js MyView.vue

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
const { program } = require('commander');
const {join} = require("path");
// const { HttpsProxyAgent } = require("https-proxy-agent");
const glob = require('glob');
const { version } = require('./package.json');

const RE_SCRIPT = /(<script lang="ts">.*<\/script>)/s;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function refactorFilesInDirectory(directory, model, token, prompt, timeout = 20000, max_tokens = 4096) {
    const files = glob.sync(`${directory}/**/*.vue`);

    for (const file of files) {
        console.log(`converting file: ${file}`);
        try {
            await refactor(file, model, token, prompt, max_tokens);
        } catch (error) {
            console.error(`An error occurred while refactoring file: ${file}`);
            console.error(error);
        }
        await wait(timeout); // Ожидание перед отправкой следующего запроса
    }
}


async function refactor(filename, model, token, prompt, max_tokens = 4096) {
    const content = fs.readFileSync(filename, 'utf8');

    // Extract the script tag from <script lang="ts"> to </script>
    const match = content.match(RE_SCRIPT);
    if (!match) {
        console.log('ERR: No script tag found');
        process.exit(1);
    }
    const [scriptTag] = match;
    const spanstart = match.index;
    const spanend = spanstart + scriptTag.length;

    // Ask for refactoring
    // const agent = new HttpsProxyAgent('http://127.0.0.1:4034');
    const configuration = new Configuration({
        apiKey: token,
    });

    const openaiInstance = new OpenAIApi(configuration);
    const response = await openaiInstance.createChatCompletion({
        model,
        max_tokens,
        messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: scriptTag },
        ],
    },
        // {
        //     proxy: false,
        //     httpAgent: agent,
        //     httpsAgent: agent
        // }
    );

    // Get the refactored script
    let refactoredContent = content.slice(0, spanstart);
    for (const choice of response.data.choices) {
        if (choice.finish_reason !== 'stop') break;

        const message = choice.message?.content;
        if (message) {
            refactoredContent += message;
        }
    }
    refactoredContent += content.slice(spanend);

    // Save the refactored content to a new file
    const newFilename = filename.replace('.vue', '_refactored.vue');
    fs.writeFileSync(newFilename, refactoredContent, 'utf8');

    console.log(`Refactored code saved to ${newFilename}`);
}


// const REFACTOR_PROMPT = fs.readFileSync('init.md', 'utf8');

async function main() {
    program
        .name('vue3-migrate')
        .description('CLI utilizes ChatGPT to automatically refactor Vue.js code from version 2 to version 3')
        .version(version);

    function getPrompt(options) {
        let prompt = options.prompt;
        if (!prompt) {
            const initFilePath = join(__dirname, 'init.md');
            prompt = fs.readFileSync(initFilePath, 'utf8');
        } else {
            prompt = fs.readFileSync(prompt, 'utf8');
        }
        return prompt;
    }

    program
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
            const token = options.token;
            if (!token) {
                console.log('ERR: No token specified, use --token=sk-...');
                process.exit(1);
            }
            const prompt = getPrompt(options);
            const timeout = options.timeout || 20000;
            const max_tokens = options.max_tokens || 4096;

            await refactorFilesInDirectory(directory, model, token, prompt, timeout, max_tokens);
        });

    program
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
            const token = options.token;
            if (!token) {
                console.log('ERR: No token specified, use --token=sk-...');
                process.exit(1);
            }
            const prompt = getPrompt(options);
            const max_tokens = options.max_tokens || 4096;

            await refactor(filename, model, token, prompt, max_tokens);
        });

    program.parse(process.argv);
}

module.exports = main;

// Run the main function if the file is executed directly
if (require.main === module) {
    main().catch((error) => {
        console.error('An error occurred:', error);
        process.exit(1);
    });
}
