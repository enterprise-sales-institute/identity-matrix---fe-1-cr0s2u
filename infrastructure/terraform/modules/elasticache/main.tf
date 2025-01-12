# AWS Provider configuration
# Provider version: ~> 4.0
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Redis subnet group for cluster deployment
resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name        = "${var.environment}-redis-subnet-group"
  subnet_ids  = var.private_subnet_ids
  description = "Subnet group for Redis cluster in ${var.environment} environment"

  tags = {
    Environment = var.environment
    Name        = "${var.environment}-redis-subnet-group"
    ManagedBy   = "terraform"
  }
}

# Redis parameter group for Redis 7.x configuration
resource "aws_elasticache_parameter_group" "redis_params" {
  family      = "redis7"
  name        = "${var.environment}-redis-params"
  description = "Custom parameter group for Redis 7.x cluster in ${var.environment}"

  # Performance optimization parameters
  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }

  parameter {
    name  = "activedefrag"
    value = "yes"
  }

  tags = {
    Environment = var.environment
    Name        = "${var.environment}-redis-params"
    ManagedBy   = "terraform"
  }
}

# Redis replication group with Multi-AZ support
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.environment}-redis-cluster"
  description                   = "Redis cluster for ${var.environment} environment"
  node_type                     = var.redis_node_type
  port                         = var.redis_port
  parameter_group_family       = "redis7"
  engine_version              = "7.0"
  automatic_failover_enabled  = true
  multi_az_enabled           = true
  num_cache_clusters         = 2
  subnet_group_name          = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids         = [var.redis_security_group_id]
  
  # Encryption configuration
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled        = true

  # Maintenance and backup configuration
  maintenance_window        = "sun:05:00-sun:06:00"
  snapshot_window          = "03:00-04:00"
  snapshot_retention_limit = 7
  auto_minor_version_upgrade = true
  apply_immediately        = false

  # Performance and availability configuration
  preferred_cache_cluster_azs = slice(data.aws_availability_zones.available.names, 0, 2)

  tags = {
    Environment = var.environment
    Name        = "${var.environment}-redis-cluster"
    ManagedBy   = "terraform"
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      engine_version
    ]
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# CloudWatch alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${var.environment}-redis-cpu-utilization"
  alarm_description   = "Redis cluster CPU utilization"
  namespace           = "AWS/ElastiCache"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = "300"
  evaluation_periods  = "2"
  threshold           = "75"
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions         = [var.sns_topic_arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = {
    Environment = var.environment
    Name        = "${var.environment}-redis-cpu-alarm"
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${var.environment}-redis-memory-utilization"
  alarm_description   = "Redis cluster memory utilization"
  namespace           = "AWS/ElastiCache"
  metric_name         = "DatabaseMemoryUsagePercentage"
  statistic           = "Average"
  period              = "300"
  evaluation_periods  = "2"
  threshold           = "80"
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions         = [var.sns_topic_arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = {
    Environment = var.environment
    Name        = "${var.environment}-redis-memory-alarm"
    ManagedBy   = "terraform"
  }
}