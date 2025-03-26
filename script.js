const CONFIG = {
  CSV_FILE: 'produtos.csv'
};

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();
  renderCart(); // Atualiza exibição do carrinho se já houver itens
});

// Carrega e parseia o CSV
async function loadProducts() {
  try {
    const response = await fetch(CONFIG.CSV_FILE);
    if (!response.ok) throw new Error(`Erro ao carregar arquivo CSV: ${response.statusText}`);
    const csvText = await response.text();
    products = parseCSV(csvText);
  } catch (error) {
    console.error('Erro ao carregar CSV, usando dados de teste:', error);
    products = [
      { id: '1', nome: 'Brinquedo Arranhador p/ Gatos', referencia: 'REF001', descricao: 'Cores diversas', valor: 45.5, imagem: 'cat-toy.jpg', categoria: 'Pets' },
      { id: '2', nome: 'Bebedouro Quadrado', referencia: 'REF002', descricao: '1,5 L - Lançamento', valor: 25.0, imagem: 'water-bowl.jpg', categoria: 'Pets' },
      { id: '3', nome: 'Caminha Pet Confort', referencia: 'REF003', descricao: 'Diversos tamanhos', valor: 99.9, imagem: 'bed.jpg', categoria: 'Camas' },
      { id: '4', nome: 'Brinquedo Bola Interativa', referencia: 'REF004', descricao: 'Dispensa petiscos', valor: 39.9, imagem: 'toy-ball.jpg', categoria: 'Pets' },
      { id: '5', nome: 'Comedouro Duplo', referencia: 'REF005', descricao: '2 em 1', valor: 59.0, imagem: 'double-bowl.jpg', categoria: 'Pets' },
    ];
  }

  populateCategorySelect(products);
  renderProducts(products);
}

// Converte o texto CSV em um array de objetos
function parseCSV(csvText) {
  const rows = csvText.trim().split('\n');
  rows.shift();
  return rows.map(row => {
    const cols = row.split(',');
    const valorNumerico = parseFloat(cols[4]?.replace(/"/g, '').trim()) || 0.0;
    return {
      id: cols[0]?.trim(),
      nome: cols[1]?.trim() || 'Sem Nome',
      referencia: cols[2]?.trim() || '',
      descricao: cols[3]?.trim() || '',
      valor: valorNumerico,
      imagem: cols[5]?.trim() || 'placeholder.jpg',
      categoria: cols[6]?.trim() || 'Outros'
    };
  });
}

// Preenche o <select> de categorias
function populateCategorySelect(productsArray) {
  const categorySelect = document.getElementById('category-select');
  const categories = ['Todas as Linhas', ...new Set(productsArray.map(p => p.categoria))];
  categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Renderiza produtos no grid
function renderProducts(productsArray) {
  const productsGrid = document.getElementById('products-grid');
  productsGrid.innerHTML = '';

  productsArray.forEach((product) => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <img src="images/${product.imagem}" alt="${product.nome}" onerror="this.src='images/placeholder.jpg'">
      <h3 class="product-name">${product.nome}</h3>
      <p class="product-ref">Ref: ${product.referencia}</p>
      <p class="product-desc">${product.descricao}</p>
      <p class="product-price">R$ ${product.valor.toFixed(2)}</p>
      <button class="add-to-cart-btn" onclick="openAddToCartModal('${product.id}')">Adicionar</button>
    `;
    productsGrid.appendChild(productCard);
  });
}

// Abre o modal para adicionar o produto ao carrinho
function openAddToCartModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = `
    <h2>${product.nome}</h2>
    <p><strong>Ref:</strong> ${product.referencia}</p>
    <p><strong>Preço:</strong> R$ ${product.valor.toFixed(2)}</p>
    <div>
      <label for="modal-qty">Quantidade:</label>
      <input type="number" id="modal-qty" value="1" min="1">
      <button onclick="addToCartFromModal('${product.id}')">Adicionar</button>
    </div>
  `;

  document.getElementById('product-modal').style.display = 'block';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

// Adiciona o produto ao carrinho com a quantidade escolhida
function addToCartFromModal(productId) {
  const qtyInput = document.getElementById('modal-qty');
  const qty = parseInt(qtyInput.value) || 1;
  addToCart(productId, qty);
  closeProductModal();
}

// Adiciona o produto ao carrinho
function addToCart(productId, qty) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const index = cart.findIndex(item => item.id === productId);
  if (index >= 0) {
    cart[index].quantity += qty;
  } else {
    cart.push({ ...product, quantity: qty });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

// Atualiza contador do carrinho
function updateCartCount() {
  const cartCountElem = document.getElementById('cart-count');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountElem.textContent = totalItems;
}

// Exibe/oculta modal do carrinho
function toggleCart() {
  const modal = document.getElementById('cart-modal');
  if (modal.style.display === 'block') {
    modal.style.display = 'none';
  } else {
    modal.style.display = 'block';
    renderCart();
  }
}

// Renderiza itens do carrinho no modal
function renderCart() {
  const cartItemsElem = document.getElementById('cart-items');
  const cartTotalElem = document.getElementById('cart-total');

  if (cart.length === 0) {
    cartItemsElem.innerHTML = `<p>Seu carrinho está vazio.</p>`;
    cartTotalElem.textContent = 'Total: R$ 0,00';
    return;
  }

  let total = 0;
  cartItemsElem.innerHTML = cart.map((item, index) => {
    const itemTotal = item.quantity * item.valor;
    total += itemTotal;
    return `
      <div class="cart-item">
        <img
          src="images/${item.imagem}"
          alt="${item.nome}"
          class="cart-item-img"
          onerror="this.src='images/placeholder.jpg'"
        >
        <div class="cart-item-info">
          <p class="cart-item-name">${item.nome}</p>
          <p class="cart-item-price">R$ ${item.valor.toFixed(2)}</p>
          <div class="cart-item-controls">
            <button onclick="decreaseQty(${index})">-</button>
            <input type="number" min="1" value="${item.quantity}" onchange="updateCartItem(${index}, this.value)">
            <button onclick="increaseQty(${index})">+</button>
            <button class="remove-btn" onclick="removeFromCart(${index})">&times;</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  cartTotalElem.textContent = `Total: R$ ${total.toFixed(2)}`;
}

// Atualiza quantidade do item
function updateCartItem(index, newQty) {
  const qty = parseInt(newQty);
  if (qty < 1) return;
  cart[index].quantity = qty;
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function decreaseQty(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }
}

function increaseQty(index) {
  cart[index].quantity++;
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

// Remove item do carrinho
function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

// Limpa todo o carrinho
function clearCart() {
  if (confirm('Deseja limpar o carrinho?')) {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }
}

// Envia orçamento via WhatsApp
function sendWhatsApp() {
  if (cart.length === 0) {
    alert('Carrinho vazio!');
    return;
  }
  const total = cart.reduce((sum, item) => sum + (item.valor * item.quantity), 0);
  const message = `*Orçamento Solicitado*:\n\n` +
    cart.map(item => `➤ ${item.nome} - ${item.quantity} x R$ ${item.valor.toFixed(2)}`).join('\n') +
    `\n\n*Total: R$ ${total.toFixed(2)}*`;
  window.open(`https://wa.me/5521999999999?text=${encodeURIComponent(message)}`, '_blank');
}
