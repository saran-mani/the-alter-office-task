import { body } from "express-validator";

export const createShortenUrlValidator = [
  body("longUrl")
    .exists()
    .withMessage("Please provide a long url for shorten")
    .isString()
    .withMessage("long url must be a string")
    .isURL()
    .withMessage("long url must be a url"),
  body("customAlias")
    .optional()
    .isString()
    .withMessage("custom alias must be a string"),
  body("topic").optional().isString().withMessage("topic must be a string"),
];
