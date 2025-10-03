import express from 'express';
declare const router: import("express-serve-static-core").Router;
export declare const authenticateToken: (req: express.Request, res: express.Response, next: express.NextFunction) => express.Response<any, Record<string, any>> | undefined;
export declare const requireAdmin: (req: express.Request, res: express.Response, next: express.NextFunction) => express.Response<any, Record<string, any>> | undefined;
export default router;
//# sourceMappingURL=auth.d.ts.map