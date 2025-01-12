# AWS Infrastructure Outputs for Identity Matrix Platform
# Provider version: hashicorp/aws ~> 4.0

locals {
  # Define which outputs contain sensitive information
  sensitive_outputs = {
    rds_cluster_endpoint    = true
    documentdb_endpoint     = true
    elasticache_endpoint    = true
    eks_cluster_endpoint    = true
    kms_key_arns           = true
    security_group_ids      = false
    vpc_id                 = false
    private_subnet_ids     = false
    documentdb_port        = false
  }
}

# Network Infrastructure Outputs
output "vpc_id" {
  description = "The ID of the VPC where the Identity Matrix infrastructure is deployed"
  value       = module.vpc.vpc_id
  sensitive   = local.sensitive_outputs["vpc_id"]
}

output "private_subnet_ids" {
  description = "List of private subnet IDs where the application components are deployed"
  value       = module.vpc.private_subnet_ids
  sensitive   = local.sensitive_outputs["private_subnet_ids"]
}

# EKS Cluster Outputs
output "eks_cluster_endpoint" {
  description = "Endpoint for the Identity Matrix EKS cluster"
  value       = module.eks.cluster_endpoint
  sensitive   = local.sensitive_outputs["eks_cluster_endpoint"]
}

# Database Infrastructure Outputs
output "rds_cluster_endpoint" {
  description = "Endpoint for the PostgreSQL RDS cluster"
  value       = module.rds.cluster_endpoint
  sensitive   = local.sensitive_outputs["rds_cluster_endpoint"]
}

output "documentdb_endpoint" {
  description = "Endpoint for the DocumentDB cluster used for visitor data storage"
  value       = module.documentdb.cluster_endpoint
  sensitive   = local.sensitive_outputs["documentdb_endpoint"]
}

output "documentdb_port" {
  description = "Port number for the DocumentDB cluster"
  value       = module.documentdb.port
  sensitive   = local.sensitive_outputs["documentdb_port"]
}

# Caching Layer Outputs
output "elasticache_endpoint" {
  description = "Endpoint for the ElastiCache Redis cluster"
  value       = module.elasticache.primary_endpoint
  sensitive   = local.sensitive_outputs["elasticache_endpoint"]
}

# Security Outputs
output "security_group_ids" {
  description = "Map of security group IDs for different components"
  value = {
    eks_nodes     = module.eks.node_security_group_id
    rds          = module.rds.security_group_id
    documentdb   = module.documentdb.security_group_id
    elasticache  = module.elasticache.security_group_id
    application  = module.application.security_group_id
  }
  sensitive = local.sensitive_outputs["security_group_ids"]
}

output "kms_key_arns" {
  description = "Map of KMS key ARNs used for encryption"
  value = {
    rds         = module.rds.kms_key_arn
    documentdb  = module.documentdb.kms_key_arn
    elasticache = module.elasticache.kms_key_arn
    eks         = module.eks.kms_key_arn
  }
  sensitive = local.sensitive_outputs["kms_key_arns"]
}

# Helper function to format connection strings
locals {
  format_connection_strings = {
    documentdb = format(
      "mongodb://%s:%s/%s",
      module.documentdb.cluster_endpoint,
      module.documentdb.port,
      "identity_matrix"
    )
    rds = format(
      "postgresql://%s:5432/identity_matrix",
      module.rds.cluster_endpoint
    )
    redis = format(
      "redis://%s:6379/0",
      module.elasticache.primary_endpoint
    )
  }
}