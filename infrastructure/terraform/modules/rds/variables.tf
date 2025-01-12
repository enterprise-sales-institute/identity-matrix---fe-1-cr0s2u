# Environment configuration
variable "environment" {
  description = "Environment name for resource tagging and naming (dev, staging, prod)"
  type        = string
  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

# Network configuration
variable "vpc_id" {
  description = "ID of the VPC where RDS instances will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS multi-AZ deployment"
  type        = list(string)
}

# Instance configuration
variable "instance_class" {
  description = "RDS instance class for PostgreSQL (minimum db.t3.large for production)"
  type        = string
  default     = "db.t3.large"
}

variable "engine_version" {
  description = "PostgreSQL engine version (14.x required)"
  type        = string
  default     = "14.7"
}

# Storage configuration
variable "allocated_storage" {
  description = "Initial allocated storage size in GB for RDS instance"
  type        = number
  default     = 100
  validation {
    condition     = var.allocated_storage >= 100
    error_message = "Minimum storage size must be 100GB or larger"
  }
}

variable "max_allocated_storage" {
  description = "Maximum storage size in GB for RDS autoscaling"
  type        = number
  default     = 500
  validation {
    condition     = var.max_allocated_storage >= var.allocated_storage
    error_message = "Maximum storage must be greater than or equal to allocated storage"
  }
}

# High availability configuration
variable "multi_az" {
  description = "Enable Multi-AZ deployment for high availability (required for production)"
  type        = bool
  default     = true
}

# Backup configuration
variable "backup_retention_period" {
  description = "Number of days to retain automated backups (minimum 30 days for compliance)"
  type        = number
  default     = 30
  validation {
    condition     = var.backup_retention_period >= 30
    error_message = "Backup retention period must be at least 30 days"
  }
}

variable "backup_window" {
  description = "Preferred backup window in UTC (must be during off-peak hours)"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window in UTC (must be during off-peak hours)"
  type        = string
  default     = "Mon:04:00-Mon:05:00"
}

# Database configuration
variable "db_name" {
  description = "Name of the default PostgreSQL database to create"
  type        = string
  default     = "identity_matrix"
}

variable "db_username" {
  description = "Username for the RDS master user"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Password for RDS master user (must be at least 16 characters with special chars)"
  type        = string
  sensitive   = true
  validation {
    condition     = can(regex("^[A-Za-z0-9\\W]{16,}$", var.db_password))
    error_message = "Password must be at least 16 characters long"
  }
}

# Security configuration
variable "storage_encrypted" {
  description = "Enable storage encryption using KMS (required for security compliance)"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection for RDS instances"
  type        = bool
  default     = true
}