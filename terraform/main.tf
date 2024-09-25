provider "aws" {
  region = "eu-west-1"
}

# Define the Lambda function name
locals {
  lambda_function_name = "express-lambda"
}

# Check if the Lambda function exists
data "aws_lambda_function" "existing_lambda" {
  function_name = local.lambda_function_name
}

# Check if the S3 bucket exists
data "aws_s3_bucket" "existing_bucket" {
  bucket = "narath-muni-api-bucket-v2"
}

# S3 bucket for Lambda deployment
resource "aws_s3_bucket" "lambda_bucket" {
  count = length(data.aws_s3_bucket.existing_bucket) == 0 ? 1 : 0

  bucket = "narath-muni-api-bucket-v2"

  # Add lifecycle policy to prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }
}

# S3 object for the Lambda deployment package
resource "aws_s3_object" "lambda_zip" {
  bucket = aws_s3_bucket.lambda_bucket[0].bucket
  key    = "app.zip"
  source = "../app.zip"
}

# Check if the IAM role exists
data "aws_iam_role" "existing_role" {
  name = "lambda_exec_role"
}

# IAM Role for Lambda execution
resource "aws_iam_role" "lambda_exec_role" {
  count = length(data.aws_iam_role.existing_role) == 0 ? 1 : 0

  name = "lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  count = length(data.aws_iam_role.existing_role) > 0 ? 1 : 0

  role       = aws_iam_role.lambda_exec_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Create or update the Lambda function
resource "aws_lambda_function" "express_lambda" {
  count = length(data.aws_lambda_function.existing_lambda) == 0 ? 1 : 0

  function_name = local.lambda_function_name
  s3_bucket     = aws_s3_bucket.lambda_bucket[0].bucket
  s3_key        = aws_s3_object.lambda_zip.key
  handler       = "handler.handler"  # Adjust if necessary
  runtime       = "nodejs20.x"
  role          = length(data.aws_iam_role.existing_role) > 0 ? data.aws_iam_role.existing_role.arn : aws_iam_role.lambda_exec_role[0].arn
  memory_size   = 512
  timeout       = 10
}

# Update the existing Lambda function code if it exists
resource "null_resource" "update_lambda_code" {
  count = length(data.aws_lambda_function.existing_lambda) > 0 ? 1 : 0

  provisioner "local-exec" {
    command = "aws lambda update-function-code --function-name ${local.lambda_function_name} --s3-bucket ${aws_s3_bucket.lambda_bucket[0].bucket} --s3-key ${aws_s3_object.lambda_zip.key} --region eu-west-1"
  }
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "express-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id               = aws_apigatewayv2_api.http_api.id
  integration_type     = "AWS_PROXY"
  integration_uri      = length(data.aws_lambda_function.existing_lambda) > 0 ? data.aws_lambda_function.existing_lambda.arn : aws_lambda_function.express_lambda[0].arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "lambda_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

output "api_url" {
  description = "The URL of the API Gateway endpoint"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}
