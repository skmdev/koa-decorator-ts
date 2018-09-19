declare module 'koa' {
  interface Context {
    graphql?: {
      args: {
        [key: string]: any;
      };
    };
    root: any;
    info: any;
  }
}

export * from './decorators/router';
export * from './decorators/graphql';
