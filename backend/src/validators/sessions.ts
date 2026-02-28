import { body, param, ValidationChain } from 'express-validator';

export const triggerSessionValidator: ValidationChain[] = [
  body('childId').isUUID().withMessage('Valid childId is required'),
  body('triggerType')
    .optional()
    .isIn(['schedule', 'manual'])
    .withMessage('triggerType must be "schedule" or "manual"'),
];

export const sessionIdParamValidator: ValidationChain[] = [
  param('sessionId').isUUID().withMessage('Valid sessionId is required'),
];

export const submitAnswerValidator: ValidationChain[] = [
  param('sessionId').isUUID().withMessage('Valid sessionId is required'),
  body('questionId').isUUID().withMessage('Valid questionId is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required'),
];

export const submitRemediationAnswerValidator: ValidationChain[] = [
  param('sessionId').isUUID().withMessage('Valid sessionId is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required'),
];
