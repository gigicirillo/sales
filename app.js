const form = document.getElementById('salesForm');
const dateInput = document.getElementById('date');
const submitButton = document.getElementById('submitButton');
const formMessage = document.getElementById('formMessage');
const connectionStatus = document.getElementById('connectionStatus');

const localToday = new Date();
localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
dateInput.value = localToday.toISOString().slice(0, 10);

const endpoint = window.SALES_APP_CONFIG?.GOOGLE_SCRIPT_URL?.trim();
connectionStatus.textContent = endpoint ? 'Google Sheet collegato' : 'Da collegare a Google Sheet';

function numberValue(formData, key) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.className = 'form-message';

  if (!form.reportValidity()) return;
  if (!endpoint) {
    formMessage.textContent = 'Configurazione mancante: inserisci in config.js l’URL della Web App Google Apps Script.';
    formMessage.classList.add('error');
    return;
  }

  const data = new FormData(form);
  const payload = {
    seller: data.get('seller'),
    date: data.get('date'),
    callsMade: numberValue(data, 'callsMade'),
    callsAnswered: numberValue(data, 'callsAnswered'),
    appointmentsFromCalls: numberValue(data, 'appointmentsFromCalls'),
    quotesFromCalls: numberValue(data, 'quotesFromCalls'),
    subscriptionsFromCalls: numberValue(data, 'subscriptionsFromCalls'),
    toursDone: numberValue(data, 'toursDone'),
    quotesFromTours: numberValue(data, 'quotesFromTours'),
    subscriptionsFromTours: numberValue(data, 'subscriptionsFromTours'),
    organicQuotes: numberValue(data, 'organicQuotes'),
    subscriptionsFromOrganicQuotes: numberValue(data, 'subscriptionsFromOrganicQuotes'),
    organicRenewals: numberValue(data, 'organicRenewals'),
    trialsActivated: numberValue(data, 'trialsActivated'),
    guestPasses: numberValue(data, 'guestPasses'),
    revenue: numberValue(data, 'revenue'),
    collected: numberValue(data, 'collected'),
    futureAmount: numberValue(data, 'futureAmount')
  };

  submitButton.disabled = true;
  submitButton.textContent = 'Invio in corso…';
  formMessage.textContent = '';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'Errore durante il salvataggio');

    formMessage.textContent = `Dati di ${payload.seller} per il ${payload.date} salvati correttamente.`;
    formMessage.classList.add('success');
    const seller = payload.seller;
    const selectedDate = payload.date;
    form.reset();
    document.getElementById('seller').value = seller;
    dateInput.value = selectedDate;
    form.querySelectorAll('input[type="number"]').forEach(input => input.value = '0');
  } catch (error) {
    formMessage.textContent = `Invio non riuscito: ${error.message}`;
    formMessage.classList.add('error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Invia dati giornata';
  }
});