import React, {FC, ReactElement} from 'react';
import { GapiProvider, useGapi } from './GapiProvider';

export type GapiProviderDemoProps = {}

export const Inner : FC = ()=>{

    const gapi = useGapi();

    console.log(gapi);

    return <div>

    </div>

} 

export const GapiProviderDemo : FC<GapiProviderDemoProps>  = () =>{

    return (

        <GapiProvider
        apiKey={process.env.REACT_APP_GAPI_SECRET as string}
        clientId={process.env.REACT_APP_GAPI_CLIENT_ID as string}
        scopes={"https://www.googleapis.com/auth/documents"}
        gapiDrivers={[
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
        ]}>
            <Inner/>
        </GapiProvider>

    )

}