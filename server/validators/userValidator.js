const { z } = require('zod');

const userValidator = z.object({
  name: z
    .string({required_error: 'Name is required'})
    .trim()
    .min(3, { message: 'Name must be at least 3 characters long' })
    .max(255, { message: 'Name must be at most 20 characters long' }),
  email: z
    .string({required_error: 'Email is required'})
    .trim()
    .email({ message: 'Invalid email address' })
    .min(3, { message: 'Email must be at least 3 characters long' })
    .max(255, { message: 'Email must be at most 255 characters long' }),
  password: z
    .string({required_error: 'Password is required'})
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(16, { message: 'Password must be at most 16 characters long' }),
});

module.exports = { userValidator };