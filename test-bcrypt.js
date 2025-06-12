const bcrypt = require('bcrypt');

(async () => {
  const senha = '123';
  const hash = await bcrypt.hash(senha, 10);
  console.log('Hash gerado:', hash);
})();
