const CONFIG = {
  CSV_FILE: 'produtos.csv'
};

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();
  renderCart();

  // Função para alternar a exibição do menu mobile com transição
  const menuToggle = document.getElementById('menu-toggle');
  menuToggle.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('open');
  });
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
      {
        id: '1',
        nome: 'Produto Teste',
        referencia: 'REF001',
        descricao: 'Descrição teste',
        valor: 10.90,
        imagem: 'teste.jpg',
        categoria: 'Exemplo',
        subcategoria: 'Variante',
        produto_pai: '100',
        cor: 'blue'
      },
      {
        id: '2',
        nome: 'Produto Teste Variante',
        referencia: 'REF002',
        descricao: 'Descrição teste',
        valor: 11.90,
        imagem: 'teste2.jpg',
        categoria: 'Exemplo',
        subcategoria: 'Variante',
        produto_pai: '100',
        cor: 'red'
      },
      {
        id: '3',
        nome: 'Produto Simples',
        referencia: 'REF003',
        descricao: 'Sem variação',
        valor: 15.00,
        imagem: 'simples.jpg',
        categoria: 'Exemplo',
        subcategoria: 'Outros'
        // sem produto_pai e cor
      }
    ];
  }
  populateCategorySelect(products);
  renderProducts(products);  // Renderiza com filtro por categoria/subcategoria e unificação por produto pai
}

// Função parseCSV (leva em conta as novas colunas "produto_pai" e "cor")
function parseCSV(csvText) {
  const rows = csvText.trim().split('\n');
  rows.shift(); // Remove o cabeçalho
  return rows.map(row => {
    const cols = row.split(',');
    return {
      id: cols[0].trim(),
      nome: cols[1].trim(),
      referencia: cols[2].trim(),
      descricao: cols[3].trim(),
      valor: parseFloat(cols[4].trim()),
      imagem: cols[5].trim(),
      categoria: cols[6].trim(),
      subcategoria: cols[7].trim(),
      produto_pai: cols[8] ? cols[8].trim() : null, // Novo campo para unificar variações
      cor: cols[9] ? cols[9].trim() : null          // Novo campo que define a cor
    };
  });
}

// Preenche os <select> de categorias e subcategorias
function populateCategorySelect(productsArray) {
  const categorySelect = document.getElementById('category-select');
  const categories = ['Todas as Linhas', ...new Set(productsArray.map(p => p.categoria))];
  categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  const subcategorySelect = document.getElementById('subcategory-select');
  const subcategories = ['Todas as Subcategorias', ...new Set(productsArray.map(p => p.subcategoria))];
  subcategorySelect.innerHTML = subcategories.map(subcat => `<option value="${subcat}">${subcat}</option>`).join('');
}

// Filtra os produtos pela categoria e subcategoria selecionadas
function handleCategoryFilter() {
  const selectedCategory = document.getElementById('category-select').value;
  const selectedSubcategory = document.getElementById('subcategory-select').value;

  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'Todas as Linhas' || product.categoria === selectedCategory;
    const subcategoryMatch = selectedSubcategory === 'Todas as Subcategorias' || product.subcategoria === selectedSubcategory;
    return categoryMatch && subcategoryMatch;
  });
  renderProducts(filteredProducts);
}

/*
  Renderização combinada:
  1. Agrupa os produtos por categoria e subcategoria (para manter o filtro).
  2. Dentro de cada subcategoria, agrupa os produtos por "produto_pai".
     - Se houver mais de uma variação (produto pai definido), unifica em uma ficha com ícones de cor.
     - Caso contrário, exibe o card padrão.
*/
function renderProducts(productsArray) {
  const productsGrid = document.getElementById('products-grid');
  const categoryHeader = document.getElementById('category-header');
  productsGrid.innerHTML = '';
  categoryHeader.innerHTML = '';

  // Agrupa por categoria e subcategoria
  const groupedByCat = {};
  productsArray.forEach(product => {
    const cat = product.categoria;
    const subcat = product.subcategoria;
    if (!groupedByCat[cat]) {
      groupedByCat[cat] = {};
    }
    if (!groupedByCat[cat][subcat]) {
      groupedByCat[cat][subcat] = [];
    }
    groupedByCat[cat][subcat].push(product);
  });

  Object.keys(groupedByCat).forEach(category => {
    const categorySection = document.createElement('div');
    categorySection.className = 'category-section';
    
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'category-title';
    categoryTitle.innerHTML = `<h2>${category}</h2>`;
    categorySection.appendChild(categoryTitle);

    Object.keys(groupedByCat[category]).forEach(subcategory => {
      const subcategoryTitle = document.createElement('div');
      subcategoryTitle.className = 'subcategory-title';
      subcategoryTitle.innerHTML = `<h3>${subcategory}</h3>`;
      categorySection.appendChild(subcategoryTitle);

      // Dentro da subcategoria, agrupa por produto pai
      const productsInSubcat = groupedByCat[category][subcategory];
      const groupedByParent = {};
      productsInSubcat.forEach(product => {
        // Se houver produto_pai, utiliza-o; senão, usa o id próprio
        const parentId = product.produto_pai ? product.produto_pai : product.id;
        if (!groupedByParent[parentId]) {
          groupedByParent[parentId] = {
            produtoPai: parentId,
            // Use os dados da primeira variação (pode ser ajustado se necessário)
            nome: product.nome,
            descricao: product.descricao,
            variations: []
          };
        }
        groupedByParent[parentId].variations.push(product);
      });

      // Cria a grid para os produtos (unificados ou não)
      const productGrid = document.createElement('div');
      productGrid.className = 'subcategory-products';
      
      Object.values(groupedByParent).forEach(productGroup => {
        if (productGroup.variations.length > 1) {
          // Há variações para unificar
          const defaultVariation = productGroup.variations[0];
          const productCard = document.createElement('div');
          productCard.className = 'product-card';
          productCard.innerHTML = `
            <img id="product-image-${productGroup.produtoPai}" src="images/${defaultVariation.imagem}" alt="${defaultVariation.nome}" onerror="this.onerror=null;this.src='images/semfoto.png';">
            <h3>${productGroup.nome}</h3>
            <p>${productGroup.descricao}</p>
            <p id="product-price-${productGroup.produtoPai}">R$ ${defaultVariation.valor.toFixed(2)}</p>
            <div class="color-options" id="color-options-${productGroup.produtoPai}"></div>
            <button class="add-to-cart-btn" onclick="openProductModal('${defaultVariation.id}')">Adicionar ao carrinho</button>
          `;
          const colorOptionsDiv = productCard.querySelector(`#color-options-${productGroup.produtoPai}`);
          productGroup.variations.forEach(variation => {
            if (variation.cor) {
              const colorIcon = document.createElement('span');
              colorIcon.className = 'color-icon';
              colorIcon.title = variation.cor;
              colorIcon.style.backgroundColor = variation.cor;
              colorIcon.style.cursor = 'pointer';
              colorIcon.onclick = () => {
                document.getElementById(`product-image-${productGroup.produtoPai}`).src = `images/${variation.imagem}`;
                document.getElementById(`product-price-${productGroup.produtoPai}`).textContent = `R$ ${variation.valor.toFixed(2)}`;
                const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
                addToCartBtn.setAttribute('onclick', `openProductModal('${variation.id}')`);
              };
              colorOptionsDiv.appendChild(colorIcon);
            }
          });
          productGrid.appendChild(productCard);
        } else {
          // Apenas um produto – renderiza o card simples
          const variation = productGroup.variations[0];
          const productCard = document.createElement('div');
          productCard.className = 'product-card';
          productCard.innerHTML = ` 
            <img src="images/${variation.imagem}" alt="${variation.nome}" onerror="this.onerror=null;this.src='images/semfoto.png';">
            <h3 class="product-name">${variation.nome}</h3>
            <p class="product-ref">Ref: ${variation.referencia}</p>
            <p class="product-desc">${variation.descricao}</p>
            <p class="product-price">R$ ${variation.valor.toFixed(2)}</p>
            <button class="add-to-cart-btn" onclick="openProductModal('${variation.id}')">Adicionar ao carrinho</button>
          `;
          productGrid.appendChild(productCard);
        }
      });
      categorySection.appendChild(productGrid);
    });
    productsGrid.appendChild(categorySection);
  });
}



// ---------------------- Modal de Produto ----------------------

// Abre o modal para seleção de quantidade
function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>${product.nome}</h2>
    <p>${product.descricao}</p>
    <p>Preço: R$ ${product.valor.toFixed(2)}</p>
    <div class="quantity-controls" style="margin: 15px 0;">
      <button onclick="modalDecreaseQuantity()">-</button>
      <span id="modal-quantity-value" style="margin: 0 10px;">1</span>
      <button onclick="modalIncreaseQuantity()">+</button>
    </div>
    <button onclick="confirmAddToCart('${product.id}')">Adicionar ao Carrinho</button>
  `;
  modal.style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

function confirmAddToCart(productId) {
  const quantityElement = document.getElementById('modal-quantity-value');
  const quantity = parseInt(quantityElement.textContent);
  
  if (isNaN(quantity) || quantity <= 0) {
    alert('Por favor, insira uma quantidade válida.');
    return;
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  addToCart(product, quantity);
  closeProductModal();
}

function modalIncreaseQuantity() {
  const quantityElement = document.getElementById("modal-quantity-value");
  let quantity = parseInt(quantityElement.textContent);
  quantity++;
  quantityElement.textContent = quantity;
}

function modalDecreaseQuantity() {
  const quantityElement = document.getElementById("modal-quantity-value");
  let quantity = parseInt(quantityElement.textContent);
  if (quantity > 1) {
    quantity--;
    quantityElement.textContent = quantity;
  }
}

// ---------------------- Carrinho ----------------------

// Adiciona o produto ao carrinho ou atualiza a quantidade se já existir
function addToCart(product, quantity) {
  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const cartCountElement = document.getElementById('cart-count');
  let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountElement.innerText = totalItems;
}

function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  cartItemsContainer.innerHTML = '';

  cart.forEach((item) => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';

    cartItem.innerHTML = `
      <img src="images/${item.imagem}" alt="${item.nome}" class="cart-item-thumbnail" onerror="this.onerror=null;this.src='images/semfoto.png';">
      <div class="cart-item-info">
        <h4>${item.nome}</h4>
        <p>R$ ${item.valor.toFixed(2)}</p>
      </div>
      <div class="quantity-controls">
        <button onclick="decreaseQuantity('${item.id}')">-</button>
        <span>${item.quantity}</span>
        <button onclick="increaseQuantity('${item.id}')">+</button>
      </div>
      <button class="remove-item-btn" onclick="removeCartItem('${item.id}')">&times;</button>
    `;
    cartItemsContainer.appendChild(cartItem);
  });
  updateCartTotal();
}

function updateCartTotal() {
  const totalElement = document.getElementById('cart-total');
  let total = cart.reduce((sum, item) => sum + (item.valor * item.quantity), 0);
  totalElement.innerText = `Total: R$ ${total.toFixed(2)}`;
}

function increaseQuantity(productId) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity++;
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }
}

function decreaseQuantity(productId) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      cart = cart.filter(item => item.id !== productId);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }
}

function removeCartItem(productId) {
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

// Função para limpar o carrinho (ajustada)
function clearCart() {
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function toggleCart() {
  const cartModal = document.getElementById('cart-modal');
  if (cartModal.style.display === 'flex') {
    cartModal.style.display = 'none';
  } else {
    cartModal.style.display = 'flex';
    renderCart();
  }
}

// ---------------------- Geração de PDF ----------------------

function generatePDF() {
  const catalogElement = document.getElementById('products-grid');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'a4');
  const margin = 20;
  const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  
  html2canvas(catalogElement, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    
    let position = margin;
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    
    let heightLeft = imgHeight - (pdf.internal.pageSize.getHeight() - margin);
    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - heightLeft;
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }
    
    pdf.save('catalogo.pdf');
  });
}

// ---------------------- Enviar Pedido via WhatsApp ----------------------

function sendWhatsApp() {
  if (cart.length === 0) {
    alert("O carrinho está vazio!");
    return;
  }

  let message = "Olá, gostaria de fazer um pedido:\n\n";
  cart.forEach(item => {
    message += `Produto: ${item.nome}\nQuantidade: ${item.quantity}\nPreço: R$ ${item.valor.toFixed(2)}\n\n`;
  });
  let total = cart.reduce((sum, item) => sum + (item.valor * item.quantity), 0);
  message += `Total: R$ ${total.toFixed(2)}`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappNumber = "5551981529567"; // Substitua pelo número desejado (formato internacional, sem o "+")
  const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  window.open(url, '_blank');
}
