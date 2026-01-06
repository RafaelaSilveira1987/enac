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
// Obter tipo de participante da URL (type=adulto, type=crianca_4_9, etc)
const urlParams = new URLSearchParams(window.location.search);

let participantType = urlParams.get("type") || "0";
const cpfAdult = document.getElementById("adult_cpf");
const name = document.getElementById("adult_name");
const birth = document.getElementById("adult_birthDate");
const phone = document.getElementById("adult_phone");
const city = document.getElementById("adult_phone");
const state = document.getElementById("adult_state");
const email = document.getElementById("adult_email");
const price = document.getElementById("price");
const percent = document.getElementById("percent");
const newValue = document.getElementById("new-value");
const valueDesc = document.getElementById("value-desc");
const valueTaxa = document.getElementById("value-tx");
const form = document.getElementById("participantForm");
const alertEl = document.getElementById("formAlert");
const btnEnviar = document.getElementById('addBtnAdult');

let cupomId = null;

cpfAdult.value = localStorage.getItem('cpf');

async function render() {

  try {
    const res = await apiGet('/event', true);

    const dataPeriodo = new Date(res.data_fim_inscricoes);
    const hoje = new Date();

    dataPeriodo.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);

    if (dataPeriodo > hoje) {
      price.innerHTML = formatMoney(res.valor_periodo);

      let liquid =
        parseFloat(price.innerHTML) +
        parseFloat(res.taxa_inscricao) -
        parseFloat(valueDesc.innerHTML) -
        parseFloat(valueTaxa.innerHTML)

      newValue.innerHTML = formatMoney(liquid);

      valueTaxa.innerHTML = formatMoney(res.taxa_inscricao);
    } else {
      
      price.innerHTML = formatMoney(res.valor_fora_periodo);

      let liquid =
        parseFloat(price.innerHTML) +
        parseFloat(res.taxa_inscricao) -
        parseFloat(valueDesc.innerHTML) -
        parseFloat(valueTaxa.innerHTML)

      newValue.innerHTML = formatMoney(liquid);

      valueTaxa.innerHTML = formatMoney(res.taxa_inscricao);
    }


  } catch (error) {
    console.log('Erro Requisição: ' + error)
  }
}

render();

const btnCoupon = document.getElementById('applyCouponBtn');
btnCoupon.addEventListener("click", async (e) => {
  e.preventDefault();

  const coupon = document.getElementById('couponCode').value.trim();

  if (!coupon) {
    console.warn('Cupom vazio');
    return;
  }

  try {
    const res = await apiGet(`/coupon/${coupon}`, true);

    if (res.success) {
      Swal.fire({
        title: 'Sucesso!',
        text: 'Cupom aplicado com sucesso!',
        icon: 'success',
        confirmButtonText: 'Concluir',
        confirmButtonColor: '#1eff00ff', // verde (Bootstrap success)
      });

      percent.innerHTML = formatMoney(res.percent);

      let liquid = (parseFloat(price.textContent) + parseFloat(valueTaxa.textContent)) - (parseFloat(price.textContent) * (res.percent / 100));
      let desc = (parseFloat(price.textContent) * (res.percent / 100))

      newValue.innerHTML = formatMoney(liquid);
      valueDesc.innerHTML = formatMoney(desc);
      cupomId = res.coupon_id;

    } else {

      Swal.fire({
        title: 'Atenção!',
        text: 'Cupom não identificado',
        icon: 'warning',
        confirmButtonText: 'Concordo',
        confirmButtonColor: '#ffd400', // verde (Bootstrap success)
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Atenção!',
      text: 'Cupom não é válido!',
      icon: 'warning',
      confirmButtonText: 'Concordo',
      confirmButtonColor: '#ffd400', // verde (Bootstrap success)
    });
  }



});

// Submeter formulário
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const consent = document.getElementById("adult_consent").checked;

    if (!consent) {
      Swal.fire({
        title: 'Atenção!',
        text: 'Para continuar você precisa aceitar os termos!',
        icon: 'warning',
        confirmButtonText: 'Concordo',
        confirmButtonColor: '#ffd400', // verde (Bootstrap success)
      });
      return;
    }

    // Coletar dados adicionais do adulto
    const transport =
      document.querySelector('input[name="adultTransport"]:checked')
        ?.value || "";
    const participation =
      document.getElementById("adult_participation").value;
    const mentoriaGroup =
      document.getElementById("adult_mentoriaGroup").value;
    const volunteerAreas = Array.from(
      document.querySelectorAll(
        'input[name="volunteerArea"]:checked'
      )
    ).map((x) => x.value);
    const observations = document
      .getElementById("adult_observations")
      .value.trim();


    try {
      const res = await apiPost('/insert-update-inscricao', {
        nome: name.value,
        nascimento: birth.value,
        telefone: phone.value,
        cidade: city.value,
        estado: state.value,
        email: email.value,
        translado: transport,
        tipo: participation,
        grupo_mentoria: mentoriaGroup,
        restricoes_alimentares: observations,
        modalitie: participantType,
        termo: consent,
        preco: price.innerHTML,
        cupom: cupomId,
        desconto: valueDesc.innerHTML,
        liquido: newValue.innerHTML,
        status: 'em_andamento'
      }, true);

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








