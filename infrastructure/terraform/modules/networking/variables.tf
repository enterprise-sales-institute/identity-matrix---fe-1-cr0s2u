variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC network"
  default     = "10.0.0.0/16"

  validation {
    condition     = can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$", var.vpc_cidr))
    error_message = "VPC CIDR block must be a valid IPv4 CIDR notation (e.g., 10.0.0.0/16)."
  }
}

variable "environment" {
  type        = string
  description = "Deployment environment name (dev/staging/prod)"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "availability_zones" {
  type        = list(string)
  description = "List of AWS availability zones for multi-AZ deployment"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "List of CIDR blocks for private subnets"

  validation {
    condition = alltrue([
      for cidr in var.private_subnet_cidrs :
      can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$", cidr))
    ])
    error_message = "All private subnet CIDR blocks must be valid IPv4 CIDR notation."
  }
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "List of CIDR blocks for public subnets"

  validation {
    condition = alltrue([
      for cidr in var.public_subnet_cidrs :
      can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$", cidr))
    ])
    error_message = "All public subnet CIDR blocks must be valid IPv4 CIDR notation."
  }
}

variable "enable_nat_gateway" {
  type        = bool
  description = "Flag to enable NAT Gateway for private subnet internet access"
  default     = true
}

variable "single_nat_gateway" {
  type        = bool
  description = "Flag to use a single NAT Gateway instead of one per AZ"
  default     = false
}

variable "tags" {
  type        = map(string)
  description = "Resource tags to be applied to all networking resources"
  default = {
    Terraform   = "true"
    Application = "identity-matrix"
  }
}