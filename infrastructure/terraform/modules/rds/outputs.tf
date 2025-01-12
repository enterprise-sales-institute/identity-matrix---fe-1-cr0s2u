# Connection endpoint output for the PostgreSQL RDS instance
# This includes both the hostname and port in the format hostname:port
output "endpoint" {
  description = "Connection endpoint for the PostgreSQL RDS instance"
  value       = aws_db_instance.main.endpoint
}

# DNS hostname output for the PostgreSQL RDS instance
# This is useful for DNS resolution and connection configuration
output "address" {
  description = "DNS hostname of the PostgreSQL RDS instance"
  value       = aws_db_instance.main.address
}

# Port number output for the PostgreSQL RDS instance
# Standard PostgreSQL port 5432 is used as configured in main.tf
output "port" {
  description = "Port number on which PostgreSQL RDS instance is listening"
  value       = aws_db_instance.main.port
}