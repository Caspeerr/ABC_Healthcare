resource "aws_instance" "backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnet.ec2.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  associate_public_ip_address = true

  root_block_device {
    encrypted   = true
    volume_type = "gp3"
    volume_size = 8
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    secret_arn      = aws_secretsmanager_secret.db.arn
    api_auth_arn    = aws_secretsmanager_secret.api_auth.arn
    region          = var.aws_region
    db_host         = aws_db_instance.db.address
    frontend_url    = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  })

  tags = {
    Name = "${var.project_name}-backend"
  }
  
}

