module.exports = { cleanRequest };

function cleanRequest(str) {
   return str.replace(/[^a-zA-Z0-9.~!@#$%^&*()_+-]/gi, "");
}
