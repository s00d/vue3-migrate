// Refactoring tool using ChatGPT from Vue 2 to Vue 3
// $ node ./index.js MyView.vue

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
const { program } = require('commander');
// const { HttpsProxyAgent } = require("https-proxy-agent");

const RE_SCRIPT = /(<script lang="ts">.*<\/script>)/s;

async function refactor(filename, model, token, prompt) {
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
        .version('1.0.0')
        .arguments('<filename>')
        .option('-m, --model <model>', 'Specify the GPT model', 'gpt-3.5-turbo-16k')
        .option('-t, --token <token>', 'Specify the GPT token', '')
        .option('-t, --prompt <prompt>', 'Start prompt path', '')
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
            let prompt = options.prompt;
            if (!prompt) {
                prompt = fs.readFileSync('./init.md', 'utf8');
            }

            await refactor(filename, model, token, prompt);
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
