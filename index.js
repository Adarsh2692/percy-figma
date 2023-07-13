#!/usr/bin/env node
let fs = require("fs");
let request = require("request");
const path = require("path");
const yaml = require("js-yaml");
const { exec } = require("child_process");

/** Fetching the path to config file, default config is "percyFigma.yml" **/
const configFileIndex = process.argv.indexOf('--config');
const configFileName = configFileIndex !== -1 ? process.argv[configFileIndex + 1] : 'percyFigma.yml';

const configPath = path.resolve(__dirname, "..", "..", configFileName);

/** Extracting and storing data from the config file **/
const configContent = fs.readFileSync(configPath, "utf8");

const config = yaml.load(configContent);

/** Figma account API token **/
const figma_token = config.figma_token ? config.figma_token : process.env.FIGMA_TOKEN;

/** Creating the API endpoint URL to fetch data specific to a project **/
let baseUrl = "https://api.figma.com/v1/images/";
let project_token = config.project_token ? config.project_token : process.env.PROJECT_TOKEN;

/** List of figma image ids **/
let ids = config.ids;

let idString = "";

for (let i = 0; i < ids.length; i++) {
    if (i !== 0) {
        idString += ",";
    }

    idString += ids[i];
}

/** API endpoint URL **/
const url = `${baseUrl + project_token}?ids=${idString}`;


/** GET Request options with header having the figma token **/
const options = {
    url: url,
    headers: {
        "X-FIGMA-TOKEN": figma_token,
    },
};

/** GET Request to fetch the figma images from the list provided **/
request.get(options, async (error, response, body) => {
    if (error) {
        console.error("Error:", error);
    } else {

        const responseBody = JSON.parse(body);

        /** Creating a folder to store the images **/
        const folderPath = path.join(__dirname, "downloaded_images");
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }

        // Downloading and storing each image
        const downloadPromises = [];

        Object.entries(responseBody.images).forEach(([imageId, imageUrl]) => {
            const imageFilename = `${imageId}.png`;
            const imagePath = path.join(folderPath, imageFilename);

            /** Promise that will be resolved once all the images are downloaded and stored in a folder **/
            const downloadPromise = new Promise((resolve, reject) => {
                request
                    .get(imageUrl)
                    .pipe(fs.createWriteStream(imagePath))
                    .on("close", () => {
                        console.log(`Downloaded ${imageFilename}`);
                        resolve();
                    })
                    .on("error", (err) => {
                        console.error(
                            `Error downloading ${imageFilename}:`,
                            err
                        );
                        reject(err);
                    })                    ;
            }).catch((err) => {
                console.log(err);
            })

            downloadPromises.push(downloadPromise);
        });

        /** Executing the percy upload command once the promise is resolved **/
        Promise.all(downloadPromises)
            .then(() => {
                console.log("All images downloaded successfully.");

                /** Percy upload command execution **/
                const command = "npx percy upload downloaded_images";
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(
                            `Error executing the command: ${error.message}`
                        );
                        return;
                    }

                    console.log(`Command output: ${stdout}`);
                    console.error(`Command error (if any): ${stderr}`);

                    /** Deleting the folder after command execution **/
                    fs.rmSync(folderPath, { recursive: true });
                    console.log(`Deleted folder: ${folderPath}`);
                });
            })
            .catch((err) => {
                console.error("Error downloading images:", err);
            });
    }
});
