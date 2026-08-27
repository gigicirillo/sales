const form = document.getElementById('salesForm');
const dateInput = document.getElementById('date');
const submitButton = document.getElementById('submitButton');
const formMessage = document.getElementById('formMessage');
const connectionStatus = document.getElementById('connectionStatus');
const entryView = document.getElementById('entryView');
const reviewView = document.getElementById('reviewView');
const successView = document.getElementById('successView');
const reviewSummary = document.getElementById('reviewSummary');
const successSummary = document.getElementById('successSummary');
const backButton = document.getElementById('backButton');
const confirmButton = document.getElementById('confirmButton');
const newEntryButton = document.getElementById('newEntryButton');
const reviewMessage = document.getElementById('reviewMessage');
const sentTime = document.getElementById('sentTime');

let pendingPayload = null;

const localToday = new Date();
localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
dateInput.value = localToday.toISOString().slice(0, 10);

const endpoint = window.SALES_APP_CONFIG?.GOOGLE_SCRIPT_URL?.trim();
connectionStatus.textContent = endpoint ? 'Google Sheet collegato' : 'Da collegare a Google Sheet';

function numberValue(formData, key) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

function getPayload() {
  const data = new FormData(form);
  return {
    seller: data.get('seller'), date: data.get('date'), center: data.get('center'),
    callsMade: numberValue(data, 'callsMade'), callsAnswered: numberValue(data, 'callsAnswered'), appointmentsFromCalls: numberValue(data, 'appointmentsFromCalls'), quotesFromCalls: numberValue(data, 'quotesFromCalls'), subscriptionsFromCalls: numberValue(data, 'subscriptionsFromCalls'),
    toursDone: numberValue(data, 'toursDone'), quotesFromTours: numberValue(data, 'quotesFromTours'), subscriptionsFromTours: numberValue(data, 'subscriptionsFromTours'),
    organicQuotes: numberValue(data, 'organicQuotes'), subscriptionsFromOrganicQuotes: numberValue(data, 'subscriptionsFromOrganicQuotes'), organicRenewals: numberValue(data, 'organicRenewals'),
    trialsActivated: numberValue(data, 'trialsActivated'), guestPasses: numberValue(data, 'guestPasses'),
    revenue: numberValue(data, 'revenue'), collected: numberValue(data, 'collected'), futureAmount: numberValue(data, 'futureAmount')
  };
}

const sections = [
  ['Dati giornata', [['Venditore','seller'],['Data','date'],['Centro di competenza','center']]],
  ['Azioni da telefonate', [['Telefonate fatte','callsMade'],['Telefonate risposte','callsAnswered'],['Appuntamenti da telefonate','appointmentsFromCalls'],['Preventivi da telefonate','quotesFromCalls'],['Abbonamenti da telefonate','subscriptionsFromCalls']]],
  ['Azioni da tour spontanei', [['Tour fatti','toursDone'],['Preventivi da tour fatti','quotesFromTours'],['Abbonamenti da tour','subscriptionsFromTours']]],
  ['Azioni da clientela organica', [['Preventivi','organicQuotes'],['Abbonamenti da preventivi','subscriptionsFromOrganicQuotes'],['Rinnovi organici','organicRenewals']]],
  ['Altre azioni', [['Prove attivate','trialsActivated'],['Guest pass consegnati','guestPasses']]],
  ['Vendite', [['Fatturato','revenue'],['Incassato','collected'],['Futurament','futureAmount']]]
];

function formatValue(key, value) {
  if (['revenue','collected','futureAmount'].includes(key)) return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(value || 0);
  if (key === 'date') {
    const [y,m,d] = String(value).split('-');
    return `${d}/${m}/${y}`;
  }
  return value;
}

function renderSummary(target, payload) {
  target.innerHTML = sections.map(([title, fields]) => `
    <section class="summary-section">
      <h3>${title}</h3>
      <div class="summary-grid">
        ${fields.map(([label,key]) => `<div class="summary-item"><span>${label}</span><strong>${formatValue(key,payload[key])}</strong></div>`).join('')}
      </div>
    </section>`).join('');
}

function showView(view) {
  entryView.hidden = true;
  reviewView.hidden = true;
  successView.hidden = true;
  view.hidden = false;
  window.scrollTo({top:0,behavior:'smooth'});
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formMessage.className = 'form-message';
  formMessage.textContent = '';
  if (!form.reportValidity()) return;
  pendingPayload = getPayload();
  renderSummary(reviewSummary, pendingPayload);
  reviewMessage.textContent = '';
  showView(reviewView);
});

backButton.addEventListener('click', () => showView(entryView));

confirmButton.addEventListener('click', async () => {
  if (!pendingPayload) return;
  if (!endpoint) {
    reviewMessage.textContent = 'Configurazione mancante del collegamento Google Sheet.';
    reviewMessage.className = 'form-message error';
    return;
  }
  confirmButton.disabled = true;
  confirmButton.textContent = 'Invio in corso…';
  reviewMessage.textContent = '';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(pendingPayload)
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'Errore durante il salvataggio');
    renderSummary(successSummary, pendingPayload);
    const now = new Date();
    sentTime.textContent = `INVIATO IL ${new Intl.DateTimeFormat('it-IT',{dateStyle:'full',timeStyle:'medium'}).format(now)}`;
    showView(successView);
  } catch (error) {
    reviewMessage.textContent = `Invio non riuscito: ${error.message}`;
    reviewMessage.className = 'form-message error';
  } finally {
    confirmButton.disabled = false;
    confirmButton.textContent = 'Conferma e invia';
  }
});

newEntryButton.addEventListener('click', () => {
  const seller = pendingPayload?.seller || '';
  const center = pendingPayload?.center || '';
  form.reset();
  document.getElementById('seller').value = seller;
  document.getElementById('center').value = center;
  dateInput.value = new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  form.querySelectorAll('input[type="number"]').forEach(input => input.value = '0');
  pendingPayload = null;
  showView(entryView);
});