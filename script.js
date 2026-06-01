document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DADOS E CONFIGURAÇÃO DA LOJA ---
    const totalProdutos = 50;
    const itensPorPagina = 12;
    let paginaAtual = 1;

    // Desconto de 5% para PIX
    const DESCONTO_PIX = 0.05; 

    // Cores (puxadas do CSS)
    const corSecundaria = '#FF00FF'; 
    const corPrimaria = '#00FFFF'; 

    // Lista de 50 produtos simulados
    const listaProdutos = Array.from({ length: totalProdutos }, (_, i) => ({
        id: i + 1,
        nome: `Produto Vibe ${i + 1}`,
        preco: parseFloat((59.90 + i * 5).toFixed(2)), 
        tag: i < 5 ? 'NOVO' : (i < 10 ? 'OFERTA' : ''),
        alt: `Imagem do Produto Vibe #${i + 1}`,
        imagemUrl: `produto_${i + 1}.jpg` 
    }));

    // Personalização de produtos
    function atualizarProduto(id, nome, preco, tag) {
        const indice = id - 1; 
        if (listaProdutos[indice]) {
            if (nome !== undefined) listaProdutos[indice].nome = nome;
            if (preco !== undefined) listaProdutos[indice].preco = preco;
            if (tag !== undefined) listaProdutos[indice].tag = tag;
        }
    }

    // [CORREÇÃO CRÍTICA]: Trocado "50% OFF" por "OFF 50%" para gerar a classe válida ".off50"
    atualizarProduto(1, "Camiseta Polo Nike - Últimas Unidades!", 199.00, "🔥 OFF 10%");
    atualizarProduto(2, "Tênis LED NIKE EDIÇÃO", 349.90, "OFERTA");
    atualizarProduto(18, "Meia Estampa Psicodélica", 29.90, "BAIXO PREÇO");
    atualizarProduto(40, "Boné Holográfico (LIQUIDAÇÃO)", 79.90, "LIQUIDA");
    atualizarProduto(1, "Camiseta Exclusiva do Festival de Cores - Últimas Unidades!", 125.00, "🔥 OFF 50%");
    atualizarProduto(5, "Tênis LED Max Vibração", 349.90, "LANÇAMENTO");
    atualizarProduto(18, "Meia Estampa Psicodélica", 29.90, "BAIXO PREÇO");
    atualizarProduto(40, "Boné Holográfico (LIQUIDAÇÃO)", 79.90, "LIQUIDA");
    atualizarProduto(3, "Jaqueta Bobojaco (LIQUIDAÇÃO)", 239.90, "LANÇAMENTO");

    // --- 2. GESTÃO DE ESTADO DO CARRINHO ---
    let carrinhoItens = [];

    // --- 3. ELEMENTOS E CONSTANTES DO DOM ---
    // .carrinho é o elemento principal do header onde a pulsação de borda deve ocorrer
    const elementoCarrinhoHeader = document.querySelector('.carrinho'); 
    const sidebar = document.getElementById('carrinho-sidebar');
    const btnFechar = document.getElementById('fechar-carrinho');
    const contadorCarrinhoHeader = document.querySelector('.contador-carrinho');
    const containerItensCarrinho = document.getElementById('carrinho-itens');
    const elementoTotalCarrinho = document.getElementById('carrinho-total');

    // Elementos do Checkout
    const btnAbrirCheckout = document.getElementById('abrir-checkout');
    const checkoutSection = document.getElementById('checkout-section');
    const cepInput = document.getElementById('cep');
    const resumoCheckoutContainer = document.getElementById('resumo-checkout');
    const descontoPixInfo = document.getElementById('desconto-pix-info');

    // --- 4. FUNÇÕES DE UTILIDADE ---

    function getProdutoPorId(id) {
        const produtoId = parseInt(id);
        return listaProdutos.find(p => p.id === produtoId);
    }

    // --- 5. LÓGICA DO CARRINHO (Adicionar, Remover, Alterar) ---

    function adicionarAoCarrinho(botao) {
        const produtoId = botao.dataset.id;
        const produtoExistente = carrinhoItens.find(item => item.id === parseInt(produtoId));

        // Verifica se é a primeira adição
        const carrinhoVazioAntes = carrinhoItens.length === 0;

        if (produtoExistente) {
            produtoExistente.quantidade++;
        } else {
            const produto = getProdutoPorId(produtoId);
            if (produto) {
                carrinhoItens.push({
                    id: produto.id,
                    nome: produto.nome,
                    preco: produto.preco,
                    imagemUrl: produto.imagemUrl,
                    quantidade: 1
                });
            }
        }

        // Efeito Visual de Confirmação (feedback imediato no botão)
        botao.disabled = true;
        const textoOriginal = botao.textContent;
        const corFundoOriginal = botao.style.backgroundColor || corSecundaria;
        const sombraOriginal = botao.style.boxShadow || `0 0 8px rgba(255, 0, 255, 0.5)`;

        botao.textContent = 'Adicionado! 🎉';
        botao.style.backgroundColor = corPrimaria;
        botao.style.boxShadow = `0 0 15px ${corPrimaria}`;
        botao.style.transform = 'scale(1.05)';

        setTimeout(() => {
            botao.textContent = textoOriginal;
            botao.style.backgroundColor = corFundoOriginal;
            botao.style.boxShadow = sombraOriginal;
            botao.style.transform = 'scale(1)';
            botao.disabled = false;
        }, 800);

        atualizarCarrinho();

        // **Abre a sidebar automaticamente na primeira adição**
        if (carrinhoVazioAntes) {
             sidebar.classList.add('aberto');
             renderizarCarrinhoItens();
        }
    }

    window.alterarQuantidade = function(produtoId, delta) {
        const id = parseInt(produtoId);
        const produtoExistente = carrinhoItens.find(item => item.id === id);

        if (produtoExistente) {
            produtoExistente.quantidade += delta;

            if (produtoExistente.quantidade <= 0) {
                removerItem(produtoId);
            } else {
                atualizarCarrinho();
            }
        }
    }

    window.removerItem = function(produtoId) {
        const id = parseInt(produtoId);
        carrinhoItens = carrinhoItens.filter(item => item.id !== id);
        atualizarCarrinho();
    }

    // --- 6. FUNÇÕES DE RENDERIZAÇÃO E ATUALIZAÇÃO ---

    function calcularTotalBruto() {
        return carrinhoItens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    }

    function calcularDescontoEImprimir() {
        const totalBruto = calcularTotalBruto();
        const formaPagamento = document.querySelector('input[name="pagamento"]:checked')?.value || 'pix';

        let totalFinal = totalBruto;
        let descontoAplicado = 0;
        let htmlDesconto = '';

        if (formaPagamento === 'pix' && totalBruto > 0) {
            descontoAplicado = totalBruto * DESCONTO_PIX;
            totalFinal = totalBruto - descontoAplicado;

            htmlDesconto = `
                <p>
                    <span>Subtotal:</span>
                    <span style="text-decoration: line-through;">R$ ${totalBruto.toFixed(2).replace('.', ',')}</span>
                </p>
                <p>
                    <span>Desconto PIX (${(DESCONTO_PIX * 100).toFixed(0)}%):</span>
                    <span style="color: #00FF00;">- R$ ${descontoAplicado.toFixed(2).replace('.', ',')}</span>
                </p>
                <p>
                    <span>TOTAL FINAL:</span>
                    <span class="valor-final">R$ ${totalFinal.toFixed(2).replace('.', ',')}</span>
                </p>
            `;
            descontoPixInfo.classList.remove('oculto');
            descontoPixInfo.innerHTML = htmlDesconto;
        } else {
            descontoPixInfo.classList.add('oculto');
            totalFinal = totalBruto;
        }

        elementoTotalCarrinho.textContent = `R$ ${totalBruto.toFixed(2).replace('.', ',')}`;

        return totalFinal;
    }

    function atualizarCarrinho() {
        const contagemCarrinho = carrinhoItens.reduce((total, item) => total + item.quantidade, 0);
        contadorCarrinhoHeader.textContent = contagemCarrinho;
        contadorCarrinhoHeader.style.display = contagemCarrinho > 0 ? 'block' : 'none';
        
        // NOVO: Aplica o brilho pulsante neon na BORDA do carrinho se houver produtos.
        if (contagemCarrinho > 0) {
            elementoCarrinhoHeader.classList.add('pulse-neon');
        } else {
            elementoCarrinhoHeader.classList.remove('pulse-neon');
        }
        
        renderizarCarrinhoItens();
        calcularDescontoEImprimir();

        btnAbrirCheckout.disabled = carrinhoItens.length === 0;
        if (carrinhoItens.length === 0) {
            btnAbrirCheckout.textContent = 'Carrinho Vazio';
        } else {
            btnAbrirCheckout.textContent = 'FINALIZAR COMPRA';
        }
    }

    function renderizarCarrinhoItens() {
        const totalBruto = calcularTotalBruto();
        let resumoHTML = '';
        containerItensCarrinho.innerHTML = '';

        if (carrinhoItens.length === 0) {
            containerItensCarrinho.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vibrando, mas ainda está vazio! 🛍️</p>';
        } else {
            carrinhoItens.forEach(item => {
                const subtotal = item.preco * item.quantidade;

                const itemSidebarHTML = `
                    <div class="carrinho-item" data-id="${item.id}">
                        <img src="${item.imagemUrl}" alt="${item.nome}" class="item-imagem">
                        <div class="item-info">
                            <h4>${item.nome}</h4>
                            <p class="item-preco-unitario">R$ ${item.preco.toFixed(2).replace('.', ',')} /unidade</p>
                            <div class="quantidade-control">
                                <button class="btn-quantidade" onclick="alterarQuantidade(${item.id}, -1)">-</button>
                                <span class="item-quantidade">${item.quantidade}</span>
                                <button class="btn-quantidade" onclick="alterarQuantidade(${item.id}, 1)">+</button>
                            </div>
                        </div>
                        <button class="btn-remover-item" onclick="removerItem(${item.id})"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
                containerItensCarrinho.innerHTML += itemSidebarHTML;

                resumoHTML += `
                    <div class="resumo-item">
                        <span>${item.nome} (x${item.quantidade})</span>
                        <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                `;
            });
        }

        resumoCheckoutContainer.innerHTML = resumoHTML + `
            <div class="resumo-total">
                <span>Total Bruto:</span>
                <span>R$ ${totalBruto.toFixed(2).replace('.', ',')}</span>
            </div>
        `;

        calcularDescontoEImprimir();
    }

    // --- 7. GESTÃO DE FLUXO E CHECKOUT ---

    btnAbrirCheckout.addEventListener('click', () => {
        if (carrinhoItens.length === 0) return;

        sidebar.classList.remove('aberto');
        checkoutSection.classList.remove('oculto');
        checkoutSection.scrollIntoView({ behavior: 'smooth' });

        calcularDescontoEImprimir();

        document.querySelectorAll('input[name="pagamento"]').forEach(radio => {
            radio.addEventListener('change', calcularDescontoEImprimir);
        });
    });

    cepInput.addEventListener('input', (e) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            let rua = "Rua Simulada do Checkout";
            let bairro = "Bairro Simulado";
            let cidade = "Porto Alegre";

            if (cep === "90000000") {
                rua = "Avenida Simulação Central";
                bairro = "Bairro Teste Principal";
            }
            document.getElementById('rua').value = rua;
            document.getElementById('bairro').value = bairro;
            document.getElementById('cidade').value = cidade;
            document.getElementById('numero').focus();
        } else {
            document.getElementById('rua').value = '';
            document.getElementById('bairro').value = '';
            document.getElementById('cidade').value = '';
        }
    });

    document.getElementById('finalizar-pedido').addEventListener('click', () => {
        const totalPago = calcularDescontoEImprimir();
        const formaPagamento = document.querySelector('input[name="pagamento"]:checked')?.value;
        let mensagem = `🎉 Pedido Finalizado! (Simulação)\n\n`;
        mensagem += `Forma de Pagamento: ${formaPagamento ? formaPagamento.toUpperCase() : 'NÃO ESPECIFICADA'}\n`;
        mensagem += `Total a pagar: R$ ${totalPago.toFixed(2).replace('.', ',')}\n\n`;
        mensagem += `Lembrete: O processamento de pagamentos e a criação de contas exigem um Back-end.`;

        alert(mensagem);

        carrinhoItens = [];
        checkoutSection.classList.add('oculto');
        atualizarCarrinho();
        document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
    });


    // --- 8. GESTÃO DE PAGINAÇÃO E LINKS DIRETOS ---
    const containerProdutos = document.getElementById('produtos-container');
    const containerPaginacao = document.getElementById('paginacao');
    const totalPaginas = Math.ceil(totalProdutos / itensPorPagina);

    function renderizarProdutos() {
        containerProdutos.innerHTML = '';

        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const produtosDaPagina = listaProdutos.slice(inicio, fim);

        let produtoParaRolar = null;

        const cartoesHTML = [];

        produtosDaPagina.forEach(produto => {
            const precoOriginal = produto.preco;
            const precoPix = precoOriginal * (1 - DESCONTO_PIX);

            // Esta lógica gera a classe baseada na tag, agora segura para "OFF 50%"
            const tagClass = produto.tag.toLowerCase().replace(/[^a-z0-9]/g, ''); 
            const tagHTML = produto.tag ? `<div class="tag-venda ${tagClass}">${produto.tag}</div>` : '';

            // Classe do botão: btn-comprar
            const cardHTML = `
                <div class="card-produto" id="produto-${produto.id}">
                    ${tagHTML}
                    <div class="imagem-container">
                        <img src="${produto.imagemUrl}" alt="${produto.alt}" class="img-principal">

                        <img src="produto_${produto.id}_hover.jpg" alt="${produto.alt} - Hover" class="img-secundaria">
                    </div>
                    <h3>${produto.nome}</h3>
                    <p class="preco">R$ ${precoOriginal.toFixed(2).replace('.', ',')}</p>
                    <p class="preco-pix">ou R$ ${precoPix.toFixed(2).replace('.', ',')} no **PIX (5% OFF)**</p>
                    <button class="btn-comprar" data-id="${produto.id}">Adicionar ao Carrinho</button>
                </div>
            `;

            cartoesHTML.push(cardHTML);

            if (produto.id === produtoAcessadoDiretamente) {
                produtoParaRolar = `produto-${produto.id}`;
            }
        });

        // Insere todos os cartões de uma vez
        containerProdutos.innerHTML = cartoesHTML.join('');

        // CORREÇÃO CRÍTICA: Anexar o listener AGORA, após os botões existirem no DOM.
        document.querySelectorAll('.btn-comprar').forEach(botao => {
            botao.addEventListener('click', (e) => adicionarAoCarrinho(e.currentTarget));
        });

        // Lógica de rolagem...
        if (produtoParaRolar) {
            setTimeout(() => {
                const elemento = document.getElementById(produtoParaRolar);
                if(elemento) {
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    elemento.style.boxShadow = `0 0 30px 10px ${corPrimaria}`;
                    setTimeout(() => {
                        elemento.style.boxShadow = '';
                    }, 2000);
                }
                produtoAcessadoDiretamente = null;
            }, 100);
        } else {
            const produtosSection = document.getElementById('produtos');
            if (produtosSection) {
                 produtosSection.scrollIntoView({ behavior: 'smooth' });
            }
        }

        renderizarBotoesPaginacao();
    }

    // Variável para armazenar o ID do produto se for um link direto
    let produtoAcessadoDiretamente = null;

    function checarLinkDireto() {
        const hash = window.location.hash;
        if (hash.startsWith('#produto-')) {
            const produtoId = parseInt(hash.replace('#produto-', ''));
            if (produtoId > 0 && produtoId <= totalProdutos) {

                const indiceProduto = produtoId - 1;
                const paginaDestino = Math.ceil((indiceProduto + 1) / itensPorPagina);

                paginaAtual = paginaDestino;
                produtoAcessadoDiretamente = produtoId;

                return true;
            }
        }
        return false;
    }

    function renderizarBotoesPaginacao() {
        containerPaginacao.innerHTML = '';

        for (let i = 1; i <= totalPaginas; i++) {
            const botao = document.createElement('button');
            botao.textContent = i;
            botao.classList.add('btn-paginacao');

            if (i === paginaAtual) {
                botao.classList.add('ativo');
            }

            botao.addEventListener('click', () => {
                paginaAtual = i;
                renderizarProdutos();
            });

            containerPaginacao.appendChild(botao);
        }
    }

    // --- 9. INICIALIZAÇÃO ---
    if (!checarLinkDireto()) {
        paginaAtual = 1;
    }

    renderizarProdutos();
    atualizarCarrinho();

    // Gestão da Sidebar (Abrir/Fechar)
    elementoCarrinhoHeader.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que o link # no href atualize a página
        e.stopPropagation();
        sidebar.classList.add('aberto');
        renderizarCarrinhoItens();
    });

    btnFechar.addEventListener('click', () => {
        sidebar.classList.remove('aberto');
    });

    document.addEventListener('click', (event) => {
        const isClickInsideSidebar = sidebar.contains(event.target);
        // Garante que clicar no ícone do carrinho ou no contador não feche
        const isClickOnCartIcon = elementoCarrinhoHeader.contains(event.target) || contadorCarrinhoHeader.contains(event.target);

        if (sidebar.classList.contains('aberto') && !isClickInsideSidebar && !isClickOnCartIcon) {
            sidebar.classList.remove('aberto');
        }
    });
});
