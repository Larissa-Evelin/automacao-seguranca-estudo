const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // para hash de senha
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET = 'minha_chave_secreta';

app.use(express.json());

// Middleware para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Banco de dados fake (em memória)
// Senha do admin já hashada ("123456")
const usuarios = [
  { id: 1, nome: 'admin', senhaHash: '$2b$10$2ZUewF7RUuhbBEB1w1AX4e3eSutXIRFeqgA7jKeJ1A26.me/TgLbK' }
];

// Produtos
let produtos = [
  { id: 1, nome: 'Camiseta Preta', preco: 49.90, estoque: 20 },
  { id: 2, nome: 'Tênis Esportivo', preco: 149.90, estoque: 10 },
  { id: 3, nome: 'Calça Jeans', preco: 99.90, estoque: 15 }
];

// Carrinho
let carrinho = [];

// Middleware para autenticação JWT
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

  jwt.verify(token, SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ erro: 'Token inválido' });
    req.usuario = usuario;
    next();
  });
}

// Rotas

// Redireciona raiz para página de login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Página produtos (HTML protegido)
app.get('/produtos', autenticarToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'produtos.html'));
});

// API Produtos (JSON)
app.get('/api/produtos', autenticarToken, (req, res) => {
  res.json(produtos);
});

// Criar produto (POST)
app.post('/api/produtos', autenticarToken, (req, res) => {
  const { nome, preco, estoque } = req.body;

  if (typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ erro: 'Nome do produto inválido' });
  }
  if (typeof preco !== 'number' || preco <= 0) {
    return res.status(400).json({ erro: 'Preço inválido' });
  }
  if (!Number.isInteger(estoque) || estoque < 0) {
    return res.status(400).json({ erro: 'Estoque inválido' });
  }

  const novoProduto = { id: Date.now(), nome: nome.trim(), preco, estoque };
  produtos.push(novoProduto);
  res.status(201).json(novoProduto);
});

// Editar produto (PUT)
app.put('/api/produtos/:id', autenticarToken, (req, res) => {
  const { id } = req.params;
  const { nome, preco, estoque } = req.body;

  const produto = produtos.find(p => p.id == id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  if (nome && (typeof nome !== 'string' || nome.trim() === '')) {
    return res.status(400).json({ erro: 'Nome inválido' });
  }
  if (preco && (typeof preco !== 'number' || preco <= 0)) {
    return res.status(400).json({ erro: 'Preço inválido' });
  }
  if (estoque !== undefined && (!Number.isInteger(estoque) || estoque < 0)) {
    return res.status(400).json({ erro: 'Estoque inválido' });
  }

  produto.nome = nome ? nome.trim() : produto.nome;
  produto.preco = preco ?? produto.preco;
  produto.estoque = estoque ?? produto.estoque;

  res.json(produto);
});

// Deletar produto (DELETE)
app.delete('/api/produtos/:id', autenticarToken, (req, res) => {
  const { id } = req.params;
  produtos = produtos.filter(p => p.id != id);
  res.status(204).send();
});

// Rotas carrinho

// Ver carrinho
app.get('/api/carrinho', autenticarToken, (req, res) => {
  res.json(carrinho);
});

// Adicionar item no carrinho
app.post('/api/carrinho', autenticarToken, (req, res) => {
  const { idProduto, quantidade } = req.body;

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return res.status(400).json({ erro: 'Quantidade inválida' });
  }

  const produto = produtos.find(p => p.id == idProduto);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  const item = carrinho.find(i => i.idProduto == idProduto);
  if (item) {
    item.quantidade += quantidade;
  } else {
    carrinho.push({
      id: Date.now(),
      idProduto,
      nome: produto.nome,
      preco: produto.preco,
      quantidade
    });
  }

  res.status(201).json(carrinho);
});

// Atualizar quantidade no carrinho
app.put('/api/carrinho/:id', autenticarToken, (req, res) => {
  const { id } = req.params;
  const { quantidade } = req.body;

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return res.status(400).json({ erro: 'Quantidade inválida' });
  }

  const item = carrinho.find(i => i.id == id);
  if (!item) return res.status(404).json({ erro: 'Item não encontrado' });

  item.quantidade = quantidade;
  res.json(item);
});

// Remover item do carrinho
app.delete('/api/carrinho/:id', autenticarToken, (req, res) => {
  const { id } = req.params;
  carrinho = carrinho.filter(i => i.id != id);
  res.status(204).send();
});

// Esvaziar carrinho
app.delete('/api/carrinho', autenticarToken, (req, res) => {
  carrinho = [];
  res.status(204).send();
});

// Login
app.post('/login', async (req, res) => {
  const { nome, senha } = req.body;

  const usuario = usuarios.find(u => u.nome === nome);
  if (!usuario) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: usuario.id, nome: usuario.nome }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

/* 
  Abaixo, as funções front (JavaScript para chamar a API), 
  que você pode colocar num arquivo JS que será carregado junto com seus HTMLs.
*/

const API_BASE = 'http://localhost:3000'; // ajustar se necessário

async function buscarProdutos() {
  try {
    const res = await fetch(`${API_BASE}/api/produtos`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (!res.ok) throw new Error('Erro ao buscar produtos');

    const produtos = await res.json();
    const lista = document.getElementById('listaProdutos');
    lista.innerHTML = '';

    produtos.forEach(produto => {
      const li = document.createElement('li');
      li.textContent = `${produto.nome} - R$ ${produto.preco.toFixed(2)}`;

      const btn = document.createElement('button');
      btn.textContent = 'Adicionar';
      btn.onclick = () => adicionarAoCarrinho(produto.id);

      li.appendChild(btn);
      lista.appendChild(li);
    });

  } catch (err) {
    document.getElementById('mensagemErro').textContent = err.message;
  }
}

async function adicionarAoCarrinho(idProduto) {
  try {
    const res = await fetch(`${API_BASE}/api/carrinho`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ idProduto, quantidade: 1 })
    });

    if (!res.ok) throw new Error('Erro ao adicionar ao carrinho');
    buscarCarrinho();
  } catch (err) {
    alert(err.message);
  }
}

async function buscarCarrinho() {
  try {
    const res = await fetch(`${API_BASE}/api/carrinho`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (!res.ok) throw new Error('Erro ao buscar carrinho');

    const itens = await res.json();
    document.getElementById('contadorCarrinho').textContent = itens.length;

    const div = document.getElementById('carrinho');
    div.innerHTML = '<h3>Seu Carrinho</h3><ul>' +
      itens.map(i => `<li>${i.nome} (Qtd: ${i.quantidade})</li>`).join('') +
      '</ul>';
  } catch (err) {
    console.error(err.message);
  }
}

// Você pode chamar buscarProdutos() e buscarCarrinho() no seu JS após o carregamento da página,
// por exemplo, dentro de window.onload ou equivalente, para popular a página.

