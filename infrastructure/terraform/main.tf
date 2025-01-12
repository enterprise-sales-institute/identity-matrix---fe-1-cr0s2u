# Provider versions
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws" # version ~> 4.0
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random" # version ~> 3.0
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.4.0"

  backend "s3" {
    # State file configuration to be provided via backend config
    encrypt = true
  }
}

# Local variables for resource naming and tagging
locals {
  name_prefix = "${var.environment}-identitymatrix"
  common_tags = {
    Project              = "Identity Matrix"
    Environment          = var.environment
    ManagedBy           = "Terraform"
    DeploymentTimestamp = timestamp()
    DataClassification  = "Sensitive"
  }
}

# Networking module for VPC and subnet configuration
module "networking" {
  source = "./modules/networking"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = local.common_tags

  # VPC Flow Logs configuration
  enable_flow_logs    = true
  flow_logs_retention = 30
  nat_gateway_count   = 2 # For high availability
}

# EKS cluster configuration
module "eks" {
  source = "./modules/eks"

  cluster_name    = "${local.name_prefix}-cluster"
  environment     = var.environment
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.private_subnets
  
  # Node group configuration
  node_instance_type   = var.node_instance_type
  node_group_min_size = var.min_nodes
  node_group_max_size = var.max_nodes
  
  # Security and monitoring
  enable_logging = true
  log_retention  = 30
  enable_irsa    = true # Enable IAM roles for service accounts
  
  tags = local.common_tags
}

# RDS PostgreSQL configuration
module "rds" {
  source = "./modules/rds"

  environment      = var.environment
  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.private_subnets
  security_group_id = module.networking.security_groups.rds_security_group_id

  # Instance configuration
  instance_class = var.db_instance_class
  storage_size  = var.db_storage_size

  # High availability and backup
  multi_az                = true
  backup_retention_period = var.backup_retention_period
  storage_encrypted      = true
  deletion_protection    = true

  # Monitoring
  monitoring_interval = var.monitoring_interval
  
  tags = local.common_tags
}

# ElastiCache Redis configuration
module "elasticache" {
  source = "./modules/elasticache"

  environment      = var.environment
  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.private_subnets
  security_group_id = module.networking.security_groups.redis_security_group_id

  # Cluster configuration
  node_type                = var.redis_node_type
  num_cache_nodes         = var.redis_num_cache_nodes
  automatic_failover_enabled = true

  # Security and backup
  transit_encryption_enabled = true
  snapshot_retention_limit  = 7
  
  tags = local.common_tags
}

# DocumentDB configuration
module "documentdb" {
  source = "./modules/documentdb"

  environment      = var.environment
  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.private_subnets
  security_group_id = module.networking.security_groups.mongodb_security_group_id

  # Cluster configuration
  instance_class = var.mongodb_instance_class
  num_instances = var.mongodb_num_instances

  # Backup and security
  backup_retention_period  = var.backup_retention_period
  preferred_backup_window = "02:00-03:00"
  skip_final_snapshot     = false
  storage_encrypted      = true

  # Monitoring
  enable_cloudwatch_logs = true
  
  tags = local.common_tags
}

# Outputs for reference by other components
output "vpc_id" {
  description = "ID of the created VPC"
  value       = module.networking.vpc_id
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS cluster"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "rds_endpoint" {
  description = "Endpoint for RDS instance"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Endpoint for Redis cluster"
  value       = module.elasticache.endpoint
  sensitive   = true
}

output "documentdb_endpoint" {
  description = "Endpoint for DocumentDB cluster"
  value       = module.documentdb.endpoint
  sensitive   = true
}