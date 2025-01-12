variable "environment" {
  type        = string
  description = "Environment name for resource naming and tagging"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "instance_count" {
  type        = number
  description = "Number of DocumentDB instances in the cluster"
  default     = 3
  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 16
    error_message = "Instance count must be between 1 and 16."
  }
}

variable "instance_class" {
  type        = string
  description = "Instance class for DocumentDB cluster nodes"
  validation {
    condition     = can(regex("^db\\.r[56]\\.", var.instance_class))
    error_message = "Instance class must be a valid DocumentDB instance type (e.g., db.r5.large, db.r6.xlarge)."
  }
}

variable "master_username" {
  type        = string
  description = "Master username for DocumentDB cluster"
  sensitive   = true
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{2,63}$", var.master_username))
    error_message = "Master username must be 3-64 characters long, start with a letter, and contain only alphanumeric characters or underscores."
  }
}

variable "master_password" {
  type        = string
  description = "Master password for DocumentDB cluster"
  sensitive   = true
  validation {
    condition     = can(regex("^[a-zA-Z0-9_@#$%^&*()-+=]{8,100}$", var.master_password))
    error_message = "Master password must be 8-100 characters long and contain only allowed special characters."
  }
}

variable "backup_retention_period" {
  type        = number
  description = "Backup retention period in days"
  default     = 7
  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 1 and 35 days."
  }
}

variable "preferred_backup_window" {
  type        = string
  description = "Daily time range for automated backups"
  default     = "03:00-04:00"
  validation {
    condition     = can(regex("^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$", var.preferred_backup_window))
    error_message = "Backup window must be in format HH:MM-HH:MM."
  }
}

variable "skip_final_snapshot" {
  type        = bool
  description = "Whether to skip final snapshot when destroying cluster"
  default     = false
}

variable "kms_key_arn" {
  type        = string
  description = "ARN of KMS key for encryption at rest"
  default     = ""
  validation {
    condition     = var.kms_key_arn == "" || can(regex("^arn:aws:kms:", var.kms_key_arn))
    error_message = "KMS key ARN must be a valid AWS KMS key ARN."
  }
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where DocumentDB cluster will be deployed"
  validation {
    condition     = can(regex("^vpc-[a-f0-9]{8,17}$", var.vpc_id))
    error_message = "VPC ID must be a valid AWS VPC ID."
  }
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs for DocumentDB cluster deployment"
  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "At least 2 subnet IDs are required for high availability."
  }
}

variable "engine_version" {
  type        = string
  description = "DocumentDB engine version"
  default     = "6.0"
  validation {
    condition     = can(regex("^[4-6]\\.[0-9]$", var.engine_version))
    error_message = "Engine version must be a valid DocumentDB version (e.g., 4.0, 5.0, 6.0)."
  }
}

variable "port" {
  type        = number
  description = "Port number for DocumentDB cluster"
  default     = 27017
  validation {
    condition     = var.port >= 1024 && var.port <= 65535
    error_message = "Port number must be between 1024 and 65535."
  }
}

variable "storage_encrypted" {
  type        = bool
  description = "Enable storage encryption at rest"
  default     = true
}

variable "tags" {
  type        = map(string)
  description = "Tags to be applied to all resources"
  default     = {}
}