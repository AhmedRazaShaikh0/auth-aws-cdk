import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as apigwv2_integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as apigwAuthorizers from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";

import { Construct } from 'constructs';

export class AuthcdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create separate Cognito user pools for Jack and Peter
    const jackUserPool = new cognito.UserPool(this, "JackUserPool", {
      userPoolName: "JackUserPool",
    });

    const peterUserPool = new cognito.UserPool(this, "PeterUserPool", {
      userPoolName: "PeterUserPool",
    });

    // Table Creation
    const table = new dynamodb.Table(this, "revTable", {
      tableName: 'Reviews',
      partitionKey: { name: "PARTITION_KEY", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SORT_KEY", type: dynamodb.AttributeType.STRING }
    });

    // Http Api Creation
    const httpApi = new apigwv2.HttpApi(this, 'RevApi', {
      apiName: 'rev-api',
      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
        ],
        allowCredentials: false,
        allowOrigins: ["*"],
      },

    });

    //GET Lambda Integration
    const getDataLambda = new lambda.Function(this, 'GetRevLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getdata.handler',
      environment: {
        TABLE_NAME: table.tableName
      }
    })

    //POST Lambda Integration
    const postDataLambda = new lambda.Function(this, 'PostRevLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'postdata.handler',
      environment: {
        TABLE_NAME: table.tableName
      }
    })

    // Creates Cognito authorizers for the API
    const jackAuthorizer = new apigwAuthorizers.HttpUserPoolAuthorizer('JackAuthorizer', jackUserPool);
    const peterAuthorizer = new apigwAuthorizers.HttpUserPoolAuthorizer('PeterAuthorizer', peterUserPool);


    const getLambdaIntegration = new apigwv2_integrations.HttpLambdaIntegration(
      '1',
      getDataLambda
    );
    const postLambdaIntegration = new apigwv2_integrations.HttpLambdaIntegration(
      '2',
      postDataLambda
    );

    //Adding Route for GET Request
    httpApi.addRoutes({
      path: '/getjack',
      methods: [apigwv2.HttpMethod.GET],
      integration: getLambdaIntegration,
      authorizer: jackAuthorizer,
    });
    httpApi.addRoutes({
      path: '/getpeter',
      methods: [apigwv2.HttpMethod.GET],
      integration: getLambdaIntegration,
      authorizer: peterAuthorizer,
    });

    //Adding Route for POST Request
    httpApi.addRoutes({
      path: '/postjack',
      methods: [apigwv2.HttpMethod.POST],
      integration: postLambdaIntegration,
      authorizer: jackAuthorizer,
    });
    httpApi.addRoutes({
      path: '/postpeter',
      methods: [apigwv2.HttpMethod.POST],
      integration: postLambdaIntegration,
      authorizer: peterAuthorizer,
    });

    // Grant Lambda function access to the DynamoDB table
    table.grantFullAccess(getDataLambda)
    table.grantFullAccess(postDataLambda)
  }

}
