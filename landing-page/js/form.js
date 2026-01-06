import { apiGet } from './services/apiGet.js';
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


function calcularIdade(dataNascimento) {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);

  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();

  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  return idade;
}

function validarModalidade(dataNascimento, modalidade) {
  const idade = calcularIdade(dataNascimento);

  switch (modalidade) {
    case '0':
      return idade >= 18
        ? null
        : 'Modalidade adulto permite apenas maiores de 18 anos.';

    case '1':
      return idade <= 3
        ? null
        : 'Modalidade até 3 anos permite apenas crianças de 0 a 3 anos.';

    case '2':
      return idade >= 4 && idade <= 9
        ? null
        : 'Modalidade de 4 a 9 anos permite apenas crianças nessa faixa etária.';

    default:
      return 'Modalidade inválida.';
  }
}

function formatMoney(value) {
  return parseFloat(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}




// ===== FORM PAGE =====
const urlParams = new URLSearchParams(window.location.search);

let participantType = urlParams.get("type") || "0";
const name = document.getElementById("child_name");
const birth = document.getElementById("child_birthDate");
const price = document.getElementById("price");
const newValue = document.getElementById("new-value");
const valueDesc = document.getElementById("value-desc");
const valueTaxa = document.getElementById("value-tx");
const percent = document.getElementById("percent");
const form = document.getElementById("participantForm");
const alertEl = document.getElementById("formAlert");
const divPrice = document.getElementById("div-price");
const btnEnviar = document.getElementById('addBtnChild');

async function render() {
  try {
    const res = await apiGet('/event', true);

    const dataPeriodo = new Date(res.data_fim_inscricoes);
    const hoje = new Date();

    dataPeriodo.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);

    if (dataPeriodo > hoje) {

      price.innerHTML = formatMoney(res.valor_periodo);
      percent.innerHTML = '50,00';

      let liquid =
        parseFloat(price.innerHTML) +
        parseFloat(res.taxa_inscricao) -
        parseFloat(valueDesc.innerHTML) -
        parseFloat(valueTaxa.innerHTML)

      let desc = liquid * (50 / 100);

      newValue.innerHTML = formatMoney(liquid - desc);
      valueTaxa.innerHTML = formatMoney(res.taxa_inscricao);
      valueDesc.innerHTML = formatMoney(desc);

    } else {

      price.innerHTML = formatMoney(res.valor_fora_periodo);

      percent.innerHTML = '50,00';

      let liquid =
        parseFloat(price.innerHTML) +
        parseFloat(res.taxa_inscricao) -
        parseFloat(valueDesc.innerHTML) -
        parseFloat(valueTaxa.innerHTML)

      let desc = liquid * (50 / 100);

      newValue.innerHTML = formatMoney(liquid - desc);
      valueTaxa.innerHTML = formatMoney(res.taxa_inscricao);
      valueDesc.innerHTML = formatMoney(desc);

    }


  } catch (error) {
    console.log('Erro Requisição: ' + error)
  }
}


if (participantType == 2) {
  render();
}

if (participantType == 1) {
  divPrice.remove();
}

// Submeter formulário
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const res = await apiPost('/insert-update-inscricao', {
        nome: name.value,
        nascimento: birth.value,
        preco: participantType === "1" ? 0 : price.innerHTML ?? 0,
        desconto: participantType === "1" ? 0 : valueDesc.innerHTML ?? 0,
        liquido: participantType === "1" ? 0 : newValue.innerHTML ?? 0,
        modalitie: participantType,
        status: 'em_andamento'
      }, true);

      console.log(res);
      console.log(typeof res);

      if (res.success) {
        showTempAlert(
          alertEl,
          "Participante adicionado com sucesso!",
          "success"
        );

        form.reset();
        window.location.href = "summary";
      }
    } catch (err) {
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


    console.log('continuou aqui')
    Swal.fire({
      icon: 'error',
      title: res.error,
      text: erro
    });

  });
}




let erroJaMostrado = false;

function checarValidacao(mostrarErro = false) {
  const data = birth.value;
  const modalidade = participantType;

  btnEnviar.disabled = true;

  if (!birth.checkValidity() || !modalidade) {
    erroJaMostrado = false;
    return;
  }

  const erro = validarModalidade(data, modalidade);

  if (erro) {
    if (mostrarErro && !erroJaMostrado) {
      erroJaMostrado = true;
      Swal.fire({
        icon: 'error',
        title: 'Idade inválida',
        text: erro
      });
    }
  } else {
    erroJaMostrado = false;
    btnEnviar.disabled = false;
    btnEnviar.classList.style.color = 'red';
  }
}

birth.addEventListener('input', () => checarValidacao(false));
birth.addEventListener('blur', () => checarValidacao(true));


document.getElementById('btnWrapper').addEventListener('click', function () {
  if (btnEnviar.disabled) {
    Swal.fire({
      icon: 'info',
      title: 'Formulário inválido',
      text: 'Corrija os dados antes de enviar.'
    });
  }
});



