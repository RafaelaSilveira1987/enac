// app-unified.js - Sistema unificado de inscrição
import { apiGet } from './services/apiGet.js';

function escapeHtml(s) {
  return String(s || "").replace(
    /[&<>\"]/g,
    (v) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[v])
  );
}

function formatMoney(value) {
  return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function debounce(fn, delay = 500) {
  let timeout;

  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
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


// Se já estiver autenticado, redirecionar
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const sortBy = document.getElementById("sortBy");
const clearFiltersBtn = document.getElementById("clearFilters");
const exportBtn = document.getElementById("exportBtn");
const alertEl = document.getElementById("reportsAlert");

//array global
let inscricoes = [];

// Elementos de estatísticas
const totalInscricoes = document.getElementById("totalInscricoes");
const totalAdultos = document.getElementById("totalAdultos");
const totalCriancas = document.getElementById("totalCriancas");
const totalValor = document.getElementById("totalValor");
const resultsCount = document.getElementById("resultsCount");


// Renderizar lista de inscrições
async function renderInscricoes() {

  const filtros = {
    pesquisa: searchInput.value || undefined,
    tipo: filterType.value || undefined,
    ornenacao: sortBy.value || undefined
  };

  const query = new URLSearchParams(
    Object.entries(filtros).filter(([_, v]) => v !== undefined)
  ).toString();

  console.log(query);

  const res = await apiGet(`/list-all-inscricao?${query}`, true);


  // 🔹 Dados sempre como array
  const inscricoesData = Array.isArray(res) ? res : (res ? [res] : []);
  inscricoes = inscricoesData;

  // 🔹 Container HTML
  const inscricoesList = document.getElementById('inscricoesList');
  //if (!inscricoesList) return;

  if (inscricoesData.length === 0) {
    inscricoesList.innerHTML =
      '<div class="no-results">Nenhuma inscrição encontrada</div>';
    return;
  }

  inscricoesList.innerHTML = inscricoesData
    .map((insc) => {
      let detailsHtml = "";

      // 📌 Dados básicos
      if (insc.nascimento) {
        detailsHtml += `
          <div class="inscricao-detail">
            <strong>Data de Nascimento</strong>
            <span>${insc.nascimento_formatado}</span>
          </div>`;
      }

      if (insc.idade !== null) {
        detailsHtml += `
          <div class="inscricao-detail">
            <strong>Idade</strong>
            <span>${insc.idade} anos</span>
          </div>`;
      }

      // 📌 Adulto
      if (insc.modalitie === 0) {
        if (insc.grupo_mentoria) {
          detailsHtml += `
            <div class="inscricao-detail">
              <strong>Grupo de Mentoria</strong>
              <span>${insc.grupo_mentoria}</span>
            </div>`;
        }

        if (insc.restricoes_alimentares) {
          detailsHtml += `
            <div class="inscricao-detail">
              <strong>Restrições Alimentares</strong>
              <span>${escapeHtml(insc.restricoes_alimentares)}</span>
            </div>`;
        }
      }

      // 📌 Criança
      if (insc.modalitie !== 0) {
        if (insc.nome_responsavel) {
          detailsHtml += `
            <div class="inscricao-detail">
              <strong>Responsável</strong>
              <span>${escapeHtml(insc.nome_responsavel)}</span>
            </div>`;
        }
      }

      // 💰 Preço
      const valorOriginal = Number(insc.valor_original);
      const valorLiquido = Number(insc.liquido);

      const priceHtml =
        insc.descricao_cupom && valorLiquido < valorOriginal
          ? `
            <div class="inscricao-price">
              <del>${formatMoney(valorOriginal)}</del>
              → ${formatMoney(valorLiquido)}
              <br/>
              <small>Cupom: ${escapeHtml(insc.descricao_cupom)}</small>
            </div>`
          : `
            <div class="inscricao-price">
              ${formatMoney(valorLiquido)}
            </div>`;

      return `
        <div class="inscricao-card">
          <div class="inscricao-header">
            <div class="inscricao-name">
              ${escapeHtml(insc.nome_inscrito)}
            </div>
            <span class="inscricao-badge">
              ${escapeHtml(insc.desc_modalitie)}
            </span>
          </div>

          ${detailsHtml ? `<div class="inscricao-details">${detailsHtml}</div>` : ""}
          ${priceHtml}
        </div>
      `;
    })
    .join("");


  const total = inscricoesData.length;

  const adultos = inscricoesData.filter(
    (i) => i.modalitie === 0
  ).length;
 
  const criancas = total - adultos;

  const valorTotal = inscricoesData.reduce((total, item) => {
    return total + Number(item.liquido);
  }, 0);


  if (totalInscricoes) totalInscricoes.textContent = total;
  if (resultsCount) resultsCount.textContent = total;
  if (totalAdultos) totalAdultos.textContent = adultos;
  if (totalCriancas) totalCriancas.textContent = criancas;
  if (totalValor) totalValor.textContent = formatMoney(valorTotal);

}

renderInscricoes();

// Exportar CSV
const ENUMS = {
  translado: {
    0: 'Aviao',
    1: 'Onibus',
    2: 'Carro'
  },
  tipo: {
    0: 'Interact (candidato ao campo)',
    1: 'Voluntário',
    2: 'Campo'
  },
  grupo_mentoria: {
    0: 'Nenhum',
    1: 'Oriente Médio',
    2: 'Eurásia',
    3: 'África',
    4: 'Sul, Sudeste e Sudoeste da Ásia',
    5: 'Triagem',
  },
  termo: {
    0: 'Não',
    1: 'Sim',
  }
};


function transformarValor(campo, valor) {
  // Traduz enums quando existir mapeamento
  if (ENUMS[campo] && ENUMS[campo][valor] !== undefined) {
    return ENUMS[campo][valor];
  }

  // Valor padrão
  return valor ?? '';
}

function exportarJsonParaCSV(json, nomeArquivo = 'Inscricoes.csv') {
  if (!Array.isArray(json) || json.length === 0) {
    alert('JSON vazio ou inválido');
    return;
  }

  // 🔹 Cabeçalhos dinâmicos
  const headers = Object.keys(json[0]);

  // 🔹 Linhas do CSV
  const linhas = json.map(obj =>
    headers.map(campo => {
      let valor = transformarValor(campo, obj[campo]);

      // Trata strings com aspas
      if (typeof valor === 'string') {
        valor = `"${valor.replace(/"/g, '""')}"`;
      }

      return valor;
    }).join(';')
  );

  // 🔹 CSV final
  const csv = [
    headers.join(';'),
    ...linhas
  ].join('\n');

  // 🔹 Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();

  URL.revokeObjectURL(url);
}


if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    exportarJsonParaCSV(inscricoes);
  });
}

// Event listeners
if (searchInput) {
  const renderDebounced = debounce(renderInscricoes, 600);
  searchInput.addEventListener("input", renderDebounced);
}

if (filterType) {
  filterType.addEventListener("change", renderInscricoes);
}

if (sortBy) {
  sortBy.addEventListener("change", renderInscricoes);
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (filterType) filterType.value = "";
    if (sortBy) sortBy.value = "date-desc";
    renderInscricoes();
    showTempAlert(alertEl, "Filtros limpos", "success");
  });
}







