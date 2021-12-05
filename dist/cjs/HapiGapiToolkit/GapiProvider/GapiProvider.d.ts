/// <reference types="gapi" />
/// <reference types="gapi.auth2" />
import hoistNonReactStatics from "hoist-non-react-statics";
import React, { ComponentType, FC } from "react";
export interface GapiDriverI {
    name: string;
    version?: string;
    status: "loading" | "loaded" | "error";
    as: string;
    [key: string]: any;
}
export interface GapiContextProps {
    gapi: typeof gapi | undefined;
    client: (typeof gapi)["client"] | undefined;
    gapiDriversRequested: {
        [key: string]: string;
    };
    gapiError: Error | undefined;
    gapiLoading: boolean;
    gapiLoaded: boolean;
    gapiClientLoading: boolean;
    gapiClientLoaded: boolean;
    gapiSigningIn: boolean;
    gapiAuthorized: boolean;
    gapiDriversLoading: boolean;
    gapiDriversLoaded: boolean;
    _inProvider: boolean;
    handleSignInClick: (e: React.MouseEvent) => Promise<void>;
    handleSignOutClick: (e: React.MouseEvent) => Promise<void>;
    subscribe: (onChange: () => void) => void;
    drivers: {
        [key: string]: GapiDriverI;
    };
}
interface LoaderInternals {
    asyncScriptOnLoad?: () => void;
}
declare type Loader = FC<hoistNonReactStatics.NonReactStatics<ComponentType<any>> & LoaderInternals>;
export declare const GapiLoader: Loader;
export interface GapiProviderProps {
    apiKey: string;
    clientId: string;
    scopes: string;
    gapiDrivers: GapiDriverI[];
}
export declare const GapiProvider: FC<GapiProviderProps>;
export declare const useGapi: () => GapiContextProps;
export {};
