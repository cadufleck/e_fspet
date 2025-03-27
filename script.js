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
      { id: '1', nome: 'Shampoo Gato 500ml', referencia: 'REF001', descricao: 'Shampoo para gatos', valor: 10.99, imagem: 'cat-toy.jpg', categoria: 'Banho e Tosa' },
      { id: '2', nome: 'Brinquedo Arranhador', referencia: 'REF002', descricao: 'Brinquedo para gatos', valor: 25.00, imagem: 'water-bowl.jpg', categoria: 'Acessórios' }
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
    return {
      id: cols[0].trim(),
      nome: cols[1].trim(),
      referencia: cols[2].trim(),
      descricao: cols[3].trim(),
      valor: parseFloat(cols[4].trim()),
      imagem: cols[5].trim(),
      categoria: cols[6].trim()
    };
  });
}

// Preenche o <select> de categorias
function populateCategorySelect(productsArray) {
  const categorySelect = document.getElementById('category-select');
  const categories = ['Todas as Linhas', ...new Set(productsArray.map(p => p.categoria))];
  categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Filtra os produtos pela categoria selecionada
function handleCategoryFilter() {
  const selectedCategory = document.getElementById('category-select').value;
  const filteredProducts = selectedCategory === 'Todas as Linhas' ?
    products : products.filter(product => product.categoria === selectedCategory);
  renderProducts(filteredProducts);
}

// Filtra os produtos pela pesquisa
function handleSearch() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const filteredProducts = products.filter(product => product.nome.toLowerCase().includes(searchQuery));
  renderProducts(filteredProducts);
}

// Renderiza os produtos
function renderProducts(productsArray) {
  const productsGrid = document.getElementById('products-grid');
  productsGrid.innerHTML = '';

  productsArray.forEach((product) => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <img src="images/${product.imagem}" alt="${product.nome}">
      <h3 class="product-name">${product.nome}</h3>
      <p class="product-ref">Ref: ${product.referencia}</p>
      <p class="product-desc">${product.descricao}</p>
      <p class="product-price">R$ ${product.valor.toFixed(2)}</p>
      <button class="add-to-cart-btn" onclick="openProductModal('${product.id}')">Adicionar ao carrinho</button>
    `;
    productsGrid.appendChild(productCard);
  });
}

// Função para abrir o modal de quantidade
function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = `
    <div class="modal-product-info">
      <h2>${product.nome}</h2>
      <p><strong>Ref:</strong> ${product.referencia}</p>
      <p><strong>Preço:</strong> R$ ${product.valor.toFixed(2)}</p>
    </div>
    <div class="modal-qty-container">
      <label for="modal-qty">Quantidade:</label>
      <input type="number" id="modal-qty" value="1" min="1">
      <button class="modal-add-btn" onclick="addToCartFromModal('${product.id}')">Adicionar ao Carrinho</button>
    </div>
  `;
  document.getElementById('product-modal').style.display = 'block';
}

// Fecha o modal
function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

// Função para adicionar ao carrinho a partir do modal
function addToCartFromModal(productId) {
  const qty = parseInt(document.getElementById('modal-qty').value) || 1;
  addToCart(productId, qty);
  closeProductModal();
}

// Função para adicionar ao carrinho
function addToCart(productId, qty = 1) {
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

// Renderiza os itens no carrinho
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
        <img src="images/${item.imagem}" alt="${item.nome}" class="cart-item-img"> <!-- A imagem do produto -->
        <div class="cart-item-info">
          <p class="cart-item-name">${item.nome}</p>
          <p class="cart-item-ref">Ref: ${item.referencia}</p>
          <p class="cart-item-price">R$ ${item.valor.toFixed(2)}</p>
          <div class="cart-item-controls">
            <button onclick="decreaseQty(${index})">-</button>
            <input type="number" value="${item.quantity}" onchange="updateCartItem(${index}, this.value)">
            <button onclick="increaseQty(${index})">+</button>
            <button class="remove-btn" onclick="removeFromCart(${index})">&times;</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  cartTotalElem.textContent = `Total: R$ ${total.toFixed(2)}`;
}

// Decrease the quantity of an item
function decreaseQty(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }
}

// Increase the quantity of an item
function increaseQty(index) {
  cart[index].quantity++;
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

// Update quantity of an item
function updateCartItem(index, newQty) {
  const qty = parseInt(newQty);
  if (qty < 1) return;
  cart[index].quantity = qty;
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

// Remove an item from the cart
function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

// Clear the cart
function clearCart() {
  if (confirm('Deseja limpar o carrinho?')) {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }
}

// Send cart data to WhatsApp
function sendWhatsApp() {
  if (cart.length === 0) {
    alert('Carrinho vazio!');
    return;
  }
  const total = cart.reduce((sum, item) => sum + (item.valor * item.quantity), 0);
  
  const message = `*Orçamento Solicitado*:\n\n` +
    cart.map(item =>
      `➤ ${item.nome} (Ref: ${item.referencia}) - ${item.quantity}x R$ ${item.valor.toFixed(2)}`
    ).join('\n') +
    `\n\n*Total: R$ ${total.toFixed(2)}*`;
  
  window.open(`https://wa.me/5551981529568?text=${encodeURIComponent(message)}`, '_blank');
}
