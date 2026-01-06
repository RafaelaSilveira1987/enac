// app-unified.js - Sistema unificado de inscrição
import { apiPost } from './services/apiPost.js';

async function login(login, senha) {

  const res = await apiPost('/login-admin', { login, senha });

  if (!res?.token) {
    throw new Error('Token não retornado');
  }

  localStorage.setItem('token-admin', res.token);

  console.log(localStorage.getItem('token-admin'));

  return res;

}

// Se já estiver autenticado, redirecionar
const loginForm = document.getElementById("loginForm");
const alertEl = document.getElementById("loginAlert");
const usernameInput = document.getElementById("adminUsername");
const passwordInput = document.getElementById("adminPassword");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    try {
      const res = await login(username, password);

      if (res.success) {

        localStorage.setItem('token-admin', res.token);

        Swal.fire({
          icon: 'success', // success | error | warning | info
          title: 'Login Autorizado',
          text: 'Bom Trabalho!',
          timer: 1000,
          timerProgressBar: true,
          showConfirmButton: false
        });

        setTimeout(() => {
          window.location.href = "reports";
        }, 1000);
      }
    } catch (err) {
      passwordInput.value = "";
      passwordInput.focus();

      const msg =
        err?.data?.error ||
        err?.message ||
        'Erro ao processar solicitação';

      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: msg
      });
    }

  });
}





