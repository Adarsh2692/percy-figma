
# Percy Figma

Helps you upload Figma images to Percy and get visual comparisons.

## Installation

Install the package globally using npm:

```shell
npm install percy-figma
```


## Usage

1. Set the Percy project token by running the following command in the terminal:
```shell
#macOS
export PERCY_TOKEN="your-percy-project-token


#windows
set PERCY_TOKEN="your-percy-project-token
```
2. Set the Figma user token by running the following command in the terminal:
```shell
#macOS
export FIGMA_TOKEN="your-figma-user-token"

#windows
set FIGMA_TOKEN="your-figma-user-token"
```
Alternatively, you can add the figma_token field inside the config file.

3. Set the Figma project token by running the following command in the terminal:
```shell
#macOS
export PROJECT_TOKEN="your-figma-project-token"

#windows
set PROJECT_TOKEN="your-figma-project-token"
```
Alternatively, you can add the project_token field inside the config file

4. Create a .yml file to be used as the config. Provide a list of Figma UI IDs inside the config file.
```yml
ids: [123-123, 111-111]
```

5. Run the command:
```shell
npx percy-figma
```

By default, the package looks for the percyFigma.yml config file. If you are using a different config file, specify it using the --config flag:
```shell
npx percy-figma --config your-config-file.yml
```