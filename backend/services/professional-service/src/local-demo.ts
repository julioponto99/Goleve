// Shared policy is packaged independently in each service image.
export const localDemo = require('../../../runtime/local-demo.cjs') as {
 policy(env?: NodeJS.ProcessEnv, now?: number): any;
 account(user: any, env?: NodeJS.ProcessEnv): any;
 identityEnvelope(body: any, env?: NodeJS.ProcessEnv): { authority: string; demoInstanceId?: string };
 permitsDemoDatabase(service: string, database: string, env?: NodeJS.ProcessEnv): boolean;
 currentIdentity(id: string, role: string): Promise<any>;
 verifyIdentityAssertion(authorization: string|undefined, body: unknown): string;
 identityProof(data: unknown, authorization: string): string;
 currentIdentity(id: string, role: string): Promise<any>;
 verifyIdentityAssertion(authorization: string|undefined, body: unknown): string;
 identityProof(data: unknown, authorization: string): string;
 assertAction(actor: any, action: string, target: string, parameters?: unknown): void;
};
