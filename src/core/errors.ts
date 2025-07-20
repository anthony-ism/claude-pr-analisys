/**
 * Core error handling for the PR analysis tool
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Base error types
export enum ErrorType {
  CONFIGURATION = 'CONFIGURATION',
  VALIDATION = 'VALIDATION',
  SERVICE = 'SERVICE',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// Severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Base application error
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Configuration error
export class ConfigurationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorType.CONFIGURATION, message, ErrorSeverity.HIGH, details);
    this.name = 'ConfigurationError';
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorType.VALIDATION, message, ErrorSeverity.MEDIUM, details);
    this.name = 'ValidationError';
  }
}

// Service error
export class ServiceError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details?: any
  ) {
    super(ErrorType.SERVICE, message, severity, details);
    this.name = 'ServiceError';
    this.service = service;
  }
}

// Error aggregation for multiple errors
export class AggregateError extends AppError {
  public readonly errors: Error[];

  constructor(errors: Error[], message: string = 'Multiple errors occurred') {
    const details = {
      errorCount: errors.length,
      errors: errors.map(e => e.message),
    };
    super(ErrorType.UNKNOWN, message, ErrorSeverity.HIGH, details);
    this.name = 'AggregateError';
    this.errors = errors;
  }
}

// Error utilities
export class ErrorUtils {
  /**
   * Check if error is a specific type of application error
   */
  static isAppError(error: any): error is AppError {
    return error instanceof AppError;
  }

  /**
   * Check if error is a service error
   */
  static isServiceError(error: any): error is ServiceError {
    return error instanceof ServiceError;
  }

  /**
   * Extract error message safely from any error type
   */
  static getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  /**
   * Extract error details safely
   */
  static getErrorDetails(error: any): any {
    if (this.isAppError(error)) {
      return error.details;
    }
    return error;
  }

  /**
   * Format error for logging
   */
  static formatError(error: any): string {
    if (this.isAppError(error)) {
      const details = error.details
        ? ` | Details: ${JSON.stringify(error.details)}`
        : '';
      return `[${error.type}:${error.severity}] ${error.message}${details}`;
    }
    return this.getErrorMessage(error);
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(error: any): {
    success: false;
    error: string;
    type: string;
    severity: string;
    details?: any;
  } {
    if (this.isAppError(error)) {
      return {
        success: false,
        error: error.message,
        type: error.type,
        severity: error.severity,
        details: error.details,
      };
    }

    return {
      success: false,
      error: this.getErrorMessage(error),
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
    };
  }
}
