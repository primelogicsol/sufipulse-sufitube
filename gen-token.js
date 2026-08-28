const { SignJWT } = require('jose');
(async () => {
  const secret = new TextEncoder().encode('9bduacHwhmrvRb0oK5OcRJcKlgWkjDoaKXWE6jGBuim_qjW08fNMIvNtZV1wZU1M');
  const token = await new SignJWT({ sub: 'admin', role: 'admin', email: 'admin@sufipulse.com' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
  console.log(token);
})();
