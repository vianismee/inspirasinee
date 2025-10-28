declare module 'minimatch' {
  export function minimatch(pattern: string, options?: any): boolean;
  export function match(list: string[], pattern: string, options?: any): string[];
  export function filter(pattern: string, options?: any): (path: string) => boolean;
  export namespace minimatch {
    export const Minimatch: any;
  }
}