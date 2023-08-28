const fs = require("fs");
const request = require("request");
const path = require("path");

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

module.exports = downloadImage;