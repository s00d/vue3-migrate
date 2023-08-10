// Refactoring tool using ChatGPT from Vue 2 to Vue 3
// $ node ./index.js MyView.vue

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

require('dotenv').config()

const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
const { HttpsProxyAgent } = require("https-proxy-agent");

const openaiApiKey = process.env.OPENAI_APIKEY;
if (!openaiApiKey) {
    console.log('ERR: OPENAI_APIKEY environment variable is not set');
    process.exit(1);
}

const configuration = new Configuration({
    apiKey: process.env.OPENAI_APIKEY,
});

const REFACTOR_PROMPT = `
You are an assistant designed to help developers migrate their code from Vue 2 to Vue 3 using Typescript with Composition API. Here is a set of rules you must absolutely follow:
1. Rewrite the <script lang="ts"> to <script setup lang="ts">
2. The content of the script tag must be valid Typescript code
3. The component must be flattened into the script setup
4. Remove any "export default".
5. Use the \`onMounted\` hook instead of the \`created\` lifecycle hook if necessary
6. Use the \`useRoute\` approach instead of $route. Same for $router.
7. Store is not using vuex but pinia.
8. Auth-related functions are accessible in stores/auth.ts, using useAuthStore.
9. Do not use Ref if the type can be inferred from the value passed into ref()
10. Do not put all the methods and properties into a global const object
11. Prefer using global "const router = useRouter()" instead of live instantiation when needed
`;

const RE_SCRIPT = /(<script lang="ts">.*<\/script>)/s;

async function refactor(filename, model) {
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
    const agent = new HttpsProxyAgent('http://127.0.0.1:4034');
    const openaiInstance = new OpenAIApi(configuration);
    const response = await openaiInstance.createChatCompletion({
        model,
        messages: [
            { role: 'system', content: REFACTOR_PROMPT },
            { role: 'user', content: scriptTag },
        ],
    },
        {
            proxy: false,
            httpAgent: agent,
            httpsAgent: agent
        });

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

async function main() {
    const args = process.argv.slice(2);
    const model = 'gpt-3.5-turbo-16k';
    const filename = args[0];

    if (!filename) {
        console.log('ERR: No file specified');
        process.exit(1);
    }

    await refactor(filename, model);
}

main().catch((error) => {
    console.error('An error occurred:', error);
    process.exit(1);
});
