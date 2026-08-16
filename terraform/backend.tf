terraform {
  backend "s3" {
    bucket = "abc-healthcare-sambrid-tfstate"
    key    = "abc-healthcare/terraform.tfstate"
    region = "ap-south-1"
  }
}
