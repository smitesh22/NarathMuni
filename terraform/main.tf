provider "aws" {
  region = "eu-west-1"
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "narath-muni-api-bucket-v2"
}

resource "aws_s3_object" "lambda_zip" {
  bucket = aws_s3_bucket.lambda_bucket.bucket
  key    = "app.zip"
  source = "../app.zip"
}

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

resource "aws_lambda_function" "express_lambda" {
  function_name = "express-lambda"
  s3_bucket     = aws_s3_bucket.lambda_bucket.bucket
  s3_key        = aws_s3_object.lambda_zip.key
  handler       = "handler.handler"  # Adjust if necessary
  runtime       = "nodejs20.x"
  role          = aws_iam_role.lambda_exec_role.arn
  memory_size   = 512
  timeout       = 10
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "express-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id               = aws_apigatewayv2_api.http_api.id
  integration_type     = "AWS_PROXY"
  integration_uri      = aws_lambda_function.express_lambda.arn
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
