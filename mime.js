module.exports = function (url) {
   const map = {
      default: "text/html, charset=UTF-8",
      ".ico": "image/x-icon",
      ".html": "text/html, charset=UTF-8",
      ".js": "text/javascript",
      ".json": "application/json",
      ".css": "text/css",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".webp": "image/webp",
      ".wav": "audio/wav",
      ".mp3": "audio/mpeg",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
   };
   return map[url.match(/\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gim)] || map.default;
};
