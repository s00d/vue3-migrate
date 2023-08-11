[![npm version](https://badge.fury.io/js/vue3-migrate.svg)](https://badge.fury.io/js/vue3-migrate)
[![npm downloads](https://img.shields.io/npm/dw/vue3-migrate)](https://badge.fury.io/js/vue3-migrate)
[![NPM license](https://img.shields.io/npm/l/vue3-migrate)](https://github.com/s00d/vue3-migrate/blob/master/LICENSE)
[![donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.me/s00d)
[![GitHub Repo stars](https://img.shields.io/github/stars/s00d/vue3-migrate?style=social)](https://github.com/s00d/vue3-migrate)

# Vue.js Code Migration Tool

<p align="center">
<img src="https://github.com/s00d/vue3-migrate/blob/main/Screenshot.png?raw=true" alt="logo">
</p>

This is a command-line tool that utilizes ChatGPT to automatically refactor Vue.js code from version 2 to version 3. It helps developers migrate their code by transforming it to use Typescript with the Composition API.

## Usage

### Installation

```bash
npm install -g vue3-migrate
```

### Refactor a Single Vue File

To refactor a single Vue file, use the `convert` command:

```shell
$ vue3-migrate convert <filename> [options]
```

Replace `<filename>` with the path to the Vue file you want to refactor.

#### Options

- `-t, --token <token>`: Specify the GPT token (required)
- `-m, --model <model>`: Specify the GPT model to use (default: gpt-3.5-turbo-16k, optional)
- `-p, --prompt <prompt>`: Specify the path to the prompt file (optional)
- `-mt, --max_tokens <max_tokens>`: The GPT max tokens (default: 4096, optional).
- `-r, --replace`: replace exist refactor files.

see help: `vue3-migrate convert -h`

### Refactor All Vue Files in a Directory

To refactor all Vue files in a directory, use the `directory` command:

```shell
$ vue3-migrate directory <directory> [options]
```

Replace `<directory>` with the path to the directory containing the Vue files you want to refactor.

#### Options

- `-t, --token <token>`: Specify the GPT token (required)
- `-m, --model <model>`: Specify the GPT model to use (default: gpt-3.5-turbo-16k, optional)
- `-p, --prompt <prompt>`: Specify the path to the prompt file (optional)
- `-t, --timeout <timeout>`: The `timeout` option allows you to specify the timeout duration in milliseconds between each refactoring request when using the `directory` command. It determines the waiting time before sending the next request to the OpenAI API (default: 20 seconds, optional).
- `-mt, --max_tokens <max_tokens>`: The GPT max tokens (default: 4096, optional).
- `-r, --replace`: replace exist refactor files.

see help: `vue3-migrate convert -h`

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
2. Create a prompt text file (md for example, default: prompt.md) that contains the instructions for the refactoring process. This file should specify the rules and guidelines for the refactoring.

## Notes

- The tool uses the OpenAI GPT API for code refactoring. Make sure you have a valid API key and appropriate permissions.
- It's recommended to review the refactored code manually to ensure correctness and make any necessary adjustments.

## License

This project is licensed under the [MIT License](LICENSE).
