const createHandler = require("azure-function-express").createHandler;
const app = require("../server");

// Wrapper for Azure Functions to handle Express app
module.exports = createHandler(app);
