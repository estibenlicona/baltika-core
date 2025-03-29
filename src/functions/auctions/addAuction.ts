import { APIGatewayEvent } from "aws-lambda";
import { Amplify } from 'aws-amplify';
import { events } from 'aws-amplify/data';
import { headersConfig } from "../../config/headers";

export async function handler(event: APIGatewayEvent) {
    try {
        Amplify.configure({
            API: {
                Events: {
                    endpoint: "https://ksazrbsv3nb2djpelmb3g5vwna.appsync-api.us-east-1.amazonaws.com/event",
                    region: "us-east-1",
                    defaultAuthMode: "apiKey",
                    apiKey: "da2-hjodummkqndpdbynjpbebwkkim"
                }
            }
        });

        await events.post('/default/channel', { some: 'data' });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Puja creada correctamente." }),
        };

    } catch (error) {
        console.error('Error saving contract offer:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred while creating the contract offer.' }),
        };
    }


}