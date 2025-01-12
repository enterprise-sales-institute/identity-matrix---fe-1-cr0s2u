# Backend configuration for Identity Matrix Platform Infrastructure
# Version: 1.4.x
# Provider: AWS (~> 4.0)
# Purpose: Secure and scalable state management with environment isolation

terraform {
  backend "s3" {
    # S3 bucket for state storage with multi-AZ replication
    bucket = "identitymatrix-terraform-state"
    
    # Dynamic state file path based on workspace/environment
    key = "terraform.tfstate"
    
    # Primary region for state management
    region = "us-west-2"
    
    # Enable state encryption at rest using AES256
    encrypt = true
    
    # DynamoDB table for state locking
    dynamodb_table = "identitymatrix-terraform-locks"
    
    # Environment-specific state isolation
    workspace_key_prefix = "${var.environment}"
    
    # Enable versioning for state history and rollback capability
    versioning = true
    
    # Force SSL/TLS for all operations
    force_ssl = true
    
    # Enable server-side encryption
    server_side_encryption_configuration {
      rule {
        apply_server_side_encryption_by_default {
          sse_algorithm = "AES256"
        }
      }
    }
    
    # Enable access logging for audit trail
    logging {
      target_bucket = "identitymatrix-terraform-logs"
      target_prefix = "state-access-logs/"
    }
    
    # Enable replication for disaster recovery
    replication_configuration {
      role = "arn:aws:iam::ACCOUNT_ID:role/terraform-state-replication"
      rules {
        id     = "state-replication"
        status = "Enabled"
        destination {
          bucket = "arn:aws:s3:::identitymatrix-terraform-state-replica"
          storage_class = "STANDARD_IA"
        }
      }
    }
  }
}