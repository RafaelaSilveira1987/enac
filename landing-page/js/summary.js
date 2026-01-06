// app-unified.js - Sistema unificado de inscrição
import { apiGet } from './services/apiGet.js';
import { apiDelete } from './services/apiDelete.js';



function showAlert(el, msg, type) {
  if (!el) return;
  el.textContent = msg || "";
  el.className = "alert " + (type || "info");
  el.style.display = "block";
}

function hideAlert(el) {
  if (!el) return;
  el.style.display = "none";
}

function showTempAlert(el, msg, type) {
  showAlert(el, msg, type);
  setTimeout(() => hideAlert(el), 3500);
}

function formatCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ===== SUMMARY PAGE =====
const list = document.getElementById("participantsCards");
const counter = document.getElementById("participantCount");
const totalAmount = document.getElementById("totalAmount");
const priceBreakdown = document.getElementById("priceBreakdown");
const totalPrice = document.getElementById("totalPrice");
const clearBtn = document.getElementById("clearCartBtn");
const finalizeBtn = document.getElementById("finalizeBtn");
const alertEl = document.getElementById("summaryAlert");


async function render() {
  const res = await apiGet('/list-inscricao', true);

  console.log(res);

  // garante sempre um array
  const inscricoes = Array.isArray(res) ? res : (res ? [res] : []);

  if (inscricoes.length === 0) {
    list.innerHTML =
      '<div class="no-participants">Nenhum participante adicionado</div>';
    counter.textContent = "0";
    priceBreakdown.innerHTML =
      '<div style="text-align: center; color: #999;">Adicione participantes para ver o resumo</div>';
    totalPrice.textContent = "R$ 0,00";
    return;
  }

  list.innerHTML =
    '<div class="no-participants">Nenhum participante adicionado</div>';
    
  //lista de inscrições
  list.innerHTML = inscricoes
    .map((p) => {
      return `
      <div class="participant-item">
        <div class="participant-info">
          <div class="participant-name">${p.nome_inscrito}</div>

          <div class="participant-details">

          ${p.modalitie == '1' || p.modalitie == '2'
          ? `
            <div class="detail-item">
              <span class="detail-value">Responsável: ${p.nome_responsavel} -- CPF: ${formatCPF(p.responsavel)}</span>
            </div>
            `
          : `
            <div class="detail-item">
              <span class="detail-value">${formatCPF(p.responsavel)}</span>
            </div>
          `}


            <div class="detail-item">
              <span class="detail-value">${p.nascimento_formatado} -- ${p.desc_modalitie}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Idade</span>
              <span class="detail-value">${p.idade} anos</span>
            </div>

            ${p.descricao_cupom?.trim()
          ? `
              <div class="detail-item">
                <div class="price-value">R$ ${p.valor_original || '0.00'}  ➜  R$ ${p.liquido || '0.00'}</div>
              </div>
              `
          : `
              <div class="detail-item">
                <div class="price-value">R$ ${p.liquido || '0.00'}</div>
              </div>
            `}



            ${p.descricao_cupom?.trim()
          ? `
              <div class="detail-item">
                <span class="detail-value">Cupom: ${p.descricao_cupom}</span>
              </div>
              `
          : ``}
          </div>

        </div> 

        <div class="price-display">
          <button class="remove-btn btn btn-secondary" data-id="${p.id}" title="Remover">Remover</button>
        </div>
      </div>
    `;
    })
    .join("");

  list.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseFloat(btn.getAttribute("data-id"));
      deleteInscricao(id);
    });
  });

  //soma valores
  const soma = inscricoes.reduce((total, item) => {
    return total + Number(item.liquido);
  }, 0);

  const total_formatado = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(soma);

  //contador de inscrições
  counter.innerHTML = inscricoes.length
  totalAmount.innerHTML = total_formatado




  /*
  // Resumo de preços
  const total = inscricoes.reduce((sum, p) => sum + p.price, 0);

  const breakdown = inscricoes.map((p) => {
    let couponInfo = "";
    if (p.coupon) {
      const discount = p.basePrice ? p.basePrice - p.price : 0;
      couponInfo = ` <small style="color: #f44336;">(cupom: ${p.coupon
        } - R$ ${discount.toFixed(2).replace(".", ",")})</small>`;
    }
    return `
          <div class="price-item">
            <span class="price-item-name">${p.name} (${getCategoryLabel(
      p.category
    )})${couponInfo}</span>
            <span class="price-item-value">R$ ${p.price
        .toFixed(2)
        .replace(".", ",")}</span>
          </div>
        `;
  });

  priceBreakdown.innerHTML = breakdown.join("");
  totalPrice.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`;
  */
}

render();

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (confirm("Deseja realmente limpar todas as inscrições?")) {
      localStorage.removeItem(storageKey());
      render();
      showTempAlert(
        alertEl,
        "Todas as inscrições foram removidas",
        "success"
      );
    }
  });
}

if (finalizeBtn) {
  finalizeBtn.addEventListener("click", () => {
    const inscricoes = loadInscricoes();
    if (inscricoes.length === 0) {
      showTempAlert(
        alertEl,
        "Adicione pelo menos um participante",
        "danger"
      );
      return;
    }
    alert(
      `Inscrição finalizada!\n\nTotal: ${inscricoes.length
      } participante(s)\nValor: R$ ${inscricoes
        .reduce((s, p) => s + p.price, 0)
        .toFixed(2)
        .replace(".", ",")}`
    );
    // Aqui integraria com gateway de pagamento
  });
}

async function deleteInscricao(id) {

  Swal.fire({
    title: 'Confirma exclusão?',
    text: 'Essa ação não poderá ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      const res = apiDelete(`/delete-inscricao/${id}`, true);
      showTempAlert(alertEl, "Participante removido", "success");
      render();
    }
  });

}

