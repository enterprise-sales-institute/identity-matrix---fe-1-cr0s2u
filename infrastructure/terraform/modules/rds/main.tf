# AWS Provider configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Local variables for database configuration
locals {
  db_name          = "identity_matrix"
  db_port          = 5432
  engine_version   = "14.7"
  parameter_family = "postgres14"
}

# RDS subnet group for multi-AZ deployment
resource "aws_db_subnet_group" "main" {
  name        = "identity-matrix-${var.environment}"
  subnet_ids  = var.private_subnet_ids
  description = "Subnet group for Identity Matrix RDS instances"

  tags = {
    Name        = "identity-matrix-${var.environment}"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "identity-matrix"
  }
}

# RDS parameter group for PostgreSQL configuration
resource "aws_db_parameter_group" "main" {
  family      = local.parameter_family
  name        = "identity-matrix-${var.environment}"
  description = "Custom parameter group for Identity Matrix PostgreSQL"

  # Performance and monitoring parameters
  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "all"
  }

  # Security parameters
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  tags = {
    Name        = "identity-matrix-${var.environment}"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "identity-matrix"
  }
}

# Primary PostgreSQL RDS instance
resource "aws_db_instance" "main" {
  identifier     = "identity-matrix-${var.environment}"
  engine         = "postgres"
  engine_version = local.engine_version

  # Instance configuration
  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database configuration
  db_name  = local.db_name
  port     = local.db_port
  username = "admin"
  password = var.db_password

  # High availability configuration
  multi_az               = var.multi_az
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  vpc_security_group_ids = [var.security_group_id]

  # Backup configuration
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "identity-matrix-${var.environment}-final"
  copy_tags_to_snapshot     = true

  # Performance insights and monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                  = var.monitoring_role_arn
  enabled_cloudwatch_logs_exports      = ["postgresql", "upgrade"]

  # Additional configuration
  auto_minor_version_upgrade = true
  publicly_accessible       = false

  tags = {
    Name          = "identity-matrix-${var.environment}"
    Environment   = var.environment
    ManagedBy     = "terraform"
    Project       = "identity-matrix"
    Backup        = "required"
    SecurityLevel = "high"
  }
}

# Outputs for RDS instance details
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "RDS instance hostname"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}