console.log("Loading api/index.js...");

// Wrapper for Azure Functions to handle Express app
let azureFunctionHandler;
let initError = null;

try {
        // Robust import for both v1.x and v2.x of azure-function-express
        const pkg = require("azure-function-express");
        const createHandler = typeof pkg === 'function' ? pkg : pkg.createHandler;
        
        console.log("Loaded azure-function-express (Type: " + typeof pkg + ")");

        const app = require("../server");
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
                message: initError.message || String(initError),
                stack: initError.stack
            }),
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            }
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
                message: error.message || String(error),
                stack: error.stack
            }),
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
        context.done();
    }
};
