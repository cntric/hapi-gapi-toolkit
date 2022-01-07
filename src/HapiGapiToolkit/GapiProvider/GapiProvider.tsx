// googleapis does not play nice with webpack, please only import types.
// ^ This is because googleapi is intended for server-side use.
import hoistNonReactStatics from "hoist-non-react-statics";
import React, { ComponentType, createContext, FC, useContext, useEffect, useReducer } from "react";
import makeAsyncScriptLoader from "react-async-script";


export interface GapiDriverI {
    name: string,
    version?: string, // if user does not provide a version then we use gapi.load instead of gapi.client.load
    status: "loading" | "loaded" | "error",
    as: string,
    [key : string] : any
}
export interface GapiContextProps {
    gapi: typeof gapi | undefined,
    client: (typeof gapi)["client"] | undefined,
    gapiDriversRequested: {[key : string] : string }
    gapiError: Error | undefined,
    gapiLoading: boolean,
    gapiLoaded: boolean,
    gapiClientLoading: boolean,
    gapiClientLoaded: boolean,
    gapiSigningIn: boolean,
    gapiAuthorized: boolean,
    gapiDriversLoading: boolean,
    gapiDriversLoaded: boolean,
    _inProvider: boolean,
    handleSignInClick : (e: React.MouseEvent)=>Promise<void>,
    handleSignOutClick: (e: React.MouseEvent)=>Promise<void>,
    subscribe: (onChange : ()=>void)=>void,
    drivers : {
        [key : string] : GapiDriverI
    }
}

const DefaultGapiContext : GapiContextProps = {
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
    handleSignInClick: async (e : React.MouseEvent)=>{
        console.warn("You are attempting to handleSignInClick before the Gapi Client has loaded.")
    },
    handleSignOutClick: async (e : React.MouseEvent)=>{
        console.warn("You are attempting to handle handleSignOutClick before the Gapi Client has loaded.")
    },
    subscribe : (onChange : ()=>void)=>{

    },
    drivers : {}
}

const OutsideProviderGapiContext : GapiContextProps = {
    ...DefaultGapiContext,
    _inProvider: false
}

const gapiReducer = (state : GapiContextProps, action : {type : string, payload : any})=>{

    switch (action.type){

        default : {
            return { 
                ...state,
                ...action.payload as GapiContextProps };
        }
    }

}


const GapiContext = createContext<GapiContextProps>(OutsideProviderGapiContext);

const Inner : FC = ({children})=>{

    return (
        <div>
            {children}
        </div>
    )
}

interface LoaderInternals {
    asyncScriptOnLoad?: () => void
}

type Loader =  FC<hoistNonReactStatics.NonReactStatics<ComponentType<any>>& LoaderInternals>

export const GapiLoader : Loader = makeAsyncScriptLoader("https://apis.google.com/js/api.js")(Inner) as Loader;

export interface GapiProviderProps {
    apiKey: string,
    clientId: string,
    scopes: string,
    gapiDrivers: GapiDriverI[]
}


export const GapiProvider : FC<GapiProviderProps> = 
    ({apiKey, clientId, scopes, gapiDrivers, children}) =>{

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
        const assignGapiError = (e : Error)=>{
            dispatch(
                {
                    type : "def",
                    payload: {
                        ...state,
                        gapiError: e
                    } as GapiContextProps
                }
            )
        }

        /**
         * Sets Gapi loading using the reducer.
         */
        const acknowledgeGapiLoading = ()=>{
            dispatch(
                {
                    type : "def",
                    payload: {
                        ...state,
                        gapiLoading: true,
                    } as GapiContextProps
                }
            )
        }

        /**
         * Handles gapiLoad using the reducer.
         */
        const handleGapiLoad = ()=>{

            

            dispatch(
                {
                    type : "def",
                    payload: {
                        ...state,
                        gapiLoading: false,
                        gapiLoaded: true,
                        gapiClientLoading: true, // time to start Gapi client loading
                        //gapi: gapi,
                        //client: gapi.client
                    } as GapiContextProps
                }
            )
        }

        /**
         * Updates authorization status.
         */
         const updateStatus = ()=>{
            if(state.gapiClientLoaded||gapi){ // make sure gapi client has been loaded
                dispatch(
                    {
                        type : "def",
                        payload: {
                            ...state,
                            gapiSigningIn: false, // whenever an update is applied that person is no longer signing in
                            gapiIsAuthorized: gapi.auth2.getAuthInstance().isSignedIn.get()
                        } as GapiContextProps
                    }
                )
            }

        }

        const handleSignInClick = async (event? : React.MouseEvent )=>{

            dispatch(
                {
                    type : "def",
                    payload: {
                        ...state,
                        gapiSigningIn: !gapi.auth2.getAuthInstance().isSignedIn.get(),
                    } as GapiContextProps
                }
            );

            gapi.auth2.getAuthInstance().signIn({
                prompt : "consent"
            });
        
        }
        
        const handleSignOutClick = async (event? : React.MouseEvent)=>{
        
            gapi.auth2.getAuthInstance().signOut();
        
        }

        /**
         * @description Initializes the gapi client.
         */
        const initClient = ()=>{

                // attempt to load gapi client
                gapi.client.init({
                    apiKey: apiKey,
                    clientId: clientId,
                    scope: scopes,
                    prompt : "consent"
                } as any).then(()=>{
                    gapi.auth2.getAuthInstance().isSignedIn.listen(updateStatus);
                    dispatch(
                        {
                            type : "def",
                            payload: {
                                ...state,
                                handleSignInClick: handleSignInClick, // now we set the onClick to the real thing
                                handleSignOutClick: handleSignOutClick,
                                gapiClientLoading: false,
                                gapiClientLoaded: true,
                                gapiAuthorized: gapi.auth2.getAuthInstance().isSignedIn.get(),
                                gapi: window.gapi,
                                client: window.gapi.client
                            } as GapiContextProps
                        }
                    );
                })
          
        }


        /**
         * @description handles client loading
         */
        const loadClient = ()=>{

            try {
                gapi.load('auth2', initClient);
            } catch(e) {
                assignGapiError(e as Error);
            }

        }

        const handleAuthorized = ()=>{
            if(!state.gapiDriversLoaded){
                dispatch(
                    {
                        type : "def",
                        payload: {
                            ...state,
                            gapiDriversLoading: true
                            } as GapiContextProps
                    } 
                 
                )
            }
        }

        /**
         * @description 
         */
        const onDriverLoaded = (driver : GapiDriverI)=>{

            dispatch(
                {
                    type : "def",
                    payload: {
                        ...state,
                        handleSignInClick: handleSignInClick,
                        handleSignOutClick: handleSignOutClick,
                       drivers : {
                           ...state.drivers,
                        [driver.as] : {
                            ...(gapi.client as {[key:string] : any})[driver.name]||(gapi as {[key:string] : any})[driver.name],
                            ...driver,
                            status : "loaded"
                        } 
                       }
                    } as GapiContextProps
                }
            )

        }


        /**
         * @description loads the requested gapiDrivers
         */
        const loadDrivers = async ()=>{

            gapiDrivers.forEach((driver : GapiDriverI)=>{
                if(!state.drivers[driver.as]){
                    if(!driver.version){// assume if no version this is a driver that needs to be loaded by gapi
                        gapi.load(driver.name, ()=>{
                            onDriverLoaded(driver);
                        })
                    }else {
                        gapi.client.load(driver.name, driver.version, ()=>{
                            onDriverLoaded(driver);
                        });
                    }
                } else {

                    if(state.drivers[driver.as].name !== driver.name || state.drivers[driver.as].version !== driver.version){
                        console.warn(`You have already loaded a ${state.drivers[driver.as].name} ${state.drivers[driver.as].version} as ${driver.as}. Consider changing the as property of your driver request.`)
                    }
                }
            })

        }

        const handleDriverLoading = ()=>{
            loadDrivers().then(()=>{
                dispatch(
                    {
                        type : "def",
                        payload: {
                            ...state,
                            gapiDriversLoading: false,
                            gapiDriversLoaded: true
                        } as GapiContextProps
                    }
                )
            })
        }


        /**
         * @description handles gapi provider state befor script load
         * @param state 
         */
        const handleGapiProviderPreScriptLoaded = (state : GapiContextProps)=>{
            acknowledgeGapiLoading();
        }


        /**
         * @description handles gapi provider state when provider is loaded.
         * @param state 
         */
        const handleGapiProviderScriptLoaded = (state : GapiContextProps)=>{

            switch(true) {
                case (state.gapiDriversLoading) : {
                    handleDriverLoading();
                    break;
                }
                case (state.gapiAuthorized) : {
                    handleAuthorized();
                    break;
                }
                case (state.gapiClientLoading) : {
                    loadClient();
                    break;
                }
            }

        }

        /**
         * @description handles GapiProvider rendering when not in error.
         * @param state 
         */
        const handleGapiProviderNotError = (state: GapiContextProps)=>{

            if(state.gapiLoaded) {// if gapi is Loaded, pass to the handler
                handleGapiProviderScriptLoaded(state);
            } else if(!state.gapiLoaded && !state.gapiLoading){ // otherwise check if gapi isn't loaded and the hasn't been set to loading
                handleGapiProviderPreScriptLoaded(state);
            }

        }

        const handleGapiProviderState = (state : GapiContextProps)=>{
            if(state.gapiError){

            } else {
                handleGapiProviderNotError(state);
            }
        }
    
        useEffect(()=>{
            handleGapiProviderState(state);
        })

        return (
            <GapiLoader asyncScriptOnLoad={handleGapiLoad}>
                <GapiContext.Provider value={state}>
                    {children}
                </GapiContext.Provider>
            </GapiLoader>
        )


    }



export const useGapi = () : GapiContextProps  =>{

    const context  = useContext(GapiContext);

    if(!context._inProvider){
        throw new Error("useGapi must be called within a GapiProvider.");
    }

    return context;

}
