# Percy Figma

Helps you upload Figma images to Percy and get visual comparisons.

## Installation

First, make sure you have the Percy CLI installed. If not, install it using npm:

```shell
npm install -g @percy/cli
```

Install the package globally using npm:

```shell
npm install percy-figma
```

## Usage

1. Here we will be using a single config file to save all your settings required to upload your figma images to percy.
- Details regarding the Figma account, list of designs, and the Percy project can be provided under this config file. A sample .yml file:

```yaml
percy_token: Percy Project Token
figma_token: Figma Account Access Token
figma_file_token: Figma File Token
ids: ["111-111", "222-222"]
names: ["Snapshot 1", "Snapshot 2"]
```

   - Percy Project Token can be found under the project settings section in Percy.
   - The Figma Account Access Token can be generated from the "Personal access tokens" section of account settings.
   - Access tokens can also be generated from [here](https://www.figma.com/developers/api#access-tokens).
   - The Figma File Token (i.e., the figma_file_token parameter) can be found in your Figma file URLs,
    e.g., https://www.figma.com/file/**file-token**/MockUpName.
   - In the ids array, we need to provide a list of node-ids which can be found from the URLs, e.g., https://www.figma.com/file/file-token/MockUpName?type=design&**node-id=1-100**.
   - The names array should contain names corresponding to the ids array. The snapshots will be uploaded onto Percy with the names mentioned in this array.

2. Alternatively the tokens can be provided as environment variables as well.

   - Percy project token:

     ```shell
     # macOS
     export PERCY_TOKEN="your-percy-project-token"

     # Windows
     set PERCY_TOKEN="your-percy-project-token"
     ```

   - Figma Account Access Token:

     ```shell
     # macOS
     export FIGMA_TOKEN="your-figma-user-token"

     # Windows
     set FIGMA_TOKEN="your-figma-user-token"
     ```

   - Figma File Token:

     ```shell
     # macOS
     export FIGMA_FILE_TOKEN="your-figma-file-token"

     # Windows
     set FIGMA_FILE_TOKEN="your-figma-file-token"
     ```

3. Uploading the designs onto Percy

   Run the command:

   ```shell
   npx percy-figma
   ```

   By default, the package looks for the percyFigma.yml config file. If you are using a different config file, specify it using the --config flag:

   ```shell
   npx percy-figma --config your-config-file.yml
   ```