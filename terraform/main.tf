terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

# Data source for existing S3 bucket
data "aws_s3_bucket" "existing_bucket" {
  bucket = "narath-muni-v3"
}

# Data source for existing IAM Role
data "aws_iam_role" "existing_role" {
  name = "narath_muni_lambda_role"
}

# Data source for existing IAM Policy
data "aws_iam_policy" "existing_policy" {
  name = "narath_muni_lambda_policy"
}

# Data source for existing Lambda function
data "aws_lambda_function" "existing_lambda" {
  function_name = "narath_muni"  # The name of your existing Lambda function
}

# Use specific ID for the existing API Gateway
data "aws_api_gateway_rest_api" "existing_api" {
  # Use the specific ID to avoid multiple matches
  rest_api_id = "90dazif98g"
}

# Data source for existing API Gateway Resources
data "aws_api_gateway_resource" "root_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.existing_api.id
  path        = "/"  # Use 'path' for the root resource
}

data "aws_api_gateway_resource" "proxy_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.existing_api.id
  path        = "{proxy+}"
}

# Upload the app.zip file to S3
resource "aws_s3_object" "app_zip" {
  bucket = "narath-muni-v3"
  key    = "app.zip"          # This is the name that will be used in the bucket
  source = "../app.zip"       # Path to your local app.zip file
  acl    = "private"          # Set the access control list
}

# Update the existing Lambda function
resource "aws_lambda_function" "my_lambda_function" {
  function_name = data.aws_lambda_function.existing_lambda.function_name
  role          = data.aws_iam_role.existing_role.arn
  handler       = data.aws_lambda_function.existing_lambda.handler
  runtime       = data.aws_lambda_function.existing_lambda.runtime

  s3_bucket      = "narath-muni-v3"
  s3_key         = "app.zip" # Use the uploaded app.zip ID

  source_code_hash = filebase64sha256("../app.zip")

  environment {
    variables = {
      ENV = "PROD"
    }
  }

  lifecycle {
    create_before_destroy = true  # Allows update without needing to destroy
  }
}

# API Gateway integration for the proxy resource
resource "aws_api_gateway_method" "proxy_any" {
  rest_api_id   = data.aws_api_gateway_rest_api.existing_api.id
  resource_id   = data.aws_api_gateway_resource.proxy_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy_lambda_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.existing_api.id
  resource_id             = data.aws_api_gateway_resource.proxy_resource.id
  http_method             = aws_api_gateway_method.proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.my_lambda_function.invoke_arn
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [aws_api_gateway_integration.proxy_lambda_integration]
  rest_api_id = data.aws_api_gateway_rest_api.existing_api.id
  stage_name  = "prod"

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.existing_api.execution_arn}/*"

  lifecycle {
    create_before_destroy = false
  }
}

output "api_gateway_url" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}/"
}

output "app_zip_uploaded" {
  value = aws_s3_object.app_zip.id != "" ? "app.zip uploaded" : "Failed to upload app.zip"
}
