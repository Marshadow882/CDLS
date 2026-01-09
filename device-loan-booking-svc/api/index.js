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
const azureFunctionHandler = createHandler(app);

module.exports = async function (context, req) {
    try {
        await azureFunctionHandler(context, req);
    } catch (error) {
        context.log.error("Unhandled Error in Azure Function:", error);
        context.res = {
            status: 500,
            body: JSON.stringify({
                error: "Internal Server Error",
                message: error.message || String(error)
            }),
            headers: { "Content-Type": "application/json" }
        };
    }
};
