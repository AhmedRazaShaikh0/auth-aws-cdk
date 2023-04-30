const AWSS = require('aws-sdk');
const { DynamoDB } = AWSS;
const docClient = new DynamoDB.DocumentClient();
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";


export async function handler(event: any) {
    console.log("Event: ", JSON.stringify(event));
    
    const PARTITION_KEY = event.requestContext.authorizer?.jwt.claims["username"];
    // const PARTITION_KEY = event.requestContext.authorizer?.claims["cognito:username"];
    console.log("PARTITION_KEY: ", PARTITION_KEY);


    if (!PARTITION_KEY) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized" }),
        };
    }

    switch (event.requestContext.http.method) {
        case "POST":
            return submitReview(event, PARTITION_KEY);
        default:
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid request" }),
            };
    }
}
async function submitReview(event: APIGatewayProxyEventV2, PARTITION_KEY: string): Promise<APIGatewayProxyResultV2> {
    const requestBody = JSON.parse(event.body || "{}");
    const SORT_KEY = requestBody.SORT_KEY;
    const firstName = requestBody.firstName;
    const lastName = requestBody.lastName;
    const Age = requestBody.Age;
    const Gender = requestBody.Gender;

    const params = {
        TableName: 'Reviews',
        Item: {
            PARTITION_KEY: PARTITION_KEY,
            SORT_KEY: SORT_KEY,
            firstName: firstName,
            lastName: lastName,
            Age: Age,
            Gender: Gender,
        },
    };

    try {
        await docClient.put(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data saved successfully' })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred while saving the data' })
        };
    }
};
