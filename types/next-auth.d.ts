import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: 'REQUESTER' | 'FULFILLER' | 'ADMIN';
    };
  }
  interface User {
    role: 'REQUESTER' | 'FULFILLER' | 'ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'REQUESTER' | 'FULFILLER' | 'ADMIN';
    id: string;
  }
}
