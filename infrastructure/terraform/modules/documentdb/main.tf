terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# DocumentDB Cluster
resource "aws_docdb_cluster" "this" {
  cluster_identifier           = "${var.environment}-docdb-cluster"
  engine                      = "docdb"
  engine_version              = var.engine_version
  master_username             = var.master_username
  master_password             = var.master_password
  backup_retention_period     = var.backup_retention_period
  preferred_backup_window     = var.preferred_backup_window
  storage_encrypted          = var.storage_encrypted
  kms_key_id                 = var.kms_key_arn
  deletion_protection        = true
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = "${var.environment}-docdb-final-snapshot"
  port                      = var.port
  vpc_security_group_ids    = [aws_security_group.this.id]
  db_subnet_group_name      = aws_docdb_subnet_group.this.name

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-docdb-cluster"
      Environment = var.environment
    }
  )
}

# DocumentDB Subnet Group
resource "aws_docdb_subnet_group" "this" {
  name        = "${var.environment}-docdb-subnet-group"
  subnet_ids  = var.subnet_ids
  description = "Subnet group for ${var.environment} DocumentDB cluster"

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-docdb-subnet-group"
      Environment = var.environment
    }
  )
}

# DocumentDB Cluster Instances
resource "aws_docdb_cluster_instance" "this" {
  count              = var.instance_count
  identifier         = "${var.environment}-docdb-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.this.id
  instance_class     = var.instance_class

  auto_minor_version_upgrade = true
  monitoring_interval       = 60
  monitoring_role_arn      = aws_iam_role.monitoring.arn
  promotion_tier           = count.index

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-docdb-instance-${count.index + 1}"
      Environment = var.environment
    }
  )
}

# Security Group
resource "aws_security_group" "this" {
  name        = "${var.environment}-docdb-sg"
  description = "Security group for DocumentDB cluster with restricted access"
  vpc_id      = var.vpc_id

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-docdb-sg"
      Environment = var.environment
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "monitoring" {
  name = "${var.environment}-docdb-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-docdb-monitoring-role"
      Environment = var.environment
    }
  )
}

# Attach Enhanced Monitoring Policy
resource "aws_iam_role_policy_attachment" "monitoring" {
  role       = aws_iam_role.monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDocDBEnhancedMonitoringRole"
}

# Outputs
output "cluster_endpoint" {
  description = "The DNS address of the DocumentDB cluster"
  value       = aws_docdb_cluster.this.endpoint
}

output "cluster_port" {
  description = "The port number on which the DocumentDB cluster accepts connections"
  value       = aws_docdb_cluster.this.port
}

output "security_group_id" {
  description = "The ID of the security group created for the DocumentDB cluster"
  value       = aws_security_group.this.id
}

output "cluster_resource_id" {
  description = "The Resource ID of the DocumentDB cluster"
  value       = aws_docdb_cluster.this.cluster_resource_id
}

output "cluster_arn" {
  description = "The ARN of the DocumentDB cluster"
  value       = aws_docdb_cluster.this.arn
}

output "subnet_group_name" {
  description = "The name of the subnet group created for the DocumentDB cluster"
  value       = aws_docdb_subnet_group.this.name
}