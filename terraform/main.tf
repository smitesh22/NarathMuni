terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "narath-muni-v3"
    key            = "terraform/state/${var.env}/terraform.tfstate"
    region         = var.region
    encrypt        = true
  }

  required_version = ">= 1.0"
}

provider "aws" {
  region = var.region
}

variable "region" {
  type    = string
  default = "eu-west-1"
}

variable "lambda_role_name" {
  type        = string
  description = "Lambda IAM Role Name"
}

variable "lambda_function_name" {
  type        = string
  description = "Lambda Function Name"
}

variable "api_gateway_name" {
  type        = string
  description = "API Gateway Name"
}

variable "app_zip" {
  type        = string
  description = "App zip file name"
}

variable "env" {
  type    = string
  default = "dev"
}
# Modify SSM Parameter names based on uppercase environment
data "aws_ssm_parameter" "access_key_id" {
  name = "/lambda/${upper(var.env)}/ACCESS_KEY_ID"
}

data "aws_ssm_parameter" "database_url" {
  name = "/lambda/${upper(var.env)}/DATABASE_URL"
}

data "aws_ssm_parameter" "email" {
  name = "/lambda/${upper(var.env)}/EMAIL"
}

data "aws_ssm_parameter" "email_host" {
  name = "/lambda/${upper(var.env)}/EMAIL_HOST"
}

data "aws_ssm_parameter" "env" {
  name = "/lambda/${upper(var.env)}/ENV"
}

data "aws_ssm_parameter" "google_client_id" {
  name = "/lambda/${upper(var.env)}/GOOGLE_CLIENT_ID"
}

data "aws_ssm_parameter" "google_client_secret" {
  name = "/lambda/${upper(var.env)}/GOOGLE_CLIENT_SECRET"
}

data "aws_ssm_parameter" "jwt_secret" {
  name = "/lambda/${upper(var.env)}/JWT_SECRET"
}

data "aws_ssm_parameter" "openai_api_key" {
  name = "/lambda/${upper(var.env)}/OPENAI_API_KEY"
}

data "aws_ssm_parameter" "password" {
  name = "/lambda/${upper(var.env)}/PASSWORD"
}

data "aws_ssm_parameter" "s3_bucket_name" {
  name = "/lambda/${upper(var.env)}/S3_BUCKET_NAME"
}

data "aws_ssm_parameter" "secret_access_key" {
  name = "/lambda/${upper(var.env)}/SECRET_ACCESS_KEY"
}

data "aws_ssm_parameter" "stripe_key" {
  name = "/lambda/${upper(var.env)}/STRIPE_KEY"
}

data "aws_ssm_parameter" "stripe_priceid_monthly" {
  name = "/lambda/${upper(var.env)}/STRIPE_PRICEID_MONTHLY"
}

data "aws_ssm_parameter" "stripe_priceid_yearly" {
  name = "/lambda/${upper(var.env)}/STRIPE_PRICEID_YEARLY"
}

# Lambda Role and Permissions
resource "aws_iam_role" "lambda_role" {
  name               = var.lambda_role_name
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

resource "aws_iam_policy" "lambda_policy" {
  name   = "${var.lambda_role_name}_policy"
  policy = data.aws_iam_policy_document.lambda_policy.json
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy_attachment" "lambda_role_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# S3 for Lambda Deployment
data "aws_s3_bucket" "existing_bucket" {
  bucket = "narath-muni-v3"
}

resource "aws_s3_object" "app_zip" {
  bucket = data.aws_s3_bucket.existing_bucket.bucket
  key    = "app.zip"
  source = "../app.zip"
  etag   = filemd5("../app.zip")
}

# Lambda Function (without overwriting env vars)
resource "aws_lambda_function" "my_lambda_function" {
  function_name    = var.lambda_function_name
  role             = aws_iam_role.lambda_role.arn
  handler          = "dist/index.handler"
  runtime          = "nodejs20.x"
  s3_bucket        = data.aws_s3_bucket.existing_bucket.bucket
  s3_key           = aws_s3_object.app_zip.key
  source_code_hash = filebase64sha256("../app.zip")
  timeout          = 30
  memory_size      = 1024

  environment {
    variables = {
      ACCESS_KEY_ID        = data.aws_ssm_parameter.access_key_id.value
      DATABASE_URL         = data.aws_ssm_parameter.database_url.value
      EMAIL                = data.aws_ssm_parameter.email.value
      EMAIL_HOST           = data.aws_ssm_parameter.email_host.value
      ENV                  = data.aws_ssm_parameter.env.value
      GOOGLE_CLIENT_ID     = data.aws_ssm_parameter.google_client_id.value
      GOOGLE_CLIENT_SECRET = data.aws_ssm_parameter.google_client_secret.value
      JWT_SECRET           = data.aws_ssm_parameter.jwt_secret.value
      OPENAI_API_KEY       = data.aws_ssm_parameter.openai_api_key.value
      PASSWORD             = data.aws_ssm_parameter.password.value
      S3_BUCKET_NAME       = data.aws_ssm_parameter.s3_bucket_name.value
      SECRET_ACCESS_KEY    = data.aws_ssm_parameter.secret_access_key.value
      STRIPE_KEY           = data.aws_ssm_parameter.stripe_key.value
      STRIPE_PRICEID_MONTHLY = data.aws_ssm_parameter.stripe_priceid_monthly.value
      STRIPE_PRICEID_YEARLY  = data.aws_ssm_parameter.stripe_priceid_yearly.value
    }
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "my_api" {
  name = var.api_gateway_name
  binary_media_types = [
    "image/jpeg",
    "image/png",
    "application/octet-stream",
    "multipart/form-data",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip"
  ]
}

resource "aws_api_gateway_resource" "proxy_resource" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.proxy_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy_lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.my_api.id
  resource_id             = aws_api_gateway_resource.proxy_resource.id
  http_method             = aws_api_gateway_method.proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.my_lambda_function.invoke_arn
  content_handling        = "CONVERT_TO_BINARY"
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on  = [aws_api_gateway_integration.proxy_lambda_integration]
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = var.env
}

resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.my_api.execution_arn}/*"
}

# DynamoDB for Terraform State Locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "terraform-locks-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

output "api_gateway_url" {
  value = "https://${aws_api_gateway_rest_api.my_api.id}.execute-api.${var.region}.amazonaws.com/${var.env}/"
}
