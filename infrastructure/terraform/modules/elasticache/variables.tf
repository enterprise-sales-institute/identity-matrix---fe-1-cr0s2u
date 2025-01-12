# Environment variable for resource naming and tagging
variable "environment" {
  type        = string
  description = "Environment name for resource naming and tagging (e.g., dev, staging, prod)"

  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

# ElastiCache node instance type configuration
variable "redis_node_type" {
  type        = string
  description = "ElastiCache node instance type for Redis cluster"
  default     = "cache.t4g.medium"

  validation {
    condition     = can(regex("^cache\\.[a-z0-9]+\\.[a-z]+$", var.redis_node_type))
    error_message = "Redis node type must be a valid ElastiCache instance type"
  }
}

# Redis port configuration
variable "redis_port" {
  type        = number
  description = "Port number for Redis cluster access"
  default     = 6379

  validation {
    condition     = var.redis_port >= 1024 && var.redis_port <= 65535
    error_message = "Redis port must be between 1024 and 65535"
  }
}

# VPC configuration for Redis deployment
variable "vpc_id" {
  type        = string
  description = "VPC ID where Redis cluster will be deployed"

  validation {
    condition     = can(regex("^vpc-[a-z0-9]+$", var.vpc_id))
    error_message = "VPC ID must be a valid AWS VPC identifier"
  }
}

# Subnet configuration for high availability
variable "private_subnet_ids" {
  type        = list(string)
  description = "List of private subnet IDs for Redis node placement"

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "At least two private subnets are required for high availability"
  }
}

# Security group configuration for access control
variable "redis_security_group_id" {
  type        = string
  description = "Security group ID for Redis cluster access control"

  validation {
    condition     = can(regex("^sg-[a-z0-9]+$", var.redis_security_group_id))
    error_message = "Security group ID must be a valid AWS security group identifier"
  }
}