console.log("Loading api/index.js...");

let createHandler;
try {
    createHandler = require("azure-function-express").createHandler;
    console.log("Loaded azure-function-express");
} catch (e) {
    console.error("ERROR: Failed to load azure-function-express", e);
    throw e;
}

let app;
try {
    app = require("../server");
    console.log("Loaded ../server");
} catch (e) {
    console.error("ERROR: Failed to load ../server", e);
    throw e;
}

// Wrapper for Azure Functions to handle Express app
module.exports = createHandler(app);
