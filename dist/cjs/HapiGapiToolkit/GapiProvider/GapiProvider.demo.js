"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapiProviderDemo = exports.Inner = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const GapiProvider_1 = require("./GapiProvider");
const Inner = () => {
    const gapi = (0, GapiProvider_1.useGapi)();
    console.log(gapi);
    return (0, jsx_runtime_1.jsx)("div", {}, void 0);
};
exports.Inner = Inner;
const GapiProviderDemo = () => {
    return ((0, jsx_runtime_1.jsx)(GapiProvider_1.GapiProvider, Object.assign({ apiKey: process.env.REACT_APP_GAPI_SECRET, clientId: process.env.REACT_APP_GAPI_CLIENT_ID, scopes: "https://www.googleapis.com/auth/documents", gapiDrivers: [
            {
                name: "docs",
                version: "v1",
                status: "loading",
                as: "docs"
            },
            {
                name: "picker",
                status: "loading",
                as: "picker"
            }
        ] }, { children: (0, jsx_runtime_1.jsx)(exports.Inner, {}, void 0) }), void 0));
};
exports.GapiProviderDemo = GapiProviderDemo;
