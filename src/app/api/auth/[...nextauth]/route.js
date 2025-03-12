import NextAuth from 'next-auth';
import { authOptionsPostgres } from '../../../../lib/auth-postgres';

const handler = NextAuth(authOptionsPostgres);

export { handler as GET, handler as POST }; 