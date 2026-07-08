document.body.classList.add('js-enabled');

if (window.GOVUKFrontend) {
  window.GOVUKFrontend.initAll();
}

const nameInput = document.querySelector('[data-module="app-name-preview"]');
const preview = document.querySelector('[data-app-name-preview-output]');

if (nameInput && preview) {
  const updatePreview = () => {
    preview.textContent = nameInput.value.trim() || 'Your name will appear here as you type.';
  };

  nameInput.addEventListener('input', updatePreview);
  updatePreview();
}
