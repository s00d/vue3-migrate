
# Vue.js Code Migration Tool

This is a command-line tool that utilizes ChatGPT to automatically refactor Vue.js code from version 2 to version 3. It helps developers migrate their code by transforming it to use Typescript with the Composition API.

## Usage

### Refactor a Single Vue File

To refactor a single Vue file, use the `convert` command:

```shell
$ vue3-migrate convert <filename> [options]
```

Replace `<filename>` with the path to the Vue file you want to refactor.

#### Options

- `-m, --model <model>`: Specify the GPT model to use (default: gpt-3.5-turbo-16k)
- `-t, --token <token>`: Specify the GPT token (required)
- `-p, --prompt <prompt>`: Specify the path to the prompt file (optional)

### Refactor All Vue Files in a Directory

To refactor all Vue files in a directory, use the `directory` command:

```shell
$ vue3-migrate directory <directory> [options]
```

Replace `<directory>` with the path to the directory containing the Vue files you want to refactor.

#### Options

- `-m, --model <model>`: Specify the GPT model to use (default: gpt-3.5-turbo-16k)
- `-t, --token <token>`: Specify the GPT token (required)
- `-p, --prompt <prompt>`: Specify the path to the prompt file (optional)
- `-p, --timeout <timeout>`: The `timeout` option allows you to specify the timeout duration in milliseconds between each refactoring request when using the `directory` command. It determines the waiting time before sending the next request to the OpenAI API. By default, the timeout is set to 20000 milliseconds (20 seconds).

## Examples

Refactor a single Vue file:

```shell
$ vue3-migrate convert /path/MyView.vue --token=sk-...
```

Refactor all Vue files in a directory:

```shell
$ vue3-migrate directory /path/src/components --token=sk-...
```

## Configuration

Before running the tool, make sure to set up the following:

1. Obtain a GPT token from OpenAI. You can sign up for an API key at https://openai.com/.
2. Create a prompt file (default: init.md) that contains the instructions for the refactoring process. This file should specify the rules and guidelines for the refactoring.

## Notes

- The tool uses the OpenAI GPT API for code refactoring. Make sure you have a valid API key and appropriate permissions.
- It's recommended to review the refactored code manually to ensure correctness and make any necessary adjustments.

## License

This project is licensed under the [MIT License](LICENSE).
