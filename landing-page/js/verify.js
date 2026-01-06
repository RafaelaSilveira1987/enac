// app-unified.js - Sistema unificado de inscrição
import { apiPost } from './services/apiPost.js';

function maskCPF(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{2})/, "$1-$2")
    .substring(0, 14);
}

function validateCPF(cpf) {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  // Validação simples
  if (/^(\d)\1{10}$/.test(clean)) return false;
  return true;
}


// ===== VERIFY PAGE =====
const form = document.getElementById("verifyForm");
const cpfInput = document.getElementById("responsibleCpf");
const alertEl = document.getElementById("verifyAlert");

async function startInscricao(cpf) {

  const res = await apiPost('/start', { cpf });

  if (!res?.token) {
    throw new Error('Token não retornado');
  }

  localStorage.setItem('acess-token', res.token);
  localStorage.setItem('cpf', cpf);

  console.log(localStorage.getItem('acess-token'));

  return res;

}

if (cpfInput) {
  cpfInput.addEventListener("input", (e) => {
    e.target.value = maskCPF(e.target.value);
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
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
    const res = await startInscricao(cpf);

    if (res.success) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');

      if (res.status_cadastro == 'N') {
        window.location.href = "form-adult";
      } else {
        window.location.href = "summary";
      }
    }
  });
}





