const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    //   endpoint: process.env.API_URL,
    //   masterKey: process.env.API_KEY,
    port: process.env.PORT
};

// https://medium.com/the-node-js-collection/making-your-node-js-work-everywhere-with-environment-variables-2da8cdf6e786