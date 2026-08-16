output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "alb_dns_name" {
  value = aws_lb.app.dns_name
}

output "ec2_instance_id" {
  value = aws_instance.backend.id
}

output "rds_endpoint" {
  value = aws_db_instance.db.address
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "db_secret_arn" {
  value     = aws_secretsmanager_secret.db.arn
  sensitive = true
}

output "deploy_bucket" {
  value = aws_s3_bucket.deploy.bucket
}
