declare module "@prisma/client" {
  export class PrismaClient {
    constructor(...args: any[]);
    [key: string]: any;
  }
  export const Prisma: { [key: string]: any };
}
