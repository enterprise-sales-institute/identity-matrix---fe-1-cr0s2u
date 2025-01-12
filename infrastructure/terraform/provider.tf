# Configure Terraform version and required providers
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Configure AWS Provider with secure defaults and environment-specific settings
provider "aws" {
  region = var.region

  # Default tags applied to all resources
  default_tags {
    tags = {
      Project     = "identity-matrix"
      Environment = var.environment
      ManagedBy   = "terraform"
      CreatedAt   = timestamp()
      Repository  = "github.com/identity-matrix/infrastructure"
    }
  }

  # Security best practices
  default_tags {
    tags = {
      SecurityCompliance = "soc2"
      DataClassification = "confidential"
      BackupEnabled     = "true"
    }
  }

  # Enhanced security configurations
  assume_role {
    role_arn = "arn:aws:iam::${var.allowed_account_ids[0]}:role/TerraformDeploymentRole"
    session_name = "TerraformDeployment-${var.environment}"
    external_id = "identity-matrix-${var.environment}"
  }

  # Restrict to specific account IDs for security
  allowed_account_ids = var.allowed_account_ids

  # Additional provider configurations
  endpoints {
    dynamodb = "dynamodb.${var.region}.amazonaws.com"
    s3       = "s3.${var.region}.amazonaws.com"
    ec2      = "ec2.${var.region}.amazonaws.com"
    rds      = "rds.${var.region}.amazonaws.com"
    eks      = "eks.${var.region}.amazonaws.com"
  }
}

# Configure additional provider for disaster recovery region if needed
provider "aws" {
  alias  = "dr"
  region = "us-east-1" # Secondary region for disaster recovery

  # Inherit default tags
  default_tags {
    tags = {
      Project     = "identity-matrix"
      Environment = "${var.environment}-dr"
      ManagedBy   = "terraform"
      CreatedAt   = timestamp()
      Repository  = "github.com/identity-matrix/infrastructure"
    }
  }

  assume_role {
    role_arn = "arn:aws:iam::${var.allowed_account_ids[0]}:role/TerraformDeploymentRole"
    session_name = "TerraformDeployment-${var.environment}-dr"
    external_id = "identity-matrix-${var.environment}-dr"
  }

  allowed_account_ids = var.allowed_account_ids
}

# Configure provider features
provider "aws" {
  alias = "shared"
  region = var.region

  # Shared services configuration
  default_tags {
    tags = {
      Project     = "identity-matrix"
      Environment = "shared"
      ManagedBy   = "terraform"
      CreatedAt   = timestamp()
      Repository  = "github.com/identity-matrix/infrastructure"
    }
  }

  assume_role {
    role_arn = "arn:aws:iam::${var.allowed_account_ids[1]}:role/TerraformSharedServicesRole"
    session_name = "TerraformDeployment-shared"
    external_id = "identity-matrix-shared"
  }

  allowed_account_ids = var.allowed_account_ids
}