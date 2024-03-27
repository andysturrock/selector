#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {LambdaStack} from '../lib/lambda-stack';
import {getEnv} from '../lib/common';
import {SecretsManagerStack} from '../lib/secretsmanager-stack';

const lambdaVersion = getEnv('LAMBDA_VERSION', false)!;
const customDomainName = getEnv('CUSTOM_DOMAIN_NAME', false)!;
const route53ZoneId = getEnv('R53_ZONE_ID', false)!;
const selectorDomainName = `selector.${customDomainName}`;

const app = new cdk.App();

const region = 'eu-west-2';


const secretsManagerStack = new SecretsManagerStack(app, 'SelectorSecretsManagerStack', {
  env: {region},
  customDomainName,
});

new LambdaStack(app, 'SelectorLambdaStack', {
  env: {region},
  selectorSecret: secretsManagerStack.selectorSecret,
  lambdaVersion,
  customDomainName,
  selectorDomainName,
  route53ZoneId
});

