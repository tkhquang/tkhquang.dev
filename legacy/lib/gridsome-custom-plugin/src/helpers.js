const fs = require("fs");
const path = require("path");
const request = require("request");
const { extension } = require("mime-types");
const sanitize = require("sanitize-filename");

function getRemoteImage(url, options = {}) {
  return new Promise(function (resolve, reject) {
    request({ url, encoding: null }, (error, response, body) => {
      if (error || response.statusCode < 200 || response.statusCode >= 300) {
        reject(
          new Error("Request Failed.\n" + `Status Code: ${response.statusCode}`)
        );
      }

      let filePath = path.resolve(
        options.targetPath,
        sanitize(path.basename(url))
      );

      if (!path.extname(filePath)) {
        const contentType = response.headers["content-type"];
        const ext = extension(contentType);

        if (ext) {
          filePath += `.${ext}`;
        } else {
          reject(new Error("Cannot detect file extension!"));
        }
      }

      // Cache first
      if (options.cache && fs.existsSync(filePath)) {
        resolve(filePath);
      }

      fs.writeFile(filePath, body, (err) => {
        if (err) {
          reject(new Error("Cannot write image data."));
        }

        resolve(filePath);
      });
    });
  });
}

module.exports = { getRemoteImage };
