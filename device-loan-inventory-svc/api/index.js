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
let azureFunctionHandler;
let initError = null;

try {
    azureFunctionHandler = createHandler(app);
} catch (e) {
    console.error("Initialization failed:", e);
    initError = e;
}

module.exports = function (context, req) {
    if (initError) {
        context.log.error("Function failed to initialize:", initError);
        context.res = {
            status: 500,
            body: JSON.stringify({
                error: "Function Initialization Error",
                message: initError.message || String(initError)
            }),
            headers: { "Content-Type": "application/json" }
        };
        context.done();
        return;
    }

    try {
        // azure-function-express uses context.done() internally
        azureFunctionHandler(context, req);
    } catch (error) {
        context.log.error("Unhandled Runtime Error:", error);
        context.res = {
            status: 500,
            body: JSON.stringify({
                error: "Internal Runtime Error",
                message: error.message || String(error)
            }),
            headers: { "Content-Type": "application/json" }
        };
        context.done();
    }
};
