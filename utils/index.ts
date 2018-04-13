export const isArray = (arr: any) => {
  return Array.isArray(arr) ? arr : [ arr ];
};

export const normalizePath = (path: string) => {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return path;
};

export const Decorate = (
  args: any[],
  middleware: (...args: any[]) => Promise<any>
): TypedPropertyDescriptor<(...args: any[]) => Promise<any>> => {
  const [ target, name, descriptor ] = args;
  target[name] = isArray(target[name]);
  target[name].unshift(middleware);
  return descriptor;
};
