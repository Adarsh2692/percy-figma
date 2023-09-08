#!/usr/bin/env node
const fs = require("fs");
const request = require("request");
const path = require("path");
const yaml = require("js-yaml");
const { exec } = require("child_process");
const downloadImage = require("./downloadImage");

const handleError = (error) => {
    console.error("Error:", error);
};

/** Getting the config file path, by default it is percyFigma.yml unless provided with the --config flag **/
const configFileIndex = process.argv.indexOf('--config');
const configFileName = configFileIndex !== -1 ? process.argv[configFileIndex + 1] : 'percyFigma.yml';

const configPath = path.resolve(__dirname, "..", "..", configFileName);

console.log(configPath);

try {
    const configContent = fs.readFileSync(configPath, "utf8"); //if this fails, will throw the default error of file not found
    const config = yaml.load(configContent);

    /** Checking for percy token in the config file **/
    const percyToken = config.percy_token;

    if (percyToken) {
        process.env.PERCY_TOKEN = percyToken;
    }

    /** Figma User Token, either from the config or environment variables **/
    const figmaToken = config.figma_token || process.env.FIGMA_TOKEN;
    if (!figmaToken) {
        throw new Error(
            "Figma User token not provided. Please provide your user token in the config file or as an environment variable."
        );
    }

    /** Figma File Token, either from the config or environment variables **/
    let figmaFileToken = config.figma_file_token || process.env.FIGMA_FILE_TOKEN;
    if (!figmaFileToken) {
        throw new Error(
            "Figma File token not provided. Please provide your file token in the config file or as an environment variable."
        );
    }

    /** Base URL of Figma APIs **/
    const baseUrl = "https://api.figma.com/v1/images/";

    /** Getting image ids from the config file **/
    const ids = config.ids;

    if (!ids || !ids.length) {
        throw new Error("No image IDs found in the config file.");
    }


    /** Getting image names from the config file **/
    const names = config.names;

    if (!names || !names.length || names.length !== ids.length) {
        throw new Error("Invalid Array of snapshot names");
    }

    const idString = ids.join(",");

    const url = `${baseUrl}${figmaFileToken}?ids=${idString}`;

    const options = {
        url: url,
        headers: {
            "X-FIGMA-TOKEN": figmaToken,
        },
    };

    /** Get request to download images from figma based on specified user, file and image ids**/
    request.get(options, async (error, response, body) => {
        if (error) {
            handleError(error);
            return;
        }

        if (response.statusCode !== 200) {
            handleError(
                `Failed to fetch images from Figma API: ${response.statusCode}, please provide correct figma user and file tokens`
            );
            return;
        }

        const responseBody = JSON.parse(body);
        const folderPath = path.join(__dirname, "percy_figma_images");

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }

        const downloadPromises = [];

        /** Downloading images from the urls received in the API response **/
        const images = Object.entries(responseBody.images);
        for (let index = 0; index < images.length; index++) {
            const [imageId, imageUrl] = images[index];
            const imageFilename = `${names[index]}.png`;
            const imagePath = path.join(folderPath, imageFilename);
            const downloadPromise = downloadImage(imageUrl, imagePath).catch(
                (err) => {
                    console.error(
                        `Error downloading ${path.basename(
                            imagePath
                        )}: Please check if the id is correct`
                    );
                }
            );

            downloadPromises.push(downloadPromise);
        }

        try {
            await Promise.all(downloadPromises);
            console.log("All images downloaded successfully.");

            /** Uploading all the downloaded images to Percy with the name being the image file names**/
            const command = `npx percy upload --strip-extensions ${folderPath}`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(
                        `Error executing the command: ${error.message}`
                    );
                    return;
                }

                console.log(`Command output: ${stdout}`);
                console.error(`Command error (if any): ${stderr}`);

                /** Deleting the image folder after image upload **/
                fs.rmSync(folderPath, { recursive: true });
                console.log(`Deleted folder: ${folderPath}`);
            });
        } catch (err) {
            console.error("Error downloading images:", err);
        }
    });
} catch (error) {
    handleError(error);
}
