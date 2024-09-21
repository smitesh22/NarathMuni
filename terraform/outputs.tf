output "api_url" {
  description = "The URL of the API Gateway endpoint"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}