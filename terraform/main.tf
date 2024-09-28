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

# Create the bucket if it does not exist
resource "aws_s3_bucket" "new_bucket" {
  count  = length(data.aws_s3_bucket.existing_bucket.id) == 0 ? 1 : 0
  bucket = "narath-muni-v3"
}

# Upload the app.zip file to S3
resource "aws_s3_bucket_object" "app_zip" {
  bucket = length(data.aws_s3_bucket.existing_bucket.id) > 0 ? data.aws_s3_bucket.existing_bucket.id : aws_s3_bucket.new_bucket[0].id
  key    = "app.zip"          # This is the name that will be used in the bucket
  source = "../app.zip"       # Path to your local app.zip file
  acl    = "private"          # Set the access control list
}

output "bucket_exists" {
  value = length(data.aws_s3_bucket.existing_bucket.id) > 0 ? "Bucket exists" : "Bucket created"
}

# Create the IAM role
resource "aws_iam_role" "new_role" {
  name  = "narath_muni_lambda_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

output "role_exists" {
  value = "Role created"
}

# Create the IAM policy
resource "aws_iam_policy" "new_policy" {
  name        = "narath_muni_lambda_policy"
  description = "IAM policy for Narath Muni Lambda functions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:*",
          "s3:*",
          "lambda:*"
        ]
        Resource = "*"
      }
    ]
  })
}

output "policy_exists" {
  value = "Policy created"
}

# Create the Lambda function
resource "aws_lambda_function" "my_lambda_function" {
  function_name = "narath_muni"
  role          = aws_iam_role.new_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  s3_bucket      = length(data.aws_s3_bucket.existing_bucket.id) > 0 ? data.aws_s3_bucket.existing_bucket.id : aws_s3_bucket.new_bucket[0].id
  s3_key         = aws_s3_bucket_object.app_zip.key  # Use the uploaded app.zip key

  source_code_hash = filebase64sha256("../app.zip")

  environment {
    variables = {
      ENV = "PROD"
    }
  }

  lifecycle {
    prevent_destroy = false
  }
}

# API Gateway resources
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
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"

  lifecycle {
    create_before_destroy = false
  }
}

output "api_gateway_url" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}/"
}

output "app_zip_uploaded" {
  value = aws_s3_bucket_object.app_zip.id != "" ? "app.zip uploaded" : "Failed to upload app.zip"
}
