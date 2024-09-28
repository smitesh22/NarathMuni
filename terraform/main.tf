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
data "aws_s3_bucket" "existing_bucket" {
  bucket = "narath-muni-v3" # Use the name of your existing bucket
}

# Create the bucket if it does not exist
resource "aws_s3_bucket" "new_bucket" {
  count  = length(data.aws_s3_bucket.existing_bucket.id) == 0 ? 1 : 0
  bucket = "narath-muni-v3"
  
  # Add additional configurations as needed
}

output "bucket_exists" {
  value = length(data.aws_s3_bucket.existing_bucket.id) > 0 ? "Bucket exists" : "Bucket created"
}

# Attempt to find the existing IAM role
data "aws_iam_role" "existing_role" {
  count = length(aws_iam_role.new_role) == 0 ? 1 : 0 # Check if new_role is not created
  name  = "narath_muni_lambda_role"
}

# Create the IAM role if it does not exist
resource "aws_iam_role" "new_role" {
  count = length(data.aws_iam_role.existing_role) == 0 ? 1 : 0
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

  # Add other configurations as needed
}

output "role_exists" {
  value = length(data.aws_iam_role.existing_role) > 0 ? "Role exists" : "Role created"
}

# Attempt to find the existing IAM policy
data "aws_iam_policy" "existing_policy" {
  count = length(aws_iam_policy.new_policy) == 0 ? 1 : 0 # Check if new_policy is not created
  arn   = "arn:aws:iam::590183816897:policy/narath_muni_lambda_policy" # Use the correct ARN of your IAM policy
}

# Create the IAM policy if it does not exist
resource "aws_iam_policy" "new_policy" {
  count = length(data.aws_iam_policy.existing_policy) == 0 ? 1 : 0
  name  = "narath_muni_lambda_policy"
  
  description = "IAM policy for Narath Muni Lambda functions"
  
  # Define the policy document here
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:*",
          "s3:*", # Adjust the actions as per your requirements
          "lambda:*"
        ]
        Resource = "*"
      }
    ]
  })
}

output "policy_exists" {
  value = length(data.aws_iam_policy.existing_policy) > 0 ? "Policy exists" : "Policy created"
}

# Use the data sources in your Lambda function configuration
resource "aws_lambda_function" "my_lambda_function" {
  function_name = "narath_muni"
  role          = length(data.aws_iam_role.existing_role) > 0 ? data.aws_iam_role.existing_role[0].arn : aws_iam_role.new_role[0].arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  s3_bucket      = length(data.aws_s3_bucket.existing_bucket.id) > 0 ? data.aws_s3_bucket.existing_bucket.id : aws_s3_bucket.new_bucket[0].id
  s3_key         = "app.zip" 

  source_code_hash = filebase64sha256("../app.zip") 

  environment {
    variables = {
      ENV = "PROD"
    }
  }

  lifecycle {
    prevent_destroy = false # Allows the function to be updated
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
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"

  lifecycle {
    create_before_destroy = false
  }
}

output "api_gateway_url" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}/"
}
