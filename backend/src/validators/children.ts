import { body, param, ValidationChain } from 'express-validator';

export const createChildValidator: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('ageGroup').trim().notEmpty().withMessage('Age group is required'),
  body('learningFocus')
    .isArray({ min: 1 })
    .withMessage('At least one learning focus is required'),
  body('learningFocus.*').isString().trim().notEmpty(),
  body('interests')
    .isArray({ min: 1 })
    .withMessage('At least one interest is required'),
  body('interests.*').isString().trim().notEmpty(),
  body('avatarUrl').optional().isURL().withMessage('Must be a valid URL'),
];

export const updateChildValidator: ValidationChain[] = [
  param('childId').isUUID().withMessage('Valid childId is required'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('ageGroup').optional().trim().notEmpty(),
  body('learningFocus').optional().isArray({ min: 1 }),
  body('learningFocus.*').optional().isString().trim().notEmpty(),
  body('interests').optional().isArray({ min: 1 }),
  body('interests.*').optional().isString().trim().notEmpty(),
  body('avatarUrl').optional().isURL(),
  body('isActive').optional().isBoolean(),
];

export const childIdParamValidator: ValidationChain[] = [
  param('childId').isUUID().withMessage('Valid childId is required'),
];
