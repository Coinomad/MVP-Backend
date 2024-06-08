import Joi from "joi";

export const userSchema = Joi.object().keys({
  name: Joi.string().required(),
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  password: Joi.string().required().min(8),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});

export const employerSchema = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  organizationName: Joi.string().required(),
  password: Joi.string().required().min(8),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});

export const employeeSchema = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  uniqueLink: Joi.string().required(),
  organizationName: Joi.string().required(),
  password: Joi.string().required().min(8),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});

export const resendTokenSchema = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
});

// firstName: { type: String, required: true },
// lastName: { type: String, required: true },
// email: { type: String, required: true, unique: true },
// password: { type: String, required: true },

// organizationName: { type: String, unique: true, required: true },
//     email: { type: String, required: true, unique: true },
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     password: { type: String, required: true },

export const userSchemaLogin = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  password: Joi.string().required().min(8),
});

export const userSchemaActivate = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  code: Joi.string().required(),
});

export const userSchemaForgotPassword = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
});

export const userSchemaResetPassword = Joi.object().keys({
  token: Joi.string().required(),
  newPassword: Joi.string().required().min(8),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
});

export const userSchemaLogout = Joi.object().keys({
  id: Joi.string().required(),
});

export const waitListSchema = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
});
