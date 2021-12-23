"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGapi = exports.GapiProvider = exports.GapiLoader = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_async_script_1 = __importDefault(require("react-async-script"));
const DefaultGapiContext = {
    gapi: undefined,
    client: undefined,
    gapiDriversRequested: {},
    gapiError: undefined,
    gapiLoading: false,
    gapiLoaded: false,
    gapiClientLoading: false,
    gapiClientLoaded: false,
    gapiSigningIn: false,
    gapiAuthorized: false,
    gapiDriversLoading: false,
    gapiDriversLoaded: false,
    _inProvider: true,
    handleSignInClick: (e) => __awaiter(void 0, void 0, void 0, function* () {
        console.warn("You are attempting to handleSignInClick before the Gapi Client has loaded.");
    }),
    handleSignOutClick: (e) => __awaiter(void 0, void 0, void 0, function* () {
        console.warn("You are attempting to handle handleSignOutClick before the Gapi Client has loaded.");
    }),
    subscribe: (onChange) => {
    },
    drivers: {}
};
const OutsideProviderGapiContext = Object.assign(Object.assign({}, DefaultGapiContext), { _inProvider: false });
const gapiReducer = (state, action) => {
    switch (action.type) {
        default: {
            return Object.assign(Object.assign({}, state), action.payload);
        }
    }
};
const GapiContext = (0, react_1.createContext)(OutsideProviderGapiContext);
const Inner = ({ children }) => {
    return ((0, jsx_runtime_1.jsx)("div", { children: children }, void 0));
};
exports.GapiLoader = (0, react_async_script_1.default)("https://apis.google.com/js/api.js")(Inner);
const GapiProvider = ({ apiKey, clientId, scopes, gapiDrivers, children }) => {
    const [state, dispatch] = (0, react_1.useReducer)(gapiReducer, DefaultGapiContext);
    // as follows
    // setGapiLoading ->
    // wait for loader to set handleGapiLoad ->
    // loadGapiClient ->
    // wait for userSignIn ->
    // setSigningIn ->
    // authorizeGapi ->
    // loadGapiDrivers 
    /**
     * @description asssigns an error to gapi using the reducer
     */
    const assignGapiError = (e) => {
        dispatch({
            type: "def",
            payload: Object.assign(Object.assign({}, state), { gapiError: e })
        });
    };
    /**
     * Sets Gapi loading using the reducer.
     */
    const acknowledgeGapiLoading = () => {
        dispatch({
            type: "def",
            payload: Object.assign(Object.assign({}, state), { gapiLoading: true })
        });
    };
    /**
     * Handles gapiLoad using the reducer.
     */
    const handleGapiLoad = () => {
        dispatch({
            type: "def",
            payload: Object.assign(Object.assign({}, state), { gapiLoading: false, gapiLoaded: true, gapiClientLoading: true })
        });
    };
    /**
     * Updates authorization status.
     */
    const updateStatus = () => {
        if (state.gapiClientLoaded || gapi) { // make sure gapi client has been loaded
            dispatch({
                type: "def",
                payload: Object.assign(Object.assign({}, state), { gapiSigningIn: false, gapiIsAuthorized: gapi.auth2.getAuthInstance().isSignedIn.get() })
            });
        }
    };
    const handleSignInClick = (event) => __awaiter(void 0, void 0, void 0, function* () {
        dispatch({
            type: "def",
            payload: Object.assign(Object.assign({}, state), { gapiSigningIn: !gapi.auth2.getAuthInstance().isSignedIn.get() })
        });
        gapi.auth2.getAuthInstance().signIn();
    });
    const handleSignOutClick = (event) => __awaiter(void 0, void 0, void 0, function* () {
        gapi.auth2.getAuthInstance().signOut();
    });
    /**
     * @description Initializes the gapi client.
     */
    const initClient = () => {
        // attempt to load gapi client
        gapi.client.init({
            apiKey: apiKey,
            clientId: clientId,
            scope: scopes
        }).then(() => {
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateStatus);
            dispatch({
                type: "def",
                payload: Object.assign(Object.assign({}, state), { handleSignInClick: handleSignInClick, handleSignOutClick: handleSignOutClick, gapiClientLoading: false, gapiClientLoaded: true, gapiAuthorized: gapi.auth2.getAuthInstance().isSignedIn.get(), gapi: window.gapi, client: window.gapi.client })
            });
        });
    };
    /**
     * @description handles client loading
     */
    const loadClient = () => {
        try {
            gapi.load('auth2', initClient);
        }
        catch (e) {
            assignGapiError(e);
        }
    };
    const handleAuthorized = () => {
        if (!state.gapiDriversLoaded) {
            dispatch({
                type: "def",
                payload: Object.assign(Object.assign({}, state), { gapiDriversLoading: true })
            });
        }
    };
    /**
     * @description
     */
    const onDriverLoaded = (driver) => {
        dispatch({
            type: "def",
            payload: Object.assign(Object.assign({}, state), { handleSignInClick: handleSignInClick, handleSignOutClick: handleSignOutClick, drivers: Object.assign(Object.assign({}, state.drivers), { [driver.as]: Object.assign(Object.assign(Object.assign({}, gapi.client[driver.name] || gapi[driver.name]), driver), { status: "loaded" }) }) })
        });
    };
    /**
     * @description loads the requested gapiDrivers
     */
    const loadDrivers = () => __awaiter(void 0, void 0, void 0, function* () {
        gapiDrivers.forEach((driver) => {
            if (!state.drivers[driver.as]) {
                if (!driver.version) { // assume if no version this is a driver that needs to be loaded by gapi
                    gapi.load(driver.name, () => {
                        onDriverLoaded(driver);
                    });
                }
                else {
                    gapi.client.load(driver.name, driver.version, () => {
                        onDriverLoaded(driver);
                    });
                }
            }
            else {
                if (state.drivers[driver.as].name !== driver.name || state.drivers[driver.as].version !== driver.version) {
                    console.warn(`You have already loaded a ${state.drivers[driver.as].name} ${state.drivers[driver.as].version} as ${driver.as}. Consider changing the as property of your driver request.`);
                }
            }
        });
    });
    const handleDriverLoading = () => {
        loadDrivers().then(() => {
            dispatch({
                type: "def",
                payload: Object.assign(Object.assign({}, state), { gapiDriversLoading: false, gapiDriversLoaded: true })
            });
        });
    };
    /**
     * @description handles gapi provider state befor script load
     * @param state
     */
    const handleGapiProviderPreScriptLoaded = (state) => {
        acknowledgeGapiLoading();
    };
    /**
     * @description handles gapi provider state when provider is loaded.
     * @param state
     */
    const handleGapiProviderScriptLoaded = (state) => {
        switch (true) {
            case (state.gapiDriversLoading): {
                handleDriverLoading();
                break;
            }
            case (state.gapiAuthorized): {
                handleAuthorized();
                break;
            }
            case (state.gapiClientLoading): {
                loadClient();
                break;
            }
        }
    };
    /**
     * @description handles GapiProvider rendering when not in error.
     * @param state
     */
    const handleGapiProviderNotError = (state) => {
        if (state.gapiLoaded) { // if gapi is Loaded, pass to the handler
            handleGapiProviderScriptLoaded(state);
        }
        else if (!state.gapiLoaded && !state.gapiLoading) { // otherwise check if gapi isn't loaded and the hasn't been set to loading
            handleGapiProviderPreScriptLoaded(state);
        }
    };
    const handleGapiProviderState = (state) => {
        if (state.gapiError) {
        }
        else {
            handleGapiProviderNotError(state);
        }
    };
    (0, react_1.useEffect)(() => {
        handleGapiProviderState(state);
    });
    return ((0, jsx_runtime_1.jsx)(exports.GapiLoader, Object.assign({ asyncScriptOnLoad: handleGapiLoad }, { children: (0, jsx_runtime_1.jsx)(GapiContext.Provider, Object.assign({ value: state }, { children: children }), void 0) }), void 0));
};
exports.GapiProvider = GapiProvider;
const useGapi = () => {
    const context = (0, react_1.useContext)(GapiContext);
    if (!context._inProvider) {
        throw new Error("useGapi must be called within a GapiProvider.");
    }
    return context;
};
exports.useGapi = useGapi;
