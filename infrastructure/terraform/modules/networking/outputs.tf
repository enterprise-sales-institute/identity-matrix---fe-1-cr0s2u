# VPC outputs
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.vpc.id
}

output "vpc_cidr" {
  description = "CIDR block of the created VPC"
  value       = aws_vpc.vpc.cidr_block
}

# Subnet outputs
output "private_subnet_ids" {
  description = "List of private subnet IDs for application and database layers"
  value       = aws_subnet.private_subnets[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for load balancers and NAT gateways"
  value       = aws_subnet.public_subnets[*].id
}

# Security group outputs
output "eks_security_group_id" {
  description = "Security group ID for EKS cluster and worker nodes"
  value       = aws_security_group.eks_security_group.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS PostgreSQL instances"
  value       = aws_security_group.rds_security_group.id
}

output "redis_security_group_id" {
  description = "Security group ID for Redis ElastiCache clusters"
  value       = aws_security_group.redis_security_group.id
}

output "mongodb_security_group_id" {
  description = "Security group ID for MongoDB DocumentDB clusters"
  value       = aws_security_group.mongodb_security_group.id
}