variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "abc-healthcare"
}

variable "vpc_id" {
  type        = string
  description = "ID of the existing default VPC to deploy into. Set in a local, gitignored terraform.tfvars — see terraform.tfvars.example."
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnet IDs (across AZs) used by the ALB and RDS subnet group. Set in a local, gitignored terraform.tfvars."
}

variable "ec2_subnet_id" {
  type        = string
  description = "Subnet ID the backend EC2 instance launches into. Set in a local, gitignored terraform.tfvars."
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "db_name" {
  type    = string
  default = "abc_healthcare"
}

variable "db_username" {
  type    = string
  default = "abcadmin"
}
