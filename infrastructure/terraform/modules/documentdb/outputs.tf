output "cluster_endpoint" {
  description = "The DNS address of the DocumentDB cluster for write operations"
  value       = aws_docdb_cluster.this.endpoint
}

output "cluster_port" {
  description = "The port number on which the DocumentDB cluster accepts connections"
  value       = aws_docdb_cluster.this.port
}

output "cluster_identifier" {
  description = "The identifier of the DocumentDB cluster"
  value       = aws_docdb_cluster.this.cluster_identifier
}

output "reader_endpoint" {
  description = "The DNS address of the DocumentDB cluster reader endpoint for read operations"
  value       = aws_docdb_cluster.this.reader_endpoint
}

output "instance_endpoints" {
  description = "List of DNS addresses for all DocumentDB cluster instances"
  value       = [for instance in aws_docdb_cluster_instance.this : instance.endpoint]
}