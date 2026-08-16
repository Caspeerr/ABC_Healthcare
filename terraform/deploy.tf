resource "aws_s3_bucket" "deploy" {
  bucket_prefix = "${var.project_name}-deploy-"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "deploy" {
  bucket = aws_s3_bucket.deploy.id
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "deploy" {
  bucket = aws_s3_bucket.deploy.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}
