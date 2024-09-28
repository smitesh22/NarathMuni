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
  region  = var.region
  #profile = "smitesh"
}

variable "region" {
  description = "The AWS region to deploy the resources"
  type        = string
  default     = "eu-west-1"
}

variable "app_zip" {
  description = "The name of the application zip file"
  type        = string
  default     = "app.zip"
}

variable "lambda_role_name" {
  description = "The IAM role name for the Lambda function"
  type        = string
  default     = "narath_muni_lambda_role"
}

# Create the IAM role for the Lambda function
resource "aws_iam_role" "lambda_role" {
  name               = var.lambda_role_name
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json
}

# Assume role policy for Lambda function
data "aws_iam_policy_document" "lambda_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# Inline policy for the Lambda role
resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.lambda_role_name}_policy"
  description = "Policy for Lambda function to access S3 and CloudWatch logs"
  
  policy = data.aws_iam_policy_document.lambda_policy.json
}

# Policy document for the Lambda function
data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = [
      "*"
    ]
  }
}

# Attach the policy to the IAM role
resource "aws_iam_role_policy_attachment" "lambda_role_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Data source for existing S3 bucket
data "aws_s3_bucket" "existing_bucket" {
  bucket = "narath-muni-v3"
}

# Upload the app.zip file to S3
resource "aws_s3_object" "app_zip" {
  bucket = data.aws_s3_bucket.existing_bucket.id
  key    = "app.zip"
  source = "../app.zip"

  # Ensure that the object is always updated
  lifecycle {
    create_before_destroy = true
  }
}

# Create a new Lambda function
resource "aws_lambda_function" "my_lambda_function" {
  function_name = "narath_muni"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"  # Update with your actual handler
  runtime       = "nodejs20.x"      # Ensure the runtime is set to Node.js 20

  s3_bucket      = data.aws_s3_bucket.existing_bucket.id
  s3_key         = var.app_zip

  source_code_hash = filebase64sha256("../${var.app_zip}")

  environment {
    variables = {
      ENV = "PROD"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Create a new API Gateway
resource "aws_api_gateway_rest_api" "my_api" {
  name        = "Narath-Muni_API"
  description = "API for Narath Muni"
}

# Create the proxy resource for the API Gateway
resource "aws_api_gateway_resource" "proxy_resource" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "{proxy+}"
}

# Define the API Gateway method for the proxy resource
resource "aws_api_gateway_method" "proxy_any" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.proxy_resource.id
  http_method = "ANY"
  authorization = "NONE"
}

# Define the API Gateway integration for the proxy resource
resource "aws_api_gateway_integration" "proxy_lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.my_api.id
  resource_id             = aws_api_gateway_resource.proxy_resource.id
  http_method             = aws_api_gateway_method.proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.my_lambda_function.invoke_arn
}

# Define the Lambda permission for the API Gateway to invoke the Lambda function
resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.my_api.execution_arn}/*"
}

# Deploy the API Gateway
resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [aws_api_gateway_integration.proxy_lambda_integration]
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = "prod"

  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "api_gateway_url" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}/"
}

output "app_zip_uploaded" {
  value = aws_s3_object.app_zip.id != "" ? "${var.app_zip} uploaded successfully to S3." : "Failed to upload ${var.app_zip}."
}
