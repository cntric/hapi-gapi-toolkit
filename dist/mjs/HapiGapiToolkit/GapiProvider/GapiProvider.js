import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useReducer } from "react";
import makeAsyncScriptLoader from "react-async-script";
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
    handleSignInClick: async (e) => {
        console.warn("You are attempting to handleSignInClick before the Gapi Client has loaded.");
    },
    handleSignOutClick: async (e) => {
        console.warn("You are attempting to handle handleSignOutClick before the Gapi Client has loaded.");
    },
    subscribe: (onChange) => {
    },
    drivers: {}
};
const OutsideProviderGapiContext = {
    ...DefaultGapiContext,
    _inProvider: false
};
const gapiReducer = (state, action) => {
    switch (action.type) {
        default: {
            return {
                ...state,
                ...action.payload
            };
        }
    }
};
const GapiContext = createContext(OutsideProviderGapiContext);
const Inner = ({ children }) => {
    return (_jsx("div", { children: children }, void 0));
};
export const GapiLoader = makeAsyncScriptLoader("https://apis.google.com/js/api.js")(Inner);
export const GapiProvider = ({ apiKey, clientId, scopes, gapiDrivers, children }) => {
    const [state, dispatch] = useReducer(gapiReducer, DefaultGapiContext);
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
            payload: {
                ...state,
                gapiError: e
            }
        });
    };
    /**
     * Sets Gapi loading using the reducer.
     */
    const acknowledgeGapiLoading = () => {
        dispatch({
            type: "def",
            payload: {
                ...state,
                gapiLoading: true,
            }
        });
    };
    /**
     * Handles gapiLoad using the reducer.
     */
    const handleGapiLoad = () => {
        dispatch({
            type: "def",
            payload: {
                ...state,
                gapiLoading: false,
                gapiLoaded: true,
                gapiClientLoading: true, // time to start Gapi client loading
                //gapi: gapi,
                //client: gapi.client
            }
        });
    };
    /**
     * Updates authorization status.
     */
    const updateStatus = () => {
        if (state.gapiClientLoaded || gapi) { // make sure gapi client has been loaded
            dispatch({
                type: "def",
                payload: {
                    ...state,
                    gapiSigningIn: false,
                    gapiIsAuthorized: gapi.auth2.getAuthInstance().isSignedIn.get()
                }
            });
        }
    };
    const handleSignInClick = async (event) => {
        dispatch({
            type: "def",
            payload: {
                ...state,
                gapiSigningIn: !gapi.auth2.getAuthInstance().isSignedIn.get(),
            }
        });
        gapi.auth2.getAuthInstance().signIn();
    };
    const handleSignOutClick = async (event) => {
        gapi.auth2.getAuthInstance().signOut();
    };
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
                payload: {
                    ...state,
                    handleSignInClick: handleSignInClick,
                    handleSignOutClick: handleSignOutClick,
                    gapiClientLoading: false,
                    gapiClientLoaded: true,
                    gapiAuthorized: gapi.auth2.getAuthInstance().isSignedIn.get(),
                    gapi: window.gapi,
                    client: window.gapi.client
                }
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
                payload: {
                    ...state,
                    gapiDriversLoading: true
                }
            });
        }
    };
    /**
     * @description
     */
    const onDriverLoaded = (driver) => {
        dispatch({
            type: "def",
            payload: {
                ...state,
                handleSignInClick: handleSignInClick,
                handleSignOutClick: handleSignOutClick,
                drivers: {
                    ...state.drivers,
                    [driver.as]: {
                        ...gapi.client[driver.name] || gapi[driver.name],
                        ...driver,
                        status: "loaded"
                    }
                }
            }
        });
    };
    /**
     * @description loads the requested gapiDrivers
     */
    const loadDrivers = async () => {
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
    };
    const handleDriverLoading = () => {
        loadDrivers().then(() => {
            dispatch({
                type: "def",
                payload: {
                    ...state,
                    gapiDriversLoading: false,
                    gapiDriversLoaded: true
                }
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
    useEffect(() => {
        handleGapiProviderState(state);
    });
    return (_jsx(GapiLoader, { asyncScriptOnLoad: handleGapiLoad, children: _jsx(GapiContext.Provider, { value: state, children: children }, void 0) }, void 0));
};
export const useGapi = () => {
    const context = useContext(GapiContext);
    if (!context._inProvider) {
        throw new Error("useGapi must be called within a GapiProvider.");
    }
    return context;
};
