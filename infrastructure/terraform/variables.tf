# Environment Configuration
variable "environment" {
  type        = string
  description = "Deployment environment (dev/staging/prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Region Configuration
variable "region" {
  type        = string
  description = "AWS region for infrastructure deployment"
  default     = "us-west-2"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]{1}$", var.region))
    error_message = "Region must be a valid AWS region identifier."
  }
}

# Networking Configuration
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for VPC network"
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones for multi-AZ deployment"
  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least two availability zones must be specified for high availability."
  }
}

# EKS Configuration
variable "cluster_name" {
  type        = string
  description = "Name of the EKS cluster"
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", var.cluster_name))
    error_message = "Cluster name must start with a letter and only contain alphanumeric characters and hyphens."
  }
}

variable "node_instance_type" {
  type        = string
  description = "EC2 instance type for EKS worker nodes"
  default     = "t3.medium"
  validation {
    condition     = can(regex("^[a-z][0-9][.][a-z]+$", var.node_instance_type))
    error_message = "Instance type must be a valid AWS EC2 instance type."
  }
}

variable "min_nodes" {
  type        = number
  description = "Minimum number of worker nodes in EKS cluster"
  default     = 2
  validation {
    condition     = var.min_nodes >= 2
    error_message = "Minimum number of nodes must be at least 2 for high availability."
  }
}

variable "max_nodes" {
  type        = number
  description = "Maximum number of worker nodes in EKS cluster"
  default     = 10
  validation {
    condition     = var.max_nodes > var.min_nodes
    error_message = "Maximum nodes must be greater than minimum nodes."
  }
}

# RDS Configuration
variable "db_instance_class" {
  type        = string
  description = "RDS instance class for PostgreSQL database"
  default     = "db.t3.medium"
  validation {
    condition     = can(regex("^db[.][a-z0-9]+[.][a-z]+$", var.db_instance_class))
    error_message = "DB instance class must be a valid RDS instance type."
  }
}

variable "db_storage_size" {
  type        = number
  description = "Size in GB for RDS storage"
  default     = 100
  validation {
    condition     = var.db_storage_size >= 20 && var.db_storage_size <= 16384
    error_message = "DB storage size must be between 20 and 16384 GB."
  }
}

# ElastiCache Configuration
variable "redis_node_type" {
  type        = string
  description = "ElastiCache node type for Redis cache"
  default     = "cache.t3.medium"
  validation {
    condition     = can(regex("^cache[.][a-z0-9]+[.][a-z]+$", var.redis_node_type))
    error_message = "Redis node type must be a valid ElastiCache node type."
  }
}

variable "redis_num_cache_nodes" {
  type        = number
  description = "Number of cache nodes in Redis cluster"
  default     = 2
  validation {
    condition     = var.redis_num_cache_nodes >= 2
    error_message = "Number of Redis nodes must be at least 2 for high availability."
  }
}

# DocumentDB Configuration
variable "mongodb_instance_class" {
  type        = string
  description = "DocumentDB instance class for MongoDB-compatible database"
  default     = "db.r5.large"
  validation {
    condition     = can(regex("^db[.][a-z0-9]+[.][a-z]+$", var.mongodb_instance_class))
    error_message = "MongoDB instance class must be a valid DocumentDB instance type."
  }
}

variable "mongodb_num_instances" {
  type        = number
  description = "Number of instances in DocumentDB cluster"
  default     = 3
  validation {
    condition     = var.mongodb_num_instances >= 3
    error_message = "Number of MongoDB instances must be at least 3 for high availability."
  }
}

# Tags Configuration
variable "tags" {
  type        = map(string)
  description = "Common tags to be applied to all resources"
  default = {
    Project     = "identity-matrix"
    ManagedBy   = "terraform"
    Environment = "dev"
  }
}

# Backup Configuration
variable "backup_retention_period" {
  type        = number
  description = "Number of days to retain backups"
  default     = 7
  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 1 and 35 days."
  }
}

# Monitoring Configuration
variable "enable_enhanced_monitoring" {
  type        = bool
  description = "Enable enhanced monitoring for RDS and DocumentDB"
  default     = true
}

variable "monitoring_interval" {
  type        = number
  description = "Monitoring interval in seconds"
  default     = 60
  validation {
    condition     = contains([0, 1, 5, 10, 15, 30, 60], var.monitoring_interval)
    error_message = "Monitoring interval must be one of: 0, 1, 5, 10, 15, 30, 60."
  }
}