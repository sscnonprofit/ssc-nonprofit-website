// pg currently treats sslmode=prefer|require|verify-ca as verify-full and warns that
// pg v9 will switch them to weaker libpq semantics. Pin verify-full so the security
// level stays the same across that upgrade and the warning goes away.
export function withVerifiedSsl(connectionString: string | undefined): string | undefined {
  if (!connectionString) return connectionString
  return connectionString.replace(/([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/i, "$1verify-full")
}
