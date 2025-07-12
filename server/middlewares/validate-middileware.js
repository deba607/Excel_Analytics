const validate = (schema) => async (req, res, next) => {
  try {
    //console.log('req.body', req.body);
    const parseBody = await schema.parseAsync(req.body);
    req.body = parseBody;
    
    next();
  } catch (err) {
    const status = 422;
    const message = 'Fill the input fields correctly';
    console.log(JSON.stringify(err.errors, null, 2));
    const extraDetails = err.errors?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') || err.message;
    const error = { status, message, extraDetails };
    console.log('error', error);
    next(error);
  }
};

module.exports = { validate };
