# Redis cluster connection endpoints
output "redis_primary_endpoint" {
  description = "Primary endpoint address for Redis cluster write operations"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Reader endpoint address for Redis cluster read operations"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "redis_port" {
  description = "Port number for Redis cluster access"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_subnet_group_name" {
  description = "Name of the subnet group where Redis cluster is deployed"
  value       = aws_elasticache_subnet_group.redis_subnet_group.name
}

output "redis_configuration_endpoint" {
  description = "Configuration endpoint for Redis cluster management and monitoring"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
}

# Redis cluster security configuration
output "redis_encryption_at_rest" {
  description = "Indicates if encryption at rest is enabled for the Redis cluster"
  value       = aws_elasticache_replication_group.redis.at_rest_encryption_enabled
}

output "redis_encryption_in_transit" {
  description = "Indicates if encryption in transit is enabled for the Redis cluster"
  value       = aws_elasticache_replication_group.redis.transit_encryption_enabled
}

# Redis cluster maintenance and backup configuration
output "redis_maintenance_window" {
  description = "Maintenance window timeframe for the Redis cluster"
  value       = aws_elasticache_replication_group.redis.maintenance_window
}

output "redis_backup_window" {
  description = "Backup window timeframe for the Redis cluster"
  value       = aws_elasticache_replication_group.redis.snapshot_window
}

# Redis cluster size information
output "redis_cluster_size" {
  description = "Number of cache clusters in the Redis replication group"
  value       = aws_elasticache_replication_group.redis.num_cache_clusters
}