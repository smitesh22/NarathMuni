terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Use a recent version
    }
  }

  required_version = ">= 1.0"
}

provider "aws" {
  region = var.region
}

variable "region" {
  description = "The AWS region to deploy the resources"
  type        = string
  default     = "eu-west-1"
}

# Data sources for existing resources
data "aws_s3_bucket" "lambda_bucket" {
  bucket = "narath-muni-v3" # Use the name of your existing bucket
}

data "aws_iam_role" "lambda_role" {
  name = "narath_muni_lambda_role" # Use the name of your existing IAM role
}

data "aws_iam_policy" "lambda_policy" {
  arn = "arn:aws:iam::590183816897:policy/narath_muni_lambda_policy" # Use the correct ARN of your IAM policy
}

# Use the data sources in your Lambda function configuration
resource "aws_lambda_function" "my_lambda_function" {
  function_name = "narath_muni"
  role          = data.aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  s3_bucket      = data.aws_s3_bucket.lambda_bucket.id
  s3_key         = "app.zip"  # Ensure this matches your object key in S3

  source_code_hash = filebase64sha256("../app.zip") # Ensure the zip file path is correct

  environment {
    variables = {
      ENV = "PROD"
    }
  }
}

resource "aws_api_gateway_rest_api" "api" {
  name        = "Narath-Muni_API"
  description = "API Gateway for my Node.js server"
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "any_method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.any_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.my_lambda_function.invoke_arn
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [aws_api_gateway_integration.lambda_integration]
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "prod"
}

resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

output "api_gateway_url" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}/"
}
