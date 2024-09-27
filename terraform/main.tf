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
  region  = var.region
}

variable "region" {
  description = "The AWS region to deploy the resources"
  type        = string
  default     = "eu-west-1"
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "narath-muni-v3"

  tags = {
    Name        = "narath-muni-api"
    Environment = "prod"
  }
}

resource "aws_s3_bucket_object" "lambda_code" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "app.zip"
  source = "../app.zip"  # Path to your local zip file
}

data "aws_iam_role" "lambda_role" {
  name = "narath_muni_lambda_role"
}

data "aws_iam_policy" "lambda_policy" {
  arn = "arn:aws:iam::your-account-id:policy/narath_muni_lambda_policy"
}

data "aws_lambda_function" "my_lambda_function" {
  function_name = "narath_muni"  # Use the existing Lambda function's name
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
  uri                     = data.aws_lambda_function.my_lambda_function.invoke_arn  # Reference the existing function
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [aws_api_gateway_integration.lambda_integration]
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "prod"
}

resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.my_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

output "api_gateway_url" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}/"
}
