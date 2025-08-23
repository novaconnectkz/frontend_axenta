// Типы для системы управления документацией и развертыванием

export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: ApiParameter[];
  responses: ApiResponse[];
  authenticated: boolean;
  deprecated: boolean;
  version: string;
  lastUpdated: string;
}

export interface ApiParameter {
  name: string;
  in: "query" | "path" | "header" | "body";
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface ApiResponse {
  code: number;
  description: string;
  schema?: string;
  example?: any;
}

export interface ApiDocumentation {
  id: string;
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: ApiEndpoint[];
  schemas: ApiSchema[];
  lastGenerated: string;
  status: "draft" | "published" | "archived";
}

export interface ApiSchema {
  name: string;
  type: "object" | "array" | "string" | "number" | "boolean";
  properties: Record<string, any>;
  required: string[];
  description: string;
}

export interface UserDocumentation {
  id: string;
  title: string;
  category:
    | "getting-started"
    | "user-guide"
    | "admin-guide"
    | "api-reference"
    | "troubleshooting";
  content: string;
  language: "ru" | "en";
  version: string;
  author: string;
  lastUpdated: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  attachments: DocumentAttachment[];
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: "image" | "video" | "pdf" | "archive";
  url: string;
  size: number;
  uploadedAt: string;
}

export interface DeploymentEnvironment {
  id: string;
  name: string;
  type: "development" | "staging" | "production";
  url: string;
  status: "active" | "inactive" | "deploying" | "error";
  lastDeployment: string;
  version: string;
  branch: string;
  uptime: number;
  resources: EnvironmentResources;
}

export interface EnvironmentResources {
  cpu: {
    usage: number;
    limit: number;
  };
  memory: {
    usage: number;
    limit: number;
  };
  storage: {
    usage: number;
    limit: number;
  };
  requests: {
    current: number;
    limit: number;
  };
}

export interface DeploymentHistory {
  id: string;
  environment: string;
  version: string;
  branch: string;
  commit: string;
  author: string;
  startedAt: string;
  completedAt?: string;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  duration?: number;
  logs: DeploymentLog[];
}

export interface DeploymentLog {
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
  source: string;
}

export interface CicdPipeline {
  id: string;
  name: string;
  repository: string;
  branch: string;
  trigger: "push" | "pull_request" | "schedule" | "manual";
  status: "idle" | "running" | "success" | "failed";
  lastRun: string;
  duration: number;
  stages: PipelineStage[];
  environment: string;
}

export interface PipelineStage {
  name: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  logs: string[];
}

export interface DeploymentScript {
  id: string;
  name: string;
  type: "bash" | "docker" | "kubernetes" | "ansible";
  environment: string;
  content: string;
  variables: Record<string, string>;
  lastExecuted?: string;
  status: "active" | "inactive";
  author: string;
  createdAt: string;
}

export interface SystemHealth {
  overall: "healthy" | "warning" | "critical";
  services: ServiceHealth[];
  lastCheck: string;
  uptime: number;
}

export interface ServiceHealth {
  name: string;
  status: "up" | "down" | "degraded";
  responseTime: number;
  errorRate: number;
  lastCheck: string;
  url?: string;
}

export interface DocumentationStats {
  apiEndpoints: {
    total: number;
    documented: number;
    deprecated: number;
  };
  userDocs: {
    total: number;
    published: number;
    drafts: number;
  };
  deployments: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
  };
  environments: {
    total: number;
    active: number;
    healthy: number;
  };
}
