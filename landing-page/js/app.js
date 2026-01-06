

// app.js - lógica compartilhada entre páginas
(function () {
  // query string helper
  function qs(name) {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return params.get(name);
    } catch (e) {
      return null;
    }
  }

  // storage helpers
  function storageKey() {
    return "enac_participants_v1";
  }
  function loadParticipants() {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveParticipants(arr) {
    localStorage.setItem(storageKey(), JSON.stringify(arr || []));
  }

  // basic UI helpers
  function showAlertEl(el, msg, type) {
    if (!el) return;
    el.textContent = msg || "";
    const alertClass =
      type === "warning"
        ? "alert-warning"
        : type === "danger"
          ? "alert-danger"
          : type === "success"
            ? "alert-success"
            : "alert-info";
    el.className = "alert " + alertClass;
    el.style.display = "block";
  }
  function clearAlertEl(el) {
    if (!el) return;
    el.textContent = "";
    el.style.display = "";
    el.className = "";
  }
  function showTemporaryAlert(el, msg, type) {
    showAlertEl(el, msg, type);
    setTimeout(() => clearAlertEl(el), 3500);
  }

  function calculateAgeDetailed(birth) {
    if (!birth) return { years: 0, months: 0, days: 0 };
    const b = new Date(birth);
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

  function escapeHtml(s) {
    return String(s || "").replace(
      /[&<>\"]/g,
      (v) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[v])
    );
  }

  // ===== FORM PAGE HANDLERS =====
  function initFormPage() {
    // determinar modalidade: primeiro hash, depois query param
    let mod =
      (window.location.hash || "").replace(/^#/, "") || qs("mod") || "adulto";

    const alertEl = document.getElementById("alert");
    const participantsListRoot = document.getElementById("participantsList");

    // preços e cupons locais
    const PRICES = {
      adulto: 750,
      crianca_4_9: Math.round(750 * 0.5),
      crianca_ate_4: 0,
    };
    const COUPONS = {
      ENAC10: { type: "percent", value: 10 },
      ENAC20: { type: "percent", value: 20 },
      FRONT50: { type: "fixed", value: 50 },
      TEST100: { type: "fixed", value: 100 },
    };

    let activeCoupon = null;

    function getBasePrice(m) {
      return m === "adulto"
        ? PRICES.adulto
        : m === "crianca_4_9"
          ? PRICES.crianca_4_9
          : PRICES.crianca_ate_4;
    }
    function applyCouponToAmount(amount, couponCode) {
      if (!couponCode) return { ok: true, price: amount };
      const code = String(couponCode || "")
        .toUpperCase()
        .trim();
      const c = COUPONS[code];
      if (!c) return { ok: false, price: amount, msg: "Cupom inválido" };
      let final = amount;
      if (c.type === "percent")
        final = Math.max(0, Math.round(amount * (1 - c.value / 100)));
      else if (c.type === "fixed") final = Math.max(0, amount - c.value);
      return { ok: true, price: final, coupon: code, meta: c };
    }

    // render participantes (mantém comportamento anterior)
    function renderParticipants() {
      const arr = loadParticipants();
      if (!participantsListRoot) return;
      if (arr.length === 0) {
        participantsListRoot.innerHTML =
          '<div class="no-participants">Nenhum participante adicionado ainda</div>';
        return;
      }
      participantsListRoot.innerHTML = arr
        .map(
          (p) =>
            `<div class="participant-item"><div class="participant-info"><strong>${escapeHtml(
              p.name
            )}</strong><div style="font-size:0.9rem;color:#555">${new Date(
              p.birthDate
            ).toLocaleDateString("pt-BR")} — ${escapeHtml(
              p.modalityLabel || ""
            )}${p.motherName ? ` — Mãe: ${escapeHtml(p.motherName)}` : ""
            }</div></div><div><button class="btn btn-secondary" data-remove="${p.id
            }">Remover</button></div></div>`
        )
        .join("");
      participantsListRoot.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-remove");
          let arr = loadParticipants();
          arr = arr.filter((x) => String(x.id) !== String(id));
          saveParticipants(arr);
          renderParticipants();
          showTemporaryAlert(alertEl, "Participante removido", "success");
        });
      });
    }

    // ...existing code...

    // ===== Adult form handler =====
    const adultForm = document.getElementById("adultForm");
    const adultFields = {
      cpf: document.getElementById("adult_cpf"),
      name: document.getElementById("adult_name"),
      birthDate: document.getElementById("adult_birthDate"),
      ageText: document.getElementById("adult_ageText"),
      phone: document.getElementById("adult_phone"),
      city: document.getElementById("adult_city"),
      state: document.getElementById("adult_state"),
      email: document.getElementById("adult_email"),
      participation: document.getElementById("adult_participation"),
      mentoriaGroup: document.getElementById("adult_mentoriaGroup"),
      observations: document.getElementById("adult_observations"),
      consent: document.getElementById("adult_consent"),
    };
    const adultAddBtn = document.getElementById("addBtnAdult");
    const couponInput = document.getElementById("couponCode");
    const applyCouponBtn = document.getElementById("applyCouponBtn");
    const pricePreview = document.getElementById("pricePreview");

    // Preencher CPF se vindo do modal de modalidades
    const preFillCpf = sessionStorage.getItem("preFillCpf");
    if (preFillCpf && adultFields.cpf) {
      adultFields.cpf.value = preFillCpf;
      sessionStorage.removeItem("preFillCpf");
    }

    function renderPricePreview() {
      if (!pricePreview) return;
      const base = getBasePrice("adulto");
      const couponCode = couponInput ? couponInput.value : "";
      const res = applyCouponToAmount(base, couponCode);
      if (!res.ok) {
        pricePreview.textContent = `Preço: R$ ${base
          .toFixed(2)
          .replace(".", ",")} — ${res.msg}`;
        activeCoupon = null;
        return;
      }
      activeCoupon = res.coupon || null;
      if (res.price === base)
        pricePreview.textContent = `Preço: R$ ${base
          .toFixed(2)
          .replace(".", ",")}`;
      else
        pricePreview.textContent = `Preço: R$ ${base
          .toFixed(2)
          .replace(".", ",")} → R$ ${res.price
            .toFixed(2)
            .replace(".", ",")} (${activeCoupon})`;
    }

    if (applyCouponBtn)
      applyCouponBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        renderPricePreview();
      });

    // Máscara para CPF
    function maskCPF(value) {
      return value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{2})/, "$1-$2")
        .substring(0, 14);
    }

    // Máscara para telefone
    function maskPhone(value) {
      return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .substring(0, 15);
    }

    // Apply masks
    if (adultFields.cpf) {
      adultFields.cpf.addEventListener("input", (e) => {
        e.target.value = maskCPF(e.target.value);
      });
    }

    if (adultFields.phone) {
      adultFields.phone.addEventListener("input", (e) => {
        e.target.value = maskPhone(e.target.value);
      });
    }

    if (adultFields.birthDate)
      adultFields.birthDate.addEventListener("change", () => {
        const val = adultFields.birthDate.value;
        if (!val) {
          adultFields.ageText.value = "";
          clearAlertEl(alertEl);
          return;
        }
        const d = calculateAgeDetailed(val);
        adultFields.ageText.value = `${d.years} anos${d.months ? " e " + d.months + " mês(es)" : ""
          }`;
        if (d.years < 18)
          showAlertEl(
            alertEl,
            `Participante tem ${d.years} anos — formulário apenas para maiores de 18 anos.`,
            "warning"
          );
        else clearAlertEl(alertEl);
      });

    if (adultAddBtn)
      adultAddBtn.addEventListener("click", (e) => {
        e.preventDefault();
        clearAlertEl(alertEl);

        const cpf = adultFields.cpf.value.trim();
        const name = adultFields.name.value.trim();
        const birthDate = adultFields.birthDate.value;
        const phone = adultFields.phone.value.trim();
        const city = adultFields.city.value.trim();
        const state = adultFields.state.value.trim();
        const email = adultFields.email.value.trim();
        const participation = adultFields.participation.value;
        const mentoriaGroup = adultFields.mentoriaGroup.value;
        const observations = adultFields.observations.value.trim();
        const consent = adultFields.consent.checked;

        // Validations
        if (!cpf) {
          showTemporaryAlert(alertEl, "Preencha o CPF", "danger");
          return;
        }
        if (!name) {
          showTemporaryAlert(alertEl, "Preencha o nome completo", "danger");
          return;
        }
        if (!birthDate) {
          showTemporaryAlert(
            alertEl,
            "Preencha a data de nascimento",
            "danger"
          );
          return;
        }
        const d = calculateAgeDetailed(birthDate);
        if (d.years < 18) {
          showTemporaryAlert(
            alertEl,
            `Participante tem ${d.years} anos — formulário apenas para maiores de 18 anos.`,
            "danger"
          );
          return;
        }
        if (!phone) {
          showTemporaryAlert(alertEl, "Preencha o telefone", "danger");
          return;
        }
        if (!city) {
          showTemporaryAlert(alertEl, "Preencha a cidade", "danger");
          return;
        }
        if (!state) {
          showTemporaryAlert(alertEl, "Preencha o estado", "danger");
          return;
        }
        if (!email) {
          showTemporaryAlert(alertEl, "Preencha o email", "danger");
          return;
        }
        if (!consent) {
          showTemporaryAlert(
            alertEl,
            "É necessário aceitar os termos de consentimento",
            "danger"
          );
          return;
        }

        // Get transport selection
        const transport = Array.from(
          document.querySelectorAll('input[name="transport"]:checked')
        ).map((n) => n.value);

        // Get volunteer areas
        const volunteerAreas = Array.from(
          document.querySelectorAll('input[name="volunteerArea"]:checked')
        ).map((n) => n.value);

        // Price and coupon
        const basePrice = getBasePrice("adulto");
        const couponCodeToSave =
          activeCoupon ||
          (couponInput ? couponInput.value.trim().toUpperCase() : null);
        const couponResult = applyCouponToAmount(basePrice, couponCodeToSave);

        const arr = loadParticipants();
        const p = {
          id: Date.now() + Math.floor(Math.random() * 999),
          cpf,
          name,
          birthDate,
          phone,
          city,
          state,
          email,
          participation,
          mentoriaGroup,
          transport,
          volunteerAreas,
          observations,
          consent,
          priceBase: basePrice,
          priceFinal:
            couponResult && couponResult.ok ? couponResult.price : basePrice,
          couponCode:
            couponResult && couponResult.coupon ? couponResult.coupon : null,
          modality: "adulto",
          modalityLabel: "Adulto",
        };
        arr.push(p);
        saveParticipants(arr);
        renderParticipants();

        // Clear form
        adultFields.cpf.value = "";
        adultFields.name.value = "";
        adultFields.birthDate.value = "";
        adultFields.ageText.value = "";
        adultFields.phone.value = "";
        adultFields.city.value = "";
        adultFields.state.value = "";
        adultFields.email.value = "";
        adultFields.participation.value = "";
        adultFields.mentoriaGroup.value = "nenhum";
        adultFields.observations.value = "";
        adultFields.consent.checked = false;
        if (couponInput) couponInput.value = "";
        document
          .querySelectorAll('input[name="transport"]:checked')
          .forEach((n) => (n.checked = false));
        document
          .querySelectorAll('input[name="volunteerArea"]:checked')
          .forEach((n) => (n.checked = false));

        activeCoupon = null;
        renderPricePreview();
        showTemporaryAlert(
          alertEl,
          "Participante adicionado com sucesso",
          "success"
        );
        setTimeout(() => {
          window.location.href = "summary";
        }, 1000);
      });

    renderPricePreview();

    // ...existing code...
    const childForm = document.getElementById("childForm");
    const childFields = {
      name: document.getElementById("child_name"),
      birthDate: document.getElementById("child_birthDate"),
      ageText: document.getElementById("child_ageText"),
      fatherName: document.getElementById("child_fatherName"),
      motherName: document.getElementById("child_motherName"),
      responsiblePhone: document.getElementById("child_responsiblePhone"),
      responsibleCpf: document.getElementById("child_responsibleCpf"),
    };
    const childAddBtn = document.getElementById("addBtnChild");

    function validateChildBirth(birthVal) {
      if (!birthVal)
        return { ok: false, msg: "Preencha a data de nascimento." };
      const d = calculateAgeDetailed(birthVal);
      if (mod === "crianca_ate_4") {
        if (d.years > 3)
          return {
            ok: false,
            msg: `Esta criança tem ${d.years} anos — use o formulário 'De 4 a 9 anos'.`,
          };
      } else if (mod === "crianca_4_9") {
        if (d.years < 4)
          return {
            ok: false,
            msg: `Esta criança tem ${d.years} anos — use o formulário 'Até 3 anos'.`,
          };
        if (d.years >= 10)
          return {
            ok: false,
            msg: `Esta criança tem ${d.years} anos — fora da faixa 4-9 anos.`,
          };
      }
      return { ok: true, d };
    }

    if (childFields.birthDate)
      childFields.birthDate.addEventListener("change", () => {
        const val = childFields.birthDate.value;
        if (!val) {
          childFields.ageText.value = "";
          clearAlertEl(alertEl);
          return;
        }
        const d = calculateAgeDetailed(val);
        childFields.ageText.value = `${d.years} anos${d.months ? " e " + d.months + " mês(es)" : ""
          }`;
        const res = validateChildBirth(val);
        if (!res.ok) showAlertEl(alertEl, res.msg, "warning");
        else clearAlertEl(alertEl);
      });

    // Máscara CPF para responsável (mesma do adulto)
    if (childFields.responsibleCpf) {
      childFields.responsibleCpf.addEventListener("input", (e) => {
        e.target.value = maskCPF(e.target.value);
      });
    }

    if (childAddBtn)
      childAddBtn.addEventListener("click", (e) => {
        e.preventDefault();
        clearAlertEl(alertEl);
        const name = childFields.name.value.trim();
        const birthDate = childFields.birthDate.value;
        const fatherName = childFields.fatherName.value.trim();
        const motherName = childFields.motherName.value.trim();
        const responsiblePhone = childFields.responsiblePhone.value.trim();
        const responsibleCpf = childFields.responsibleCpf
          ? childFields.responsibleCpf.value.trim()
          : "";
        if (!name) {
          showTemporaryAlert(alertEl, "Preencha o nome completo", "danger");
          return;
        }
        if (!birthDate) {
          showTemporaryAlert(
            alertEl,
            "Preencha a data de nascimento",
            "danger"
          );
          return;
        }
        const valid = validateChildBirth(birthDate);
        if (!valid.ok) {
          showTemporaryAlert(alertEl, valid.msg, "danger");
          return;
        }
        if (!fatherName || !motherName) {
          showTemporaryAlert(
            alertEl,
            "Preencha os nomes do pai e da mãe",
            "danger"
          );
          return;
        }
        if (!responsiblePhone) {
          showTemporaryAlert(
            alertEl,
            "Preencha o telefone do responsável",
            "danger"
          );
          return;
        }
        if (!responsibleCpf) {
          showTemporaryAlert(
            alertEl,
            "Preencha o CPF do responsável",
            "danger"
          );
          return;
        }
        const basePrice = getBasePrice(mod);
        const couponResult = { ok: true, price: basePrice };
        const arr = loadParticipants();
        const p = {
          id: Date.now() + Math.floor(Math.random() * 999),
          name,
          birthDate,
          fatherName,
          motherName,
          responsiblePhone,
          cpf: responsibleCpf,
          priceBase: basePrice,
          priceFinal: couponResult.price,
          couponCode: null,
          modality: mod,
          modalityLabel: mod === "crianca_ate_4" ? "Até 4 anos" : "4 a 9 anos",
        };
        arr.push(p);
        saveParticipants(arr);
        renderParticipants(); // clear
        childFields.name.value = "";
        childFields.birthDate.value = "";
        childFields.ageText.value = "";
        childFields.fatherName.value = "";
        childFields.motherName.value = "";
        childFields.responsiblePhone.value = "";
        if (childFields.responsibleCpf) childFields.responsibleCpf.value = "";
        showTemporaryAlert(
          alertEl,
          "Participante adicionado com sucesso",
          "success"
        );
        setTimeout(() => {
          window.location.href = "summary";
        }, 1000);
      });

    // show appropriate form
    function showForms() {
      const formContainer = document.getElementById("formContainer");
      if (!formContainer) return;

      if (mod === "adulto") {
        fetch("form-adult")
          .then((response) => response.text())
          .then((html) => {
            formContainer.innerHTML = html;
            initFormPage(); // Reinitialize form logic after loading
          })
          .catch((err) => console.error("Failed to load adult form:", err));
      } else if (mod === "crianca_4_9" || mod === "crianca_ate_4") {
        fetch("form")
          .then((response) => response.text())
          .then((html) => {
            formContainer.innerHTML = html;
            initFormPage(); // Reinitialize form logic after loading
          })
          .catch((err) => console.error("Failed to load child form:", err));
      }
    }

    showForms();
    // observe hash changes
    window.addEventListener("hashchange", () => {
      mod =
        (window.location.hash || "").replace(/^#/, "") || qs("mod") || "adulto";
      showForms();
    });
  }

  // ===== CART PAGE =====
  function initCartPage() {
    const listRoot = document.getElementById("cartList");
    const alertEl = document.getElementById("cartAlert");
    const confirmBtn = document.getElementById("confirmBtn");
    const clearBtn = document.getElementById("clearBtn");

    function escapeHtml(s) {
      return String(s || "").replace(
        /[&<>\"]/g,
        (v) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[v])
      );
    }

    function render() {
      const arr = loadParticipants();
      if (arr.length === 0) {
        listRoot.innerHTML =
          '<div class="no-participants">Carrinho vazio</div>';
        return;
      }

      // construir itens com preço e cupom
      listRoot.innerHTML = arr
        .map((p, idx) => {
          const name = `<strong>${escapeHtml(p.name)}</strong>`;
          const when = `<div style="font-size:0.9rem;color:#555">${new Date(
            p.birthDate
          ).toLocaleDateString("pt-BR")} — ${escapeHtml(
            p.modalityLabel || ""
          )}</div>`;

          let details = `<div style="font-size:0.9rem;color:#666">`;
          if (p.email) details += `${escapeHtml(p.email)}`;
          if (p.phone) details += ` • ${escapeHtml(p.phone)}`;
          if (p.city)
            details += ` • ${escapeHtml(p.city)}, ${escapeHtml(p.state || "")}`;
          details += `</div>`;

          const priceBase =
            typeof p.priceBase === "number"
              ? p.priceBase
              : Number(p.priceBase || 0);
          const priceFinal =
            typeof p.priceFinal === "number"
              ? p.priceFinal
              : Number(p.priceFinal || priceBase || 0);

          let priceHtml = `<div style="font-size:0.95rem;color:#222; margin-top:8px">`;

          if (p.couponCode) {
            const discount = priceBase - priceFinal;
            priceHtml += `Preço: <del>R$ ${priceBase
              .toFixed(2)
              .replace(".", ",")}</del> → R$ ${priceFinal
                .toFixed(2)
                .replace(".", ",")}`;
            priceHtml += `<br/><small style="color:#666">Cupom: ${escapeHtml(
              p.couponCode
            )} (-R$ ${discount.toFixed(2).replace(".", ",")})</small>`;
          } else {
            priceHtml += `Preço: R$ ${priceFinal.toFixed(2).replace(".", ",")}`;
          }
          priceHtml += `</div>`;

          return `<div class="participant-item" data-id="${p.id}">
            <div class="participant-info">
              ${name}${when}${details}${priceHtml}
            </div>
            <div>
              <button class="btn btn-secondary" data-remove="${p.id}" style="font-size:0.85rem; padding:6px 12px;">
                Remover
              </button>
            </div>
          </div>`;
        })
        .join("");

      // Adicionar listeners para remover
      listRoot.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-remove");
          let arr = loadParticipants();
          arr = arr.filter((x) => String(x.id) !== String(id));
          saveParticipants(arr);
          render();
          showTemporaryAlert(
            alertEl,
            "Participante removido do carrinho",
            "success"
          );
        });
      });

      // total do carrinho
      const total = arr.reduce(
        (s, p) => s + (Number(p.priceFinal) || Number(p.priceBase) || 0),
        0
      );

      // Resumo de valores
      const cartSummary = document.createElement("div");
      cartSummary.style.cssText =
        "margin-top:20px; padding:16px; background:#f8fafc; border-radius:8px; border-left:4px solid #ffd400;";

      let summaryHtml = `<h3 style="margin:0 0 12px 0; color:#222;">Resumo do Carrinho</h3>`;
      summaryHtml += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">`;
      summaryHtml += `<div><strong>Quantidade de inscrições:</strong> ${arr.length}</div>`;

      const withCoupon = arr.filter((p) => p.couponCode).length;
      if (withCoupon > 0) {
        summaryHtml += `<div><strong>Com cupom aplicado:</strong> ${withCoupon}</div>`;
      }
      summaryHtml += `</div>`;

      summaryHtml += `<div style="border-top:1px solid #ddd; padding-top:12px; margin-top:12px;">`;
      summaryHtml += `<div style="font-size:1.1rem; font-weight:700; color:#222; text-align:right;">`;
      summaryHtml += `Total: R$ ${total.toFixed(2).replace(".", ",")}`;
      summaryHtml += `</div></div>`;

      cartSummary.innerHTML = summaryHtml;
      listRoot.parentNode.insertBefore(cartSummary, listRoot.nextSibling);
    }

    render();

    confirmBtn &&
      confirmBtn.addEventListener("click", () => {
        const arr = loadParticipants();
        if (arr.length === 0) {
          showAlertEl(
            alertEl,
            "Adicione participantes antes de confirmar",
            "danger"
          );
          return;
        }
        // Simular envio
        showAlertEl(alertEl, "Enviando inscrição...", "success");
        setTimeout(() => {
          localStorage.removeItem(storageKey());
          render();
          showAlertEl(
            alertEl,
            "Inscrição confirmada com sucesso! (simulação)",
            "success"
          );
        }, 1500);
      });

    clearBtn &&
      clearBtn.addEventListener("click", () => {
        localStorage.removeItem(storageKey());
        render();
        showAlertEl(alertEl, "Carrinho limpo", "success");
      });
  }

  // ===== MODALITIES PAGE =====
  function initModalitiesPage() {
    const cpfModal = document.getElementById("cpfModal");
    const modalCpfInput = document.getElementById("modalCpfInput");
    const closeModal = document.getElementById("closeModal");
    const proceedWithoutCpf = document.getElementById("proceedWithoutCpf");
    const proceedWithCpf = document.getElementById("proceedWithCpf");
    const continueButtons = document.querySelectorAll(".btn-continue");

    // Máscara CPF 
    function maskCPF(value) {
      return value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{2})/, "$1-$2")
        .substring(0, 14);
    }

    if (modalCpfInput) {
      modalCpfInput.addEventListener("input", (e) => {
        e.target.value = maskCPF(e.target.value);
      });
    }

    function closeCpfModal() {
      if (cpfModal) cpfModal.style.display = "none";
      if (modalCpfInput) modalCpfInput.value = "";
    }

    function openCpfModal(formUrl, modalidade) {
      if (cpfModal) {
        cpfModal.style.display = "flex";
        modalCpfInput.value = "";
        modalCpfInput.focus();

        // Limpar listeners anteriores
        proceedWithCpf.onclick = null;
        proceedWithoutCpf.onclick = null;

        // Nova função para prosseguir com CPF
        proceedWithCpf.onclick = () => {
          const cpf = modalCpfInput.value.trim();
          if (!cpf) {
            alert("Por favor, informe um CPF válido");
            return;
          }

          closeCpfModal();
          window.location.href = formUrl;
        };

        // Prosseguir sem CPF 
        proceedWithoutCpf.onclick = () => {
          closeCpfModal();
          window.location.href = formUrl;
        };
      }
    }

    // Fechar modal
    if (closeModal) {
      closeModal.addEventListener("click", closeCpfModal);
    }

    // Fechar ao clicar fora do modal
    if (cpfModal) {
      cpfModal.addEventListener("click", (e) => {
        if (e.target === cpfModal) {
          closeCpfModal();
        }
      });
    }

    // Listeners para botões de continuar (todas as modalidades pedem CPF antes de abrir o formulário)
    continueButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const modalidade = btn.getAttribute("data-modalidade");

        // Determinar URL baseado na modalidade
        let formUrl = "form";
        if (modalidade === "adulto") {
          formUrl = "form-adult";
        }
        // Ambas as opções de criança usam form.html

        // Adicionar modalidade na URL
        formUrl += "?mod=" + encodeURIComponent(modalidade);

        // Abrir modal de CPF (adulto ou responsável) antes de prosseguir
        openCpfModal(formUrl, modalidade);
      });
    });
  }

  // ===== SUMMARY PAGE =====
  function initSummaryPage() {
    const cardsContainer = document.getElementById("participantsCards");
    const participantCount = document.getElementById("participantCount");
    const totalAmount = document.getElementById("totalAmount");
    const addMoreBtn = document.getElementById("addMoreBtn");
    const proceedBtn = document.getElementById("proceedToCheckoutBtn");
    const alertEl = document.getElementById("summaryAlert");

    function escapeHtml(s) {
      return String(s || "").replace(
        /[&<>\"]/g,
        (v) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[v])
      );
    }

    function renderSummary() {
      const arr = loadParticipants();

      if (arr.length === 0) {
        cardsContainer.innerHTML =
          '<div class="no-participants">Nenhum participante adicionado</div>';
        participantCount.textContent = "0";
        totalAmount.textContent = "R$ 0,00";
        return;
      }

      let total = 0;
      cardsContainer.innerHTML = arr
        .map((p) => {
          const priceBase =
            typeof p.priceBase === "number"
              ? p.priceBase
              : Number(p.priceBase || 0);
          const priceFinal =
            typeof p.priceFinal === "number"
              ? p.priceFinal
              : Number(p.priceFinal || priceBase || 0);
          const priceHtml =
            p.couponCode && priceFinal !== priceBase
              ? `Preço: <del>R$ ${priceBase
                .toFixed(2)
                .replace(".", ",")}</del> → R$ ${priceFinal
                  .toFixed(2)
                  .replace(
                    ".",
                    ","
                  )}<br/><small style="color:#666">Cupom: ${escapeHtml(
                    p.couponCode
                  )}</small>`
              : `Preço: R$ ${priceFinal.toFixed(2).replace(".", ",")}`;

          total += priceFinal;

          const when = new Date(p.birthDate).toLocaleDateString("pt-BR");
          const modalityLabel = p.modalityLabel || "";
          const cpfInfo = p.cpf ? ` • CPF: ${escapeHtml(p.cpf)}` : "";
          const motherInfo = p.motherName
            ? `Mãe: ${escapeHtml(p.motherName)}`
            : "";

          return `<div class="participant-item" data-id="${p.id
            }" style="background:#f8fafc; padding:16px; border-radius:8px; border-left:4px solid #ffd400; display:flex; justify-content:space-between; gap:12px;">
            <div class="participant-info" style="flex:1;">
              <strong style="font-size:1.05rem;color:#222;">${escapeHtml(
              p.name
            )}</strong>
              <div style="font-size:0.9rem;color:#555">${when} — ${escapeHtml(
              modalityLabel
            )}</div>
              ${motherInfo || cpfInfo
              ? `<div style="font-size:0.9rem;color:#666">${motherInfo}${cpfInfo ? ` • ${cpfInfo}` : ""
              }</div>`
              : ""
            }
              <div style="font-size:0.95rem;color:#222; margin-top:8px">${priceHtml}</div>
            </div>
            <div>
              <button class="btn btn-secondary" data-remove="${p.id
            }" style="font-size:0.85rem; padding:6px 12px;">
                Remover
              </button>
            </div>
          </div>`;
        })
        .join("");

      participantCount.textContent = arr.length;
      totalAmount.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`;

      // Listeners para remover
      cardsContainer.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-remove");
          let participants = loadParticipants();
          participants = participants.filter(
            (x) => String(x.id) !== String(id)
          );
          saveParticipants(participants);
          renderSummary();
          showTemporaryAlert(
            alertEl,
            "Participante removido com sucesso",
            "success"
          );
        });
      });
    }

    if (addMoreBtn) {
      addMoreBtn.addEventListener("click", () => {
        window.location.href = "modalities";
      });
    }

    if (proceedBtn) {
      proceedBtn.addEventListener("click", () => {
        const arr = loadParticipants();
        if (arr.length === 0) {
          showTemporaryAlert(
            alertEl,
            "Adicione participantes antes de continuar",
            "danger"
          );
          return;
        }
        // Redirecionar para checkout
        window.location.href = "checkout";
      });
    }

    renderSummary();
  }

  // ===== CHECKOUT PAGE =====
  function initCheckoutPage() {
    const cpfDisplay = document.getElementById("cpfResponsavel");
    const qtdDisplay = document.getElementById("qtdParticipantes");
    const participantsContainer = document.getElementById(
      "checkoutParticipants"
    );
    const totalValue = document.getElementById("totalValue");
    const payAmount = document.getElementById("payAmount");
    const backBtn = document.getElementById("backBtn");
    const payBtn = document.getElementById("payBtn");
    const alertEl = document.getElementById("checkoutAlert");

    function renderCheckout() {
      const arr = loadParticipants();

      if (arr.length === 0) {
        window.location.href = "summary";
        return;
      }

      let total = 0;
      participantsContainer.innerHTML = arr
        .map((p) => {
          const price = p.priceFinal || p.priceBase || 0;
          total += price;
          const badge = p.modality === "adulto" ? "Adulto" : "Criança";
          return `
          <div class="simple-participant">
            <div class="simple-participant-info">
              <div class="simple-participant-name">${escapeHtml(p.name)}</div>
              <div class="simple-participant-details">${badge}</div>
            </div>
            <div class="simple-participant-price">R$ ${price
              .toFixed(2)
              .replace(".", ",")}</div>
          </div>
        `;
        })
        .join("");

      qtdDisplay.textContent = arr.length;
      const totalFormatted = `R$ ${total.toFixed(2).replace(".", ",")}`;
      totalValue.textContent = totalFormatted;
      payAmount.textContent = totalFormatted;

      // CPF do responsável: tenta adulto, depois responsável de menor
      const responsibleParticipant = arr.find((p) => p.cpf || p.responsibleCpf);
      if (responsibleParticipant) {
        cpfDisplay.textContent =
          responsibleParticipant.cpf || responsibleParticipant.responsibleCpf;
      } else {
        cpfDisplay.textContent = "Não informado";
      }
    }

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = "summary";
      });
    }

    if (payBtn) {
      payBtn.addEventListener("click", () => {
        // Mostrar página de processamento
        window.location.href = "processing";
      });
    }

    renderCheckout();
  }

  // ===== PROCESSING PAGE =====
  function initProcessingPage() {
    const details = document.getElementById("processingDetails");

    // Simular processamento por 3 segundos
    setTimeout(() => {
      const arr = loadParticipants();
      const total = arr.reduce(
        (sum, p) => sum + (p.priceFinal || p.priceBase || 0),
        0
      );

      // Mostrar simulação de pagamento
      const simulationUrl = `https://secure.pagbank.com.br/checkout?amount=${total}&participants=${arr.length}`;

      details.innerHTML = `
        <div style="margin-top: 20px; padding: 20px; background: white; border-radius: 8px;">
          <p><strong>Redirecionando para:</strong> PagBank Checkout</p>
          <p style="word-break: break-all; font-size: 0.85rem; color: #666;">URL: ${simulationUrl}</p>
          <p style="margin-top: 20px;">
            <button onclick="simulatePaymentSuccess()" class="btn btn-primary">
              ✓ Simular Pagamento Aprovado
            </button>
            <button onclick="simulatePaymentCanceled()" class="btn btn-secondary" style="margin-left: 8px;">
              ✕ Simular Pagamento Cancelado
            </button>
          </p>
        </div>
      `;
    }, 2000);
  }

  // Funções de simulação
  window.simulatePaymentSuccess = function () {
    alert(
      "✓ Pagamento aprovado com sucesso!\n\nSeu evento foi confirmado. Você receberá um email com os detalhes da inscrição."
    );
    localStorage.removeItem("enac_participants_v1");
    window.location.href = "index";
  };

  window.simulatePaymentCanceled = function () {
    alert(
      "✕ Pagamento cancelado.\n\nVocê será redirecionado para revisar seu carrinho."
    );
    window.location.href = "checkout";
  };

  // ===== INIT =====
  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body && document.body.getAttribute("data-page");
    if (page === "form") initFormPage();
    if (page === "cart") initCartPage();
    if (page === "modalities") initModalitiesPage();
    if (page === "summary") initSummaryPage();
    if (page === "checkout") initCheckoutPage();
    if (page === "processing") initProcessingPage();
  });
})();
