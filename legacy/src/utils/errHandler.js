const errHandler = (err, filter = null, space = "\t") => {
  const obj = {};
  Object.getOwnPropertyNames(err).forEach((key) => {
    obj[key] = err[key];
  });

  return {
    ...JSON.parse(
      JSON.stringify(
        {
          ...obj
        },
        filter,
        space
      )
    ),
    stack: err.stack,
    response: err.response
  };
};

export default errHandler;
