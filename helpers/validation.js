const Joi = require("joi");

const userSchema = Joi.object().keys({
  name: Joi.string().required(),
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  password: Joi.string().required().min(8),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});

const employerSchema = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  organizationName: Joi.string().required(),
  password: Joi.string().required().min(8),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});

const employerEmailSchema = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
});

const employerVerfiyEmailSchema = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
});

const employerDetailsSchema = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  password: Joi.string().required().min(8),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  organizationName: Joi.string().required(),
});

const employeeSchema = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  walletAddress: Joi.string().required(),
  asset: Joi.string().required(),
});

const employeeUpdateSchema = Joi.object().keys({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email({ minDomainSegments: 2 }),
  walletAddress: Joi.string(),
  asset: Joi.string(),
});

const sendCoinToAnyOneSchema = Joi.object().keys({
  amount: Joi.number().required(),
  receiverWalletAddress: Joi.string().required(),
});

const sendCoinToEmployeeSchema = Joi.object().keys({
  amount: Joi.number().required(),
  frequency: Joi.string().required(),
  employeeId: Joi.string().required(),
  hour: Joi.number(),
  minute: Joi.number(),
  day: Joi.number(), //starting from sunday with 0
  date: Joi.number(), //
});

const resendTokenSchema = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
});

const userSchemaLogin = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  password: Joi.string().required().min(8),
});

const userSchemaActivate = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
  code: Joi.string().required(),
});

const userSchemaForgotPassword = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
});

const userSchemaResetPassword = Joi.object().keys({
  token: Joi.string().required(),
  newPassword: Joi.string().required().min(8),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
});

const userSchemaLogout = Joi.object().keys({
  id: Joi.string().required(),
});

const waitListSchema = Joi.object().keys({
  email: Joi.string().required().email({ minDomainSegments: 2 }),
});

module.exports = {
  userSchema,
  employerSchema,
  employerEmailSchema,
  employerVerfiyEmailSchema,
  employerDetailsSchema,
  employeeSchema,
  employeeUpdateSchema,
  sendCoinToAnyOneSchema,
  sendCoinToEmployeeSchema,
  resendTokenSchema,
  userSchemaLogin,
  userSchemaActivate,
  userSchemaForgotPassword,
  userSchemaResetPassword,
  userSchemaLogout,
  waitListSchema,
};
