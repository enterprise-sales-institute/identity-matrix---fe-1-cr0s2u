/**
 * @file Request validation middleware for Identity Matrix API
 * @version 1.0.0
 * 
 * Provides comprehensive request validation middleware using Yup schemas
 * with input sanitization and standardized error handling.
 */

import { Request, Response, NextFunction } from 'express'; // v4.18.2
import { AnySchema } from 'yup'; // v1.0.0
import { validateSchema, sanitizeInput } from '../../utils/validation.util';
import { createError } from '../../utils/error.util';
import { ErrorCodes, ErrorTypes } from '../../constants/error.constants';

/**
 * Valid request parts that can be validated
 */
type RequestPart = 'body' | 'query' | 'params';

/**
 * Interface for validation error details
 */
interface ValidationErrorDetail {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Higher-order function that creates a validation middleware for the specified
 * request part using a Yup schema
 * 
 * @param schema - Yup schema to validate against
 * @param requestPart - Part of the request to validate (body, query, params)
 * @returns Express middleware function
 */
export const validateRequest = (
  schema: AnySchema,
  requestPart: RequestPart
) => {
  // Verify valid request part
  if (!['body', 'query', 'params'].includes(requestPart)) {
    throw new Error(`Invalid request part: ${requestPart}`);
  }

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract data to validate from request
      const dataToValidate = req[requestPart];

      // Skip validation if no data present and schema is not required
      if (!dataToValidate && !schema.spec.strict) {
        next();
        return;
      }

      // Sanitize input data to prevent XSS
      const sanitizedData = sanitizeInput(dataToValidate);

      try {
        // Validate data against schema
        const validatedData = await schema.validate(sanitizedData, {
          strict: true,
          abortEarly: false,
          stripUnknown: true
        });

        // Assign validated data back to request
        req[requestPart] = validatedData;

        next();
      } catch (validationError: any) {
        // Format validation errors
        const errors: ValidationErrorDetail[] = validationError.inner.map(
          (error: any) => ({
            path: error.path,
            message: error.message,
            value: error.value
          })
        );

        // Create standardized validation error
        const error = createError(
          'Request validation failed',
          ErrorCodes.VALIDATION_FAILED,
          ErrorTypes.VALIDATION_ERROR,
          {
            validationErrors: errors,
            requestPart,
            failedValidation: true
          }
        );

        next(error);
      }
    } catch (error) {
      // Handle unexpected errors
      next(createError(
        'Validation middleware error',
        ErrorCodes.INTERNAL_SERVER,
        ErrorTypes.SYSTEM_ERROR,
        { originalError: error }
      ));
    }
  };
};

/**
 * Helper function to combine multiple validation middlewares
 * 
 * @param validations - Array of validation middleware functions
 * @returns Combined middleware function
 */
export const combineValidations = (validations: ReturnType<typeof validateRequest>[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    for (const validation of validations) {
      try {
        await new Promise((resolve, reject) => {
          validation(req, res, (error: any) => {
            if (error) reject(error);
            resolve(true);
          });
        });
      } catch (error) {
        next(error);
        return;
      }
    }
    next();
  };
};

/**
 * Pre-configured validation middleware for common request validations
 */
export const commonValidations = {
  /**
   * Validates pagination parameters in query string
   */
  pagination: validateRequest(
    schema.object({
      page: schema.number().min(1).default(1),
      limit: schema.number().min(1).max(100).default(20)
    }),
    'query'
  ),

  /**
   * Validates UUID parameters
   */
  uuidParam: validateRequest(
    schema.object({
      id: schema.string().uuid('Invalid UUID format')
    }),
    'params'
  ),

  /**
   * Validates search query parameters
   */
  search: validateRequest(
    schema.object({
      q: schema.string().min(1).max(100),
      fields: schema.array().of(schema.string()).optional()
    }),
    'query'
  )
};
```

This implementation provides a robust validation middleware that:

1. Uses Yup schemas for type-safe validation
2. Sanitizes input data to prevent XSS attacks
3. Provides detailed validation error messages
4. Supports validation of different request parts (body, query, params)
5. Includes helper functions for common validation scenarios
6. Implements proper error handling with standardized error responses
7. Supports combining multiple validation middlewares
8. Includes pre-configured validations for common use cases

The code follows enterprise-grade practices with:
- Comprehensive TypeScript types
- Detailed documentation
- Security-first approach
- Proper error handling
- Reusable components
- Performance optimization through early returns
- Standardized error formats

The middleware can be used in route definitions like:
```typescript
router.post('/user', validateRequest(userSchema, 'body'), userController.create);