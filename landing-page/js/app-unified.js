// app-unified.js - Sistema unificado de inscrição
import { apiPost } from './services/apiPost.js';


(function () {
  // ===== HELPERS =====
  function storageKey() {
    return "enac_inscricoes_v2";
  }

  function storageKeyResponsible() {
    return "enac_responsible_cpf";
  }

  function loadInscricoes() {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveInscricoes(arr) {
    localStorage.setItem(storageKey(), JSON.stringify(arr || []));
  }

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

  function maskCPF(value) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{2})/, "$1-$2")
      .substring(0, 14);
  }

  function maskPhone(value) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 15);
  }

  function validateCPF(cpf) {
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) return false;
    // Validação simples
    if (/^(\d)\1{10}$/.test(clean)) return false;
    return true;
  }

  function calculateAge(birthDate) {
    const b = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    let months = now.getMonth() - b.getMonth();
    let days = now.getDate() - b.getDate();

    if (days < 0) {
      months -= 1;
      const prev = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prev.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return { years, months, days };
  }

  function getCategory(years) {
    if (years < 4) return "crianca_ate_4";
    if (years < 10) return "crianca_4_9";
    return "adulto";
  }

  function getCategoryLabel(category) {
    const labels = {
      crianca_ate_4: "Até 4 anos",
      crianca_4_9: "4 a 9 anos",
      adulto: "Adulto",
    };
    return labels[category] || category;
  }

  function getPrice(category) {
    const prices = {
      crianca_ate_4: 0,
      crianca_4_9: 75,
      adulto: 150,
    };
    return prices[category] || 0;
  }

  function getDiscountInfo(category) {
    if (category === "crianca_4_9") {
      return "50% de desconto (R$ 75)";
    }
    if (category === "crianca_ate_4") {
      return "Gratuito";
    }
    return null;
  }

  // Cupons disponíveis (pode ser expandido)
  const VALID_COUPONS = {
    ENAC2026: { discount: 50, type: "fixed" }, // R$ 50 de desconto
    DESCONTO20: { discount: 20, type: "percent" }, // 20% de desconto
    AMIGO50: { discount: 50, type: "fixed" }, // R$ 50 de desconto
  };

  function validateCoupon(code) {
    const coupon = VALID_COUPONS[code.toUpperCase()];
    if (!coupon) return null;
    return coupon;
  }

  function calculateCouponDiscount(basePrice, coupon) {
    if (!coupon) return 0;
    if (coupon.type === "fixed") {
      return Math.min(coupon.discount, basePrice);
    }
    if (coupon.type === "percent") {
      return basePrice * (coupon.discount / 100);
    }
    return 0;
  }

  // ===== VERIFY PAGE =====
  function initVerifyPage() {
    const form = document.getElementById("verifyForm");
    const cpfInput = document.getElementById("responsibleCpf");
    const alertEl = document.getElementById("verifyAlert");

    async function startInscricao(cpf) {

      const res = await apiPost('/start', { cpf });

      if (!res?.token) {
        throw new Error('Token não retornado');
      }

      localStorage.setItem('token_inscricao', res.token);

      console.log(localStorage.getItem('token_inscricao'));

      return

    }

    if (cpfInput) {
      cpfInput.addEventListener("input", (e) => {
        e.target.value = maskCPF(e.target.value);
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const cpf = cpfInput.value.trim();

        if (!cpf) {
          showTempAlert(alertEl, "Informe um CPF", "danger");
          return;
        }

        if (!validateCPF(cpf)) {
          showTempAlert(alertEl, "CPF inválido", "danger");
          return;
        }

        //saveResponsibleCpf(cpf);
        startInscricao(cpf);
        window.location.href = "form-unified";
      });
    }
  }

  // ===== FORM PAGE =====
  function initFormPage() {
    // Obter tipo de participante da URL (type=adulto, type=crianca_4_9, etc)
    const urlParams = new URLSearchParams(window.location.search);
    let participantType = urlParams.get("type") || "adulto";

    const nameInput = document.getElementById("participantName");
    const birthInput = document.getElementById("birthDate");
    const ageDisplay = document.getElementById("ageDisplay");
    const ageText = document.getElementById("ageText");
    const priceInfo = document.getElementById("priceInfo");
    const adultFields = document.getElementById("adultFields");
    const childFields = document.getElementById("childFields");
    const form = document.getElementById("participantForm");
    const alertEl = document.getElementById("formAlert");


    let responsibleCpf = ''; //loadResponsibleCpf();
    // Se não houver CPF, redirecionar para verify.html
    if (!responsibleCpf) {
      // Para testes: descomente a linha abaixo para usar um CPF de teste
      // responsibleCpf = "12345678901"; saveResponsibleCpf(responsibleCpf);

      setTimeout(() => {
        window.location.href = "verify";
      }, 0);
      return; 
    }

    // Aplicar máscaras
    const cpfInputs = document.querySelectorAll('[id$="Cpf"]');
    cpfInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        e.target.value = maskCPF(e.target.value);
      });
    });

    const phoneInputs = document.querySelectorAll('[id$="Phone"]');
    phoneInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        e.target.value = maskPhone(e.target.value);
      });
    });

    // Mostrar/ocultar campos de adulto ou criança com base no tipo
    const showCorrectFields = () => {
      adultFields.style.display =
        participantType === "adulto" ? "block" : "none";
      childFields.style.display =
        participantType === "adulto" ? "none" : "block";
    };

    showCorrectFields();

    // Variável para armazenar cupom aplicado
    let appliedCoupon = null;

    // Elementos de cupom
    const couponInput = document.getElementById("adultCoupon");
    const couponInfo = document.getElementById("couponInfo");
    const couponMessage = document.getElementById("couponMessage");
    const couponDiscount = document.getElementById("couponDiscount");

    // Lógica de cupom para adulto - usar event delegation
    form.addEventListener("click", (e) => {
      if (
        e.target.id === "applyCouponBtn" ||
        e.target.closest("#applyCouponBtn")
      ) {
        e.preventDefault();
        e.stopPropagation();

        // Validar que os elementos existem
        if (!couponInput || !couponInfo || !couponMessage || !couponDiscount) {
          return;
        }

        const code = couponInput.value.trim();

        if (!code) {
          couponMessage.textContent = "Digite um cupom";
          couponMessage.className = "coupon-message error";
          couponInfo.style.display = "block";
          appliedCoupon = null;
          updatePriceInfo();
          return;
        }

        const coupon = validateCoupon(code);

        if (!coupon) {
          couponMessage.textContent = "Cupom inválido";
          couponMessage.className = "coupon-message error";
          couponInfo.style.display = "block";
          appliedCoupon = null;
          updatePriceInfo();
          return;
        }

        // Cupom válido
        appliedCoupon = { code: code.toUpperCase(), coupon };

        let discountText = "";
        if (coupon.type === "fixed") {
          discountText = `R$ ${coupon.discount
            .toFixed(2)
            .replace(".", ",")} de desconto`;
        } else {
          discountText = `${coupon.discount}% de desconto`;
        }

        couponMessage.textContent = `✓ Cupom "${code.toUpperCase()}" aplicado com sucesso!`;
        couponMessage.className = "coupon-message success";
        couponDiscount.innerHTML = `Desconto do cupom: ${discountText}`;
        couponInfo.style.display = "block";
        updatePriceInfo();
      }
    });

    // Remover cupom ao mudar o código
    if (couponInput) {
      couponInput.addEventListener("input", () => {
        appliedCoupon = null;
        if (couponInfo) {
          couponInfo.style.display = "none";
        }
        updatePriceInfo();
      });
    }

    // Calcular idade ao mudar data de nascimento
    if (birthInput) {
      birthInput.addEventListener("change", () => {
        if (!birthInput.value) {
          ageDisplay.style.display = "none";
          return;
        }

        const age = calculateAge(birthInput.value);
        const category = getCategory(age.years);

        ageText.textContent = `${age.years} anos${age.months ? ` e ${age.months} mês(es)` : ""
          }`;

        ageDisplay.style.display = "block";
        updatePriceInfo();
      });
    }

    function updatePriceInfo() {
      if (!birthInput.value) return;

      const age = calculateAge(birthInput.value);
      const actualCategory = getCategory(age.years);
      let price = getPrice(actualCategory);

      // Se for adulto e tiver cupom aplicado, calcular desconto
      let couponDiscountHtml = "";
      let finalPrice = price;
      if (participantType === "adulto" && appliedCoupon) {
        const couponDisc = calculateCouponDiscount(price, appliedCoupon.coupon);
        finalPrice = price - couponDisc;
        couponDiscountHtml = `<div class="price-info-item"><span class="label">Cupom</span><span class="value">-R$ ${couponDisc
          .toFixed(2)
          .replace(".", ",")}</span></div>`;
      }

      const discountInfo = getDiscountInfo(actualCategory);
      const discountHtml = discountInfo
        ? `<div class="price-info-item"><span class="label">Desconto</span><span class="value">${discountInfo}</span></div>`
        : "";

      priceInfo.innerHTML = `
        <div class="price-info-item">
          <span class="label">Categoria</span>
          <span class="value">${getCategoryLabel(actualCategory)}</span>
        </div>
        ${discountHtml}
        ${couponDiscountHtml}
        <div class="price-info-item">
          <span class="label">Preço Final</span>
          <span class="value" style="color: #ffd400; font-weight: 700">R$ ${finalPrice
          .toFixed(2)
          .replace(".", ",")}</span>
        </div>
      `;
    }

    // Submeter formulário
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const type = participantType;
        const name = nameInput.value.trim();
        const birth = birthInput.value;

        if (!name) {
          showTempAlert(alertEl, "Informe o nome", "danger");
          return;
        }

        if (!birth) {
          showTempAlert(alertEl, "Informe a data de nascimento", "danger");
          return;
        }

        const age = calculateAge(birth);
        const actualCategory = getCategory(age.years);
        const price = getPrice(actualCategory);

        // Validações específicas
        if (type === "adulto") {
          const cpf = document.getElementById("adultCpf").value.trim();
          const email = document.getElementById("adultEmail").value.trim();
          const phone = document.getElementById("adultPhone").value.trim();
          const consent = document.getElementById("adultConsent").checked;

          if (!cpf) {
            showTempAlert(alertEl, "Informe o CPF", "danger");
            return;
          }

          if (!validateCPF(cpf)) {
            showTempAlert(alertEl, "CPF inválido", "danger");
            return;
          }

          // Verificar se há outro adulto com o mesmo CPF (se houver apenas 1 adulto, aceita CPF igual)
          const arr = loadInscricoes();
          const adultCount = arr.filter((x) => x.type === "adulto").length;

          if (adultCount > 0) {
            // Já há pelo menos um adulto cadastrado
            const otherAdult = arr.find(
              (x) => x.type === "adulto" && x.cpf === cpf
            );
            if (otherAdult) {
              showTempAlert(
                alertEl,
                "Já existe um adulto cadastrado com este CPF. Por favor, use um CPF diferente.",
                "danger"
              );
              return;
            }
          }

          if (!email) {
            showTempAlert(alertEl, "Informe o email", "danger");
            return;
          }

          if (!phone) {
            showTempAlert(alertEl, "Informe o telefone", "danger");
            return;
          }

          if (!consent) {
            showTempAlert(
              alertEl,
              "Você deve concordar com os termos",
              "danger"
            );
            return;
          }

          // Coletar dados adicionais do adulto
          const city = document.getElementById("adultCity").value.trim();
          const state = document.getElementById("adultState").value.trim();
          const transport =
            document.querySelector('input[name="adultTransport"]:checked')
              ?.value || "";
          const participation =
            document.getElementById("adultParticipation").value;
          const mentoriaGroup =
            document.getElementById("adultMentoriaGroup").value;
          const volunteerAreas = Array.from(
            document.querySelectorAll(
              'input[name="adultVolunteerArea"]:checked'
            )
          ).map((x) => x.value);
          const observations = document
            .getElementById("adultObservations")
            .value.trim();

          // Calcular preço com cupom se aplicável
          let finalPrice = price;
          let couponCode = null;
          if (appliedCoupon) {
            const couponDisc = calculateCouponDiscount(
              price,
              appliedCoupon.coupon
            );
            finalPrice = price - couponDisc;
            couponCode = appliedCoupon.code;
          }

          const inscricao = {
            id: Date.now() + Math.random(),
            type: "adulto",
            name,
            birth,
            age: age.years,
            category: actualCategory,
            price: finalPrice,
            basePrice: price, // Armazenar preço original para referência
            cpf,
            email,
            phone,
            city,
            state,
            transport,
            participation,
            mentoriaGroup,
            volunteerAreas,
            observations,
            coupon: couponCode,
            responsibleCpf,
          };

          const inscricoes = loadInscricoes();
          inscricoes.push(inscricao);
          saveInscricoes(inscricoes);
        } else {
          const parentName = document.getElementById("parentName").value.trim();
          const parentCpf = document.getElementById("parentCpf").value.trim();
          const parentPhone = document
            .getElementById("parentPhone")
            .value.trim();
          const consent = document.getElementById("childConsent").checked;

          if (!parentName) {
            showTempAlert(alertEl, "Informe o nome do responsável", "danger");
            return;
          }

          if (!parentCpf) {
            showTempAlert(alertEl, "Informe o CPF do responsável", "danger");
            return;
          }

          if (!validateCPF(parentCpf)) {
            showTempAlert(alertEl, "CPF do responsável inválido", "danger");
            return;
          }

          if (!parentPhone) {
            showTempAlert(
              alertEl,
              "Informe o telefone do responsável",
              "danger"
            );
            return;
          }

          if (!consent) {
            showTempAlert(
              alertEl,
              "Você deve concordar com os termos",
              "danger"
            );
            return;
          }

          // Coletar dados adicionais da criança
          const parentCity = document.getElementById("parentCity").value.trim();
          const parentState = document
            .getElementById("parentState")
            .value.trim();
          const parentEmail = document
            .getElementById("parentEmail")
            .value.trim();

          const inscricao = {
            id: Date.now() + Math.random(),
            type: "crianca",
            name,
            birth,
            age: age.years,
            category: actualCategory,
            price,
            parentName,
            parentCpf,
            parentPhone,
            parentCity,
            parentState,
            parentEmail,
            responsibleCpf,
          };

          const arr = loadInscricoes();
          arr.push(inscricao);
          saveInscricoes(arr);
        }

        showTempAlert(
          alertEl,
          "Participante adicionado com sucesso!",
          "success"
        );
        form.reset();
        adultFields.style.display =
          participantType === "adulto" ? "block" : "none";
        childFields.style.display =
          participantType === "adulto" ? "none" : "block";
        ageDisplay.style.display = "none";
        appliedCoupon = null;
        couponInfo.style.display = "none";
      });
    }
  }

  // ===== SUMMARY PAGE =====
  function initSummaryPage() {
    /*
    let responsibleCpf = loadResponsibleCpf();
    if (!responsibleCpf) {
      // Para testes: descomente a linha abaixo para usar um CPF de teste
      // responsibleCpf = "12345678901"; saveResponsibleCpf(responsibleCpf);

      setTimeout(() => {
        window.location.href = "verify";
      }, 0);
      return;
    }*/

    const list = document.getElementById("participantsList");
    const counter = document.getElementById("participantCounter");
    const priceBreakdown = document.getElementById("priceBreakdown");
    const totalPrice = document.getElementById("totalPrice");
    const clearBtn = document.getElementById("clearCartBtn");
    const finalizeBtn = document.getElementById("finalizeBtn");
    const alertEl = document.getElementById("summaryAlert");

    function render() {
      const inscricoes = loadInscricoes();

      if (inscricoes.length === 0) {
        list.innerHTML =
          '<div class="no-participants">Nenhum participante adicionado</div>';
        counter.textContent = "0";
        priceBreakdown.innerHTML =
          '<div style="text-align: center; color: #999;">Adicione participantes para ver o resumo</div>';
        totalPrice.textContent = "R$ 0,00";
        return;
      }

      counter.textContent = inscricoes.length;

      list.innerHTML = inscricoes
        .map((p) => {
          const categoryClass = `category-${p.category}`;
          return `
            <div class="participant-card">
              <div class="participant-info">
                <div class="participant-name">${p.name}</div>
                <div class="participant-details">
                  <div class="detail-item">
                    <span class="detail-label">Data de Nascimento</span>
                    <span class="detail-value">${new Date(
            p.birth
          ).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Idade</span>
                    <span class="detail-value">${p.age} anos</span>
                  </div>
                </div>
                <span class="category-badge ${categoryClass}">${getCategoryLabel(
            p.category
          )}</span>
              </div>
              <div class="price-display">
                <div class="price-value">R$ ${p.price
              .toFixed(2)
              .replace(".", ",")}</div>
                <button class="remove-btn" data-id="${p.id
            }" title="Remover">×</button>
              </div>
            </div>
          `;
        })
        .join("");

      list.querySelectorAll(".remove-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseFloat(btn.getAttribute("data-id"));
          let arr = loadInscricoes();
          arr = arr.filter((x) => x.id !== id);
          saveInscricoes(arr);
          render();
          showTempAlert(alertEl, "Participante removido", "success");
        });
      });

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
  }

  // ===== INIT =====
  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.getAttribute("data-page");
    if (page === "verify") initVerifyPage();
    if (page === "form-unified") initFormPage();
    if (page === "summary") initSummaryPage();
  });
})();
