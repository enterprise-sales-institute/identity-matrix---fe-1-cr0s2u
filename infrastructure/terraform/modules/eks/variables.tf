# EKS Cluster Configuration Variables
variable "cluster_name" {
  type        = string
  description = "Name of the EKS cluster"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", var.cluster_name))
    error_message = "Cluster name must start with a letter and can only contain alphanumeric characters and hyphens."
  }
}

variable "kubernetes_version" {
  type        = string
  description = "Kubernetes version for the EKS cluster"
  default     = "1.27"

  validation {
    condition     = can(regex("^[0-9]+\\.[0-9]+$", var.kubernetes_version))
    error_message = "Kubernetes version must be in the format 'X.Y'."
  }
}

# Node Group Configuration Variables
variable "node_group_name" {
  type        = string
  description = "Name of the EKS node group"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", var.node_group_name))
    error_message = "Node group name must start with a letter and can only contain alphanumeric characters and hyphens."
  }
}

variable "node_instance_type" {
  type        = string
  description = "EC2 instance type for EKS worker nodes"
  default     = "t3.medium"

  validation {
    condition     = can(regex("^[a-z][0-9][.][a-z]+$", var.node_instance_type))
    error_message = "Instance type must be a valid AWS EC2 instance type (e.g., t3.medium)."
  }
}

# Node Scaling Configuration
variable "desired_nodes" {
  type        = number
  description = "Desired number of worker nodes in the EKS cluster"
  default     = 2

  validation {
    condition     = var.desired_nodes > 0
    error_message = "Desired nodes must be greater than 0."
  }
}

variable "min_nodes" {
  type        = number
  description = "Minimum number of worker nodes in the EKS cluster"
  default     = 1

  validation {
    condition     = var.min_nodes > 0
    error_message = "Minimum nodes must be greater than 0."
  }
}

variable "max_nodes" {
  type        = number
  description = "Maximum number of worker nodes in the EKS cluster"
  default     = 5

  validation {
    condition     = var.max_nodes >= var.min_nodes
    error_message = "Maximum nodes must be greater than or equal to minimum nodes."
  }
}

# Node Storage Configuration
variable "disk_size" {
  type        = number
  description = "EBS volume size for worker nodes in GB"
  default     = 50

  validation {
    condition     = var.disk_size >= 20 && var.disk_size <= 2000
    error_message = "Disk size must be between 20 and 2000 GB."
  }
}

# Resource Tagging
variable "tags" {
  type        = map(string)
  description = "Resource tags for EKS cluster and node group resources"
  default = {
    Terraform   = "true"
    Application = "identity-matrix"
    Component   = "eks"
  }

  validation {
    condition     = length(var.tags) > 0
    error_message = "At least one tag must be specified."
  }
}

# Network Configuration (imported from networking module)
variable "vpc_id" {
  type        = string
  description = "ID of the VPC where EKS cluster will be deployed"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "List of private subnet IDs for EKS worker nodes"

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "At least two private subnets must be specified for high availability."
  }
}