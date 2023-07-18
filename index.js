#!/usr/bin/env node
const fs = require("fs");
const request = require("request");
const path = require("path");
const yaml = require("js-yaml");
const { exec } = require("child_process");

const handleError = (error) => {
  console.error("Error:", error);
};

/** Function to download images from figma **/
const downloadImage = (imageUrl, imagePath) => {
  return new Promise((resolve, reject) => {
    request
      .get(imageUrl)
      .on("response", (response) => {
        if (response.statusCode === 200) {
          response.pipe(fs.createWriteStream(imagePath));
          response.on("end", () => {
            console.log(`Downloaded ${path.basename(imagePath)}`);
            resolve();
          });
        } else {
          reject(new Error(`Failed to download ${imageUrl}: ${response.statusCode}`));
        }
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

/** Getting the config file path, by default it is percyFigma.yml unless provided with the --config flag **/
const configFileIndex = process.argv.indexOf('--config');
const configFileName = configFileIndex !== -1 ? process.argv[configFileIndex + 1] : 'percyFigma.yml';

const configPath = path.resolve(__dirname, "..", "..", configFileName);

try {
  const configContent = fs.readFileSync(configPath, "utf8");//if this fails, will throw the default error of file not found
  const config = yaml.load(configContent);

  /** Figma User Token, either from the config or environment variables **/
  const figmaToken = config.figma_token || process.env.FIGMA_TOKEN;
  if (!figmaToken) {
    throw new Error("Figma User token not provided. Please provide your user token in the config file or as an environment variable.");
  }

  /** Figma Project Token, either from the config or environment variables **/
  let projectToken = config.project_token || process.env.PROJECT_TOKEN;
  if (!projectToken) {
    throw new Error("Figma Project token not provided. Please provide your project token in the config file or as an environment variable.");
  }

  /** Base URL of Figma APIs **/
  const baseUrl = "https://api.figma.com/v1/images/";

  /** Getting image ids from the config file **/
  const ids = config.ids;

  if (!ids || !ids.length) {
    throw new Error("No image IDs found in the config file.");
  }

  const idString = ids.join(",");

  const url = `${baseUrl}${projectToken}?ids=${idString}`;

  const options = {
    url: url,
    headers: {
      "X-FIGMA-TOKEN": figmaToken,
    },
  };

  /** Get request to download images from figma based on specified user, project and image ids**/
  request.get(options, async (error, response, body) => {
    if (error) {
      handleError(error);
      return;
    }

    if (response.statusCode !== 200) {
      handleError(`Failed to fetch images from Figma API: ${response.statusCode}, please provide correct figma user and project tokens`);
      return;
    }

    const responseBody = JSON.parse(body);
    const folderPath = path.join(__dirname, "percy_figma_images");

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const downloadPromises = [];

    /** Downloading images from the urls received in the API response **/
    for (const [imageId, imageUrl] of Object.entries(responseBody.images)) {
      const imageFilename = `${imageId}.png`;
      const imagePath = path.join(folderPath, imageFilename);
      const downloadPromise = downloadImage(imageUrl, imagePath)
        .catch((err) => {
          console.error(`Error downloading ${path.basename(imagePath)}: Please check if the id is correct`);
        });

      downloadPromises.push(downloadPromise);
    }

    try {
      await Promise.all(downloadPromises);
      console.log("All images downloaded successfully.");

      /** Uploading all the downloaded images to Percy with the name being the image file names**/
      const command = "npx percy upload percy_figma_images";
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing the command: ${error.message}`);
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
