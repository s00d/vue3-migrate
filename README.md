
# Vue.js Code Migration Tool

This is a command-line tool that utilizes ChatGPT to automatically refactor Vue.js code from version 2 to version 3. It helps developers migrate their code by transforming it to use Typescript with the Composition API.

## Usage

To use the tool, follow these steps:

1. Install the dependencies by running `npm i -g vue3-migrate`.
2. Run the tool with the following command:

```
$ vue3-migrate <filename> [options]
```

Replace `<filename>` with the path to your Vue.js file that needs to be refactored.

Options:
- `-m, --model <model>`: Specify the GPT model to use (default: gpt-3.5-turbo-16k).
- `-t, --token <token>`: Specify the GPT token for authentication.
- `-p, --prompt <prompt>`: Specify the path to the prompt file (default: init.md).

3. The tool will extract the script tag from your Vue.js file and send it to the ChatGPT model for refactoring.
4. The refactored code will be saved to a new file with `_refactored` appended to the original filename.

## Configuration

Before running the tool, make sure to set up the following:

1. Obtain a GPT token from OpenAI. You can sign up for an API key at https://openai.com/.
2. Create a prompt file (default: init.md) that contains the instructions for the refactoring process. This file should specify the rules and guidelines for the refactoring.

## Example

Here's an example usage of the tool:

```
$ vue3-migrate /path/MyView.vue -m gpt-4.0-turbo -t sk-abc123xyz -p prompt.md
```

This will refactor the code in `MyView.vue` using the `gpt-4.0-turbo` model, the specified GPT token, and the prompt instructions from `prompt.md`.

## Notes

- The tool uses the OpenAI GPT API for code refactoring. Make sure you have a valid API key and appropriate permissions.
- It's recommended to review the refactored code manually to ensure correctness and make any necessary adjustments.

## License

This project is licensed under the [MIT License](LICENSE).
