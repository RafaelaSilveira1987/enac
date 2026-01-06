import { apiPost } from './services/apiPost.js';


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

// ===== FORM PAGE =====
// Obter tipo de participante da URL (type=adulto, type=crianca_4_9, etc)
const urlParams = new URLSearchParams(window.location.search);
let participantType = urlParams.get("type") || "adulto";

const nameInput = document.getElementById("participantName");
const birthInput = document.getElementById("birthDate");
const ageDisplay = document.getElementById("ageDisplay");
const adultFields = document.getElementById("adultFields");
const childFields = document.getElementById("childFields");
const form = document.getElementById("participantForm");
const alertEl = document.getElementById("formAlert");

/*
let responsibleCpf = ''; //loadResponsibleCpf();
// Se não houver CPF, redirecionar para verify.html
if (!responsibleCpf) {
  // Para testes: descomente a linha abaixo para usar um CPF de teste
  // responsibleCpf = "12345678901"; saveResponsibleCpf(responsibleCpf);
  setTimeout(() => {
    window.location.href = "verify";
  }, 0);
  return;
}*/

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



// Submeter formulário
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const birth = birthInput.value;
    const email = document.getElementById("adultEmail").value.trim();
    const phone = document.getElementById("adultPhone").value.trim();
    const city = document.getElementById("adultCity").value.trim();
    const state = document.getElementById("adultState").value.trim();

    if (!name) {
      showTempAlert(alertEl, "Informe o nome", "danger");
      return;
    }

    if (!birth) {
      showTempAlert(alertEl, "Informe a data de nascimento", "danger");
      return;
    }


    const res = await apiPost('/update-participant', {
      nome: name,
      nascimento: birth,
      email: email,
      telefone: phone,
      cidade: city,
      estado: state
    }, true);

    if (res.success) {
      showTempAlert(
        alertEl,
        "Participante adicionado com sucesso!",
        "success"
      );
      form.reset();
      if (res.success) {
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');

        window.location.href = "form-unified?type=" + type;
      }
    }
  });
}


