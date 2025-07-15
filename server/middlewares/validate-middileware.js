const validate = (schema) => async (req, res, next) => {
  try {
    const parseBody = await schema.parseAsync(req.body);
    req.body = parseBody;
    
    next();
  } catch (err) {
    const status = 422;
    const message = 'Fill the input fields correctly';
    const extraDetails = err.errors?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') || err.message;
    const error = { status, message, extraDetails };
    next(error);
  }
};

module.exports = { validate };
