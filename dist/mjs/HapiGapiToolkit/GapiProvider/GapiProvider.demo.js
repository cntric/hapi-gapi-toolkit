import { jsx as _jsx } from "react/jsx-runtime";
import { GapiProvider, useGapi } from './GapiProvider';
export const Inner = () => {
    const gapi = useGapi();
    console.log(gapi);
    return _jsx("div", {}, void 0);
};
export const GapiProviderDemo = () => {
    return (_jsx(GapiProvider, { apiKey: process.env.REACT_APP_GAPI_SECRET, clientId: process.env.REACT_APP_GAPI_CLIENT_ID, scopes: "https://www.googleapis.com/auth/documents", gapiDrivers: [
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
        ], children: _jsx(Inner, {}, void 0) }, void 0));
};
