export const rpcSuccess = (res, result, id) => {
  res.json({
    jsonrpc: '2.0',
    result,
    id
  });
};

export const rpcError = (res, code, e, id) => {
  res.status(code).json({
    jsonrpc: '2.0',
    error: {
      code,
      message: 'unauthorized',
      data: e
    },
    id
  });
};
