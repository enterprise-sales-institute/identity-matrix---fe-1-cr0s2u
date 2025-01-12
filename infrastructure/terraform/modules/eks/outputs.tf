# EKS Cluster outputs
output "cluster_id" {
  description = "The ID of the EKS cluster"
  value       = aws_eks_cluster.cluster.id
}

output "cluster_endpoint" {
  description = "The endpoint URL for the EKS cluster API server"
  value       = aws_eks_cluster.cluster.endpoint
}

output "cluster_certificate_authority" {
  description = "The base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.cluster.certificate_authority[0].data
  sensitive   = true
}

output "cluster_security_group_id" {
  description = "The security group ID attached to the EKS cluster"
  value       = aws_eks_cluster.cluster.vpc_config[0].cluster_security_group_id
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
}

output "cluster_version" {
  description = "The Kubernetes version of the EKS cluster"
  value       = aws_eks_cluster.cluster.version
}

# Node group outputs
output "node_group_id" {
  description = "The ID of the EKS node group"
  value       = aws_eks_node_group.nodes.id
}

output "node_group_arn" {
  description = "The ARN of the EKS node group"
  value       = aws_eks_node_group.nodes.arn
}

output "node_group_status" {
  description = "Status of the EKS node group"
  value       = aws_eks_node_group.nodes.status
}

# IAM outputs
output "cluster_role_arn" {
  description = "The ARN of the IAM role used by the EKS cluster"
  value       = aws_iam_role.eks_cluster_role.arn
}

output "node_role_arn" {
  description = "The ARN of the IAM role used by the EKS node group"
  value       = aws_iam_role.eks_node_role.arn
}

output "oidc_provider_arn" {
  description = "The ARN of the OIDC Provider for EKS service account integration"
  value       = aws_iam_openid_connect_provider.eks.arn
}

# KMS outputs
output "cluster_encryption_key_arn" {
  description = "The ARN of the KMS key used for EKS cluster encryption"
  value       = aws_kms_key.eks.arn
}

output "cluster_encryption_key_id" {
  description = "The ID of the KMS key used for EKS cluster encryption"
  value       = aws_kms_key.eks.key_id
}