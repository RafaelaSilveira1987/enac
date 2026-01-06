// app-unified.js - Sistema unificado de inscrição
import { apiGet } from './services/apiGet.js';
import { apiDelete } from './services/apiDelete.js';

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let selectedMethod = null;
let orderData = {};
let pagSeguro = null;


// ===== SUMMARY PAGE =====
const list = document.getElementById("participantsCards");
const counter = document.getElementById("participantCount");
const totalAmount = document.getElementById("totalValue");
const payAmount = document.getElementById("payAmount");
const priceBreakdown = document.getElementById("priceBreakdown");
const totalPrice = document.getElementById("totalPrice");
const clearBtn = document.getElementById("clearCartBtn");
const finalizeBtn = document.getElementById("finalizeBtn");
const alertEl = document.getElementById("summaryAlert");


async function render() {
  const res = await apiGet('/list-inscricao', true);

  // garante sempre um array
  const inscricoes = Array.isArray(res) ? res : (res ? [res] : []);

  //lista de inscrições
  const participantsList = document.getElementById('checkoutParticipants');

  participantsList.innerHTML = inscricoes
    .map((p) => {
      return `
         <div style="padding: 15px; background: white; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: #333; font-size: 16px;"> ${p.nome_inscrito}</strong>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">
                  ${p.desc_modalitie}
                </div>
              </div>
              <div style="font-weight: 600; color: #00b894; font-size: 16px;">
                ${formatMoney(p.liquido)}
              </div>
            </div>
          </div>
    `;
    })
    .join("");

  //soma valores 
  const soma = inscricoes.reduce((total, item) => {
    return total + Number(item.liquido);
  }, 0);


  //contador de inscrições
  totalAmount.innerHTML = formatMoney(soma)
  document.getElementById('cpfResponsavel').textContent = formatCPF(inscricoes[0].responsavel);
  document.getElementById('qtdParticipantes').textContent = inscricoes.length;
}

render();

// ============================================================================
// CARREGAR DADOS DO PEDIDO
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadOrderData();
  initializePaymentMethods();
  initializeFormMasks();
  initializePaymentButton();

  // Inicializar PagBank SDK (se disponível)
  if (typeof PagSeguro !== 'undefined') {
    initializePagBank();
  }
});


function loadOrderData() {
  // Busca dados do localStorage (ou pode ser de uma API)
  let data = localStorage.getItem('enacOrderData');

  // Se não houver dados, cria dados simulados para demonstração
  if (!data) {
    console.log('Nenhum pedido encontrado. Carregando dados de demonstração...');

    // Dados simulados para demonstração
    orderData = {
      cpfResponsavel: '12345678900',
      total: 650.00,
      participants: [
        {
          name: 'João Silva Santos',
          email: 'joao.silva@email.com',
          category: 'Estudante',
          price: 150.00
        },
        {
          name: 'Maria Oliveira Costa',
          email: 'maria.oliveira@email.com',
          category: 'Profissional',
          price: 350.00
        },
        {
          name: 'Pedro Henrique Souza',
          email: 'pedro.souza@email.com',
          category: 'Estudante',
          price: 150.00
        }
      ]
    };

    // Salva no localStorage para próxima vez
    localStorage.setItem('enacOrderData', JSON.stringify(orderData));

    showAlert('Usando dados de demonstração. Teste à vontade!', 'info');
  } else {
    orderData = JSON.parse(data);
  }

  displayOrderSummary();
}
function displayOrderSummary() {
  // Preencher resumo do pedido
  document.getElementById('cpfResponsavel').textContent = formatCPF(orderData.cpfResponsavel);
  document.getElementById('qtdParticipantes').textContent = orderData.participants.length;
  document.getElementById('totalValue').textContent = formatMoney(orderData.total);

  // Lista de participantes
  const participantsList = document.getElementById('checkoutParticipants');
  participantsList.innerHTML = orderData.participants.map((p, i) => `
    <div style="padding: 15px; background: white; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: #333; font-size: 16px;">${i + 1}. ${p.name}</strong>
          <div style="font-size: 14px; color: #666; margin-top: 5px;">
            ${p.category}
          </div>
        </div>
        <div style="font-weight: 600; color: #00b894; font-size: 16px;">
          ${formatMoney(p.price)}
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================================================
// MÉTODOS DE PAGAMENTO
// ============================================================================

function initializePaymentMethods() {
  const methods = document.querySelectorAll('.payment-method');

  methods.forEach(method => {
    method.addEventListener('click', function () {
      // Remover seleção anterior
      methods.forEach(m => m.classList.remove('active'));
      document.querySelectorAll('.payment-form').forEach(f => f.classList.remove('active'));

      // Adicionar nova seleção
      this.classList.add('active');
      selectedMethod = this.dataset.method;

      // Mostrar formulário correspondente
      const formMap = {
        'credit_card': 'creditCardForm',
        'pix': 'pixForm'
      };

      document.getElementById(formMap[selectedMethod]).classList.add('active');

      // Atualizar botão
      updatePayButton();
    });
  });

  // Inicializar botões de opção PIX (QR Code vs Chave)
  initializePixOptions();
}

function initializePixOptions() {
  const pixOptionBtns = document.querySelectorAll('.pix-option-btn');

  pixOptionBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      // Remover seleção anterior
      pixOptionBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pix-content').forEach(c => c.classList.remove('active'));

      // Adicionar nova seleção
      this.classList.add('active');
      const pixType = this.dataset.pixType;

      // Mostrar conteúdo correspondente
      if (pixType === 'qrcode') {
        document.getElementById('pixQRCodeContent').classList.add('active');
      } else {
        document.getElementById('pixKeyContent').classList.add('active');
      }
    });
  });
}

function updatePayButton() {
  const btnPay = document.getElementById('btnPay');

  if (!selectedMethod) {
    btnPay.disabled = true;
    btnPay.textContent = 'Selecione uma forma de pagamento';
    return;
  }

  btnPay.disabled = false;

  const buttonTexts = {
    'credit_card': '💳 Pagar com Cartão de Crédito',
    'pix': '📱 Gerar QR Code PIX'
  };

  btnPay.textContent = buttonTexts[selectedMethod];
}

// ============================================================================
// MÁSCARAS DE INPUT
// ============================================================================

function initializeFormMasks() {
  // Máscara de número do cartão
  const cardNumber = document.getElementById('cardNumber');
  if (cardNumber) {
    cardNumber.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = value.substring(0, 19);
    });

    // Preencher automaticamente para demonstração
    cardNumber.addEventListener('focus', function (e) {
      if (!e.target.value) {
        e.target.value = '4111 1111 1111 1111';
        e.target.style.color = '#999';
      }
    });

    cardNumber.addEventListener('blur', function (e) {
      if (e.target.value === '4111 1111 1111 1111') {
        e.target.style.color = '#999';
      } else {
        e.target.style.color = '#333';
      }
    });
  }

  // Máscara de validade
  const cardExpiry = document.getElementById('cardExpiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });

    // Preencher automaticamente para demonstração
    cardExpiry.addEventListener('focus', function (e) {
      if (!e.target.value) {
        e.target.value = '12/30';
        e.target.style.color = '#999';
      }
    });
  }

  // Máscara de CVV
  const cardCVV = document.getElementById('cardCVV');
  if (cardCVV) {
    cardCVV.addEventListener('input', function (e) {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });

    // Preencher automaticamente para demonstração
    cardCVV.addEventListener('focus', function (e) {
      if (!e.target.value) {
        e.target.value = '123';
        e.target.style.color = '#999';
      }
    });
  }

  // Nome no cartão
  const cardHolder = document.getElementById('cardHolder');
  if (cardHolder) {
    cardHolder.addEventListener('focus', function (e) {
      if (!e.target.value) {
        e.target.value = 'JOAO SILVA SANTOS';
        e.target.style.color = '#999';
      }
    });
  }

  // Parcelas
  const installments = document.getElementById('installments');
  if (installments) {
    installments.addEventListener('focus', function (e) {
      if (!e.target.value) {
        e.target.value = '1';
      }
    });
  }
}

// ============================================================================
// BOTÃO DE PAGAMENTO
// ============================================================================

function initializePaymentButton() {
  const btnPay = document.getElementById('btnPay');

  btnPay.addEventListener('click', async () => {
    if (!selectedMethod) {
      showAlert('Selecione uma forma de pagamento', 'error');
      return;
    }

    // Validar formulário específico
    if (!validatePaymentForm()) {
      return;
    }

    // Processar pagamento
    await processPayment();
  });
}

function validatePaymentForm() {
  if (selectedMethod === 'credit_card') {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVV = document.getElementById('cardCVV').value;
    const cardHolder = document.getElementById('cardHolder').value.trim();
    const installments = document.getElementById('installments').value;

    if (!cardNumber || cardNumber.length < 13) {
      showAlert('Número do cartão inválido', 'error');
      return false;
    }

    if (!cardExpiry || cardExpiry.length !== 5) {
      showAlert('Validade do cartão inválida', 'error');
      return false;
    }

    if (!cardCVV || cardCVV.length < 3) {
      showAlert('CVV inválido', 'error');
      return false;
    }

    if (!cardHolder) {
      showAlert('Nome no cartão é obrigatório', 'error');
      return false;
    }

    if (!installments) {
      showAlert('Selecione o número de parcelas', 'error');
      return false;
    }
  }

  return true;
}

// ============================================================================
// PROCESSAR PAGAMENTO
// ============================================================================

async function processPayment() {
  showLoading(true);

  try {
    const paymentData = {
      method: selectedMethod,
      orderData: orderData,
      paymentDetails: getPaymentDetails()
    };

    // SIMULAÇÃO - Em produção, você faria uma requisição real para sua API
    const result = await simulatePayment(paymentData);

    // OU usar sua API real:
    // const result = await callRealAPI(paymentData);

    showLoading(false);

    if (result.success) {
      handlePaymentSuccess(result);
    } else {
      showAlert(result.message || 'Erro ao processar pagamento', 'error');
    }

  } catch (error) {
    showLoading(false);
    console.error('Erro no pagamento:', error);
    showAlert('Erro ao processar pagamento. Tente novamente.', 'error');
  }
}

function getPaymentDetails() {
  const details = {};

  if (selectedMethod === 'credit_card') {
    details.card_number = document.getElementById('cardNumber').value.replace(/\s/g, '');
    details.card_expiry = document.getElementById('cardExpiry').value;
    details.card_cvv = document.getElementById('cardCVV').value;
    details.card_holder = document.getElementById('cardHolder').value;
    details.installments = document.getElementById('installments').value;
  }

  return details;
}

// ============================================================================
// SIMULAÇÃO DE PAGAMENTO (REMOVER EM PRODUÇÃO)
// ============================================================================

async function simulatePayment(paymentData) {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Log detalhado da simulação
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔄 SIMULAÇÃO DE PAGAMENTO - ENAC 2026');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Método selecionado:', paymentData.method);
  console.log('Valor total:', formatMoney(paymentData.orderData.total));
  console.log('Participantes:', paymentData.orderData.participants.length);

  if (paymentData.method === 'credit_card') {
    console.log('\n💳 CARTÃO DE CRÉDITO:');
    console.log('Número:', paymentData.paymentDetails.card_number);
    console.log('Titular:', paymentData.paymentDetails.card_holder);
    console.log('Validade:', paymentData.paymentDetails.card_expiry);
    console.log('Parcelas:', paymentData.paymentDetails.installments + 'x');
    console.log('Valor por parcela:', formatMoney(paymentData.orderData.total / paymentData.paymentDetails.installments));
  }

  console.log('═══════════════════════════════════════════════════════\n');

  // Simula resposta baseada no método
  const responses = {
    'credit_card': {
      success: true,
      message: 'Pagamento aprovado',
      transaction_id: 'TXN' + Date.now(),
      order_id: 'ENAC2026-' + Date.now(),
      payment_method: 'Cartão de Crédito',
      installments: paymentData.paymentDetails.installments,
      status: 'approved'
    },
    'pix': {
      success: true,
      message: 'QR Code gerado',
      transaction_id: 'PIX' + Date.now(),
      qrcode_text: '00020126580014br.gov.bcb.pix0136' + generateRandomString(32) + '520400005303986540' + paymentData.orderData.total.toFixed(2).replace('.', '') + '5802BR5925ENAC 2026 INSCRICOES6014BELO HORIZONTE62070503***63041D3D',
      qrcode_image: generateMockQRCode(),
      order_id: 'ENAC2026-' + Date.now(),
      payment_method: 'PIX',
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 60000).toLocaleString('pt-BR')
    }
  };

  return responses[paymentData.method];
}

// ============================================================================
// API REAL (DESCOMENTAR PARA USO EM PRODUÇÃO)
// ============================================================================

async function callRealAPI(paymentData) {
  const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    throw new Error('Erro na requisição');
  }

  return await response.json();
}

// ============================================================================
// INICIALIZAR PAGBANK SDK
// ============================================================================

async function initializePagBank() {
  try {
    // Inicializar sessão do PagBank
    // pagSeguro = await PagSeguro.PagSeguroDirectPayment.setSessionId(CONFIG.PAGBANK_PUBLIC_KEY);
    console.log('PagBank SDK inicializado (simulação)');
  } catch (error) {
    console.error('Erro ao inicializar PagBank:', error);
  }
}

// ============================================================================
// MANIPULAR SUCESSO DO PAGAMENTO
// ============================================================================

function handlePaymentSuccess(result) {
  console.log('✅ Pagamento processado:', result);

  if (selectedMethod === 'pix') {
    // Preencher dados PIX
    document.getElementById('pixQRImage').src = result.qrcode_image;
    document.getElementById('pixCode').textContent = result.qrcode_text;

    // Mostrar ambos os containers
    document.getElementById('pixQRCode').style.display = 'block';
    document.getElementById('pixKeyCode').style.display = 'block';

    // Ocultar botão de pagamento
    document.getElementById('btnPay').style.display = 'none';

    showAlert(`✅ PIX gerado com sucesso! Válido até ${result.expires_at}`, 'success');

    console.log('\n📱 PAGAMENTO PIX:');
    console.log('Pedido:', result.order_id);
    console.log('Transação:', result.transaction_id);
    console.log('Status:', result.status);
    console.log('Expira em:', result.expires_at);
    console.log('Chave PIX:', result.qrcode_text);
    console.log('\nℹ️ SIMULAÇÃO: Aguardando pagamento...');
    console.log('O usuário pode escolher entre escanear o QR Code ou copiar a chave.\n');

    // Verificar pagamento a cada 5 segundos (simulação)
    checkPixPaymentStatus(result.transaction_id, result.order_id);

  } else {
    // Cartão de crédito - redirecionar imediatamente
    showAlert(`✅ Pagamento aprovado em ${result.installments}x!`, 'success');

    console.log('\n💳 PAGAMENTO APROVADO:');
    console.log('Pedido:', result.order_id);
    console.log('Transação:', result.transaction_id);
    console.log('Método:', result.payment_method);
    console.log('Parcelas:', result.installments + 'x');
    console.log('Status:', result.status);
    console.log('\nℹ️ SIMULAÇÃO: Redirecionando em 2 segundos...\n');

    setTimeout(() => {
      console.log('➡️ Redirecionando para página de sucesso...\n');
      // Em produção, descomente:
      // window.location.href = 'success.html?order=' + result.order_id;
      showAlert('✨ Em produção, você seria redirecionado para a página de sucesso!', 'info');
    }, 2000);
  }

  // Salvar ID do pedido
  localStorage.setItem('lastOrderId', result.order_id);
  localStorage.setItem('lastTransaction', JSON.stringify(result));
}

// ============================================================================
// VERIFICAR STATUS DO PAGAMENTO PIX
// ============================================================================

function checkPixPaymentStatus(transactionId, orderId) {
  let attempts = 0;
  const maxAttempts = 60; // 5 minutos (60 * 5s)

  console.log('🔍 Iniciando verificação de status PIX...');
  console.log('Verificando a cada 5 segundos (simulação)...\n');

  const intervalId = setInterval(async () => {
    attempts++;

    console.log(`⏱️ Tentativa ${attempts}/${maxAttempts} - Aguardando pagamento...`);

    // Em produção, fazer requisição real para verificar status
    // const status = await checkPaymentStatus(transactionId);

    // Simulação: após 30 segundos (6 tentativas), marca como pago
    if (attempts >= 6) {
      clearInterval(intervalId);

      console.log('\n✅ PAGAMENTO PIX CONFIRMADO!');
      console.log('Pedido:', orderId);
      console.log('Status: PAGO');
      console.log('\nℹ️ SIMULAÇÃO: Em produção, isso seria detectado automaticamente pelo webhook do PagBank.\n');

      showAlert('✅ Pagamento PIX confirmado! Redirecionando...', 'success');

      setTimeout(() => {
        console.log('➡️ Redirecionando para página de sucesso...\n');
        // Em produção, descomente:
        // window.location.href = 'success.html?order=' + orderId;
        showAlert('✨ Em produção, você seria redirecionado para a página de sucesso!', 'info');
      }, 2000);
    }

    if (attempts >= maxAttempts) {
      clearInterval(intervalId);
      console.log('\n⚠️ Tempo limite atingido. Pagamento não confirmado na simulação.');
    }
  }, 5000); // Verifica a cada 5 segundos
}

// ============================================================================
// COPIAR CÓDIGO PIX
// ============================================================================

function copyPixCode() {
  const code = document.getElementById('pixCode').textContent;

  navigator.clipboard.writeText(code).then(() => {
    showAlert('Código PIX copiado para a área de transferência!', 'success');
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    showAlert('Erro ao copiar código', 'error');
  });
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.toggle('active', show);
}

function showAlert(message, type = 'info') {
  const alert = document.getElementById('checkoutAlert');
  alert.className = `alert alert-${type} show`;
  alert.textContent = message;

  // Auto-ocultar após 5 segundos
  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);
}

function formatMoney(value) {
  return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateMockQRCode() {
  // Gera um QR Code visual mais realista para PIX
  // Em produção, viria do PagBank

  // Usando um serviço de geração de QR Code público
  const pixCode = '00020126580014br.gov.bcb.pix0136' + generateRandomString(32);

  // Você pode usar uma API de QR Code real:
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;

  // OU retornar um placeholder:
  // return 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#fff"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="20" fill="#333">QR CODE PIX</text></svg>');
}

// ============================================================================
// EXPOR FUNÇÕES GLOBALMENTE
// ============================================================================

window.copyPixCode = copyPixCode;


