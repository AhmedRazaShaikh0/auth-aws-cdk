#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthcdkStack } from '../lib/authcdk-stack';

const app = new cdk.App();
new AuthcdkStack(app, 'AuthcdkStack');
