const AWS = require('aws-sdk');
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
const dynamodb = new AWS.DynamoDB.DocumentClient();


export async function handler(event: any) {
    const PARTITION_KEY = event.requestContext.authorizer?.jwt.claims["username"];

    if (!PARTITION_KEY) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized" }),
        };
    }

    switch (event.requestContext.http.method) {
        case "GET":
            return getReviews(PARTITION_KEY);
        default:
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid request" }),
            };
    }
}

async function getReviews(PARTITION_KEY: string): Promise<APIGatewayProxyResultV2> {

    const params = {
        TableName: 'Reviews',
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
            '#pk': 'PARTITION_KEY',
        },
        ExpressionAttributeValues: {
            ':pk': PARTITION_KEY,
        }
    };

    try {
        const Item = await dynamodb.query(params).promise();
        console.log('from item', Item)
        return Item.Items;

    } catch (error) {
        console.error(error);
        // Return an error response if something went wrong
        const response = {
            statusCode: 500,
            body: JSON.stringify({ error: 'Faced Error' }),
        };
        return response;
    }
}
