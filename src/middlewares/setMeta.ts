const setMeta = (meta = {}) => async (ctx: any, next: Function) => {
  ctx.meta = meta;
  await next();
};

export default setMeta;
