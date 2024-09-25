provider "aws" {
  region = "eu-west-1"
}

<<<<<<< Updated upstream
# Define the Lambda function name
locals {
  lambda_function_name = "express-lambda"
}

# Check if the Lambda function exists
data "aws_lambda_function" "existing_lambda" {
  function_name = local.lambda_function_name
}

# S3 bucket for Lambda deployment
resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "narath-muni-api-bucket-v2"
}

resource "aws_s3_object" "lambda_zip" {
  bucket = aws_s3_bucket.lambda_bucket.bucket
  key    = "app.zip"
  source = "../app.zip"
}

# IAM Role for Lambda execution
resource "aws_iam_role" "lambda_exec_role" {
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
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Create or update the Lambda function
resource "aws_lambda_function" "express_lambda" {
  count = length(data.aws_lambda_function.existing_lambda) == 0 ? 1 : 0

  function_name = local.lambda_function_name
  s3_bucket     = aws_s3_bucket.lambda_bucket.bucket
  s3_key        = aws_s3_object.lambda_zip.key
  handler       = "handler.handler"  # Adjust if necessary
  runtime       = "nodejs20.x"
  role          = aws_iam_role.lambda_exec_role.arn
  memory_size   = 512
  timeout       = 10
}

# Update the existing Lambda function code if it exists
resource "null_resource" "update_lambda_code" {
  count = length(data.aws_lambda_function.existing_lambda) > 0 ? 1 : 0

  provisioner "local-exec" {
    command = "aws lambda update-function-code --function-name ${local.lambda_function_name} --s3-bucket ${aws_s3_bucket.lambda_bucket.bucket} --s3-key ${aws_s3_object.lambda_zip.key} --region eu-west-1"
  }
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "express-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id               = aws_apigatewayv2_api.http_api.id
  integration_type     = "AWS_PROXY"
  integration_uri      = aws_lambda_function.express_lambda[0].arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "lambda_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
=======
# Check and import the existing S3 bucket if it exists
data "aws_s3_bucket" "lambda_bucket" {
  bucket = "narath-muni-api-bucket-v2"
}

# Check and import the existing IAM role if it exists
data "aws_iam_role" "lambda_exec_role" {
  role_name = "lambda_exec_role"
}

# Check for the existing Lambda function
data "aws_lambda_function" "existing_lambda" {
  function_name = "express-lambda"
}

# Define the Lambda function resource
resource "aws_lambda_function" "express_lambda" {
  count = data.aws_lambda_function.existing_lambda ? 0 : 1  # Only create if it doesn't exist
  function_name = "express-lambda"
  handler       = "index.handler"  # Change as per your handler
  runtime       = "nodejs20.x"
  role          = data.aws_iam_role.lambda_exec_role.arn

  s3_bucket     = data.aws_s3_bucket.lambda_bucket.id
  s3_key        = "app.zip"

  # Add any environment variables or other configurations here
}

# Define the API Gateway integration
resource "aws_apigatewayv2_api" "http_api" {
  name                = "express-api"
  protocol_type       = "HTTP"
  route_selection_expression = "$request.method $request.path"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id            = aws_apigatewayv2_api.http_api.id
  integration_type  = "AWS_PROXY"
  integration_uri   = data.aws_lambda_function.existing_lambda.arn  # Reference the existing Lambda ARN
>>>>>>> Stashed changes
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
<<<<<<< Updated upstream
  name        = "$default"
  auto_deploy = true
}

output "api_url" {
  description = "The URL of the API Gateway endpoint"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
=======
  auto_deploy = true
  name        = "$default"
}

# Upload the Lambda function zip file to S3
resource "aws_s3_object" "lambda_zip" {
  bucket = data.aws_s3_bucket.lambda_bucket.id
  key    = "app.zip"
  source = "../app.zip"  # Path to your zip file
}

# IAM Role for the Lambda function
resource "aws_iam_role" "lambda_exec_role" {
  name               = "lambda_exec_role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json
}

data "aws_iam_policy_document" "lambda_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# Attach policies to the IAM role
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
>>>>>>> Stashed changes
}
