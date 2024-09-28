terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "narath-muni-v3"
    key            = "terraform/state/app/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"  # Optional for state locking
  }

  required_version = ">= 1.0"
}

provider "aws" {
  region  = var.region
}

variable "region" {
  type    = string
  default = "eu-west-1"
}

variable "app_zip" {
  type    = string
  default = "app.zip"
}

variable "lambda_role_name" {
  type    = string
  default = "narath_muni_lambda_role"
}

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
  name        = "${var.lambda_role_name}_policy"
  policy      = data.aws_iam_policy_document.lambda_policy.json
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

data "aws_s3_bucket" "existing_bucket" {
  bucket = "narath-muni-v3"
}

resource "aws_s3_object" "app_zip" {
  bucket = data.aws_s3_bucket.existing_bucket.id
  key    = var.app_zip
  source = "../app.zip"
}

resource "aws_lambda_function" "my_lambda_function" {
  function_name    = "narath_muni"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  s3_bucket        = data.aws_s3_bucket.existing_bucket.id
  s3_key           = aws_s3_object.app_zip.key
  source_code_hash = filebase64sha256("../app.zip")

  environment {
    variables = {
      ENV = "PROD"
    }
  }
}

resource "aws_api_gateway_rest_api" "my_api" {
  name = "Narath-Muni_API"
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [aws_api_gateway_integration.proxy_lambda_integration]
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = "prod"
}

output "api_gateway_url" {
  value = "${aws_api_gateway_rest_api.my_api.execution_arn}/prod/"
}

output "app_zip_uploaded" {
  value = "${var.app_zip} uploaded successfully to S3."
}
