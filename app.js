/**
 * PDF Cut Pro - Application Logic
 * Powered by PDF.js and PDF-Lib
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Configure PDF.js Worker
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Theme Toggle Logic (Default: Light Theme)
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  const themeToggleText = document.getElementById('theme-toggle-text');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pdf_cut_pro_theme', theme);

    if (themeToggleBtn && themeToggleText) {
      if (theme === 'dark') {
        themeToggleText.textContent = 'Modo Claro';
        const icon = themeToggleBtn.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', 'sun');
      } else {
        themeToggleText.textContent = 'Modo Escuro';
        const icon = themeToggleBtn.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', 'moon');
      }
      if (window.lucide) lucide.createIcons({ el: themeToggleBtn });
    }
  }

  const savedTheme = localStorage.getItem('pdf_cut_pro_theme') || 'light';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
    });
  }

  // State Management
  const state = {
    file: null,
    rawPdfArrayBuffer: null,
    pdfjsDoc: null,
    fileName: '',
    fileSizeStr: '',
    totalOriginalPages: 0,
    pages: [], // Array of { id, originalIndex (0-based), rotation (0, 90, 180, 270), selected }
    deletedPagesStack: [], // Array of arrays for undo support
    currentPreviewIndex: -1,
    gridSize: 'medium', // 'small', 'medium', 'large'
    sortableInstance: null
  };

  // DOM Element References
  const elements = {
    uploadSection: document.getElementById('upload-section'),
    editorSection: document.getElementById('editor-section'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('pdf-file-input'),
    btnSelectFile: document.getElementById('btn-select-file'),
    btnChangeFile: document.getElementById('btn-change-file'),
    btnResetPages: document.getElementById('btn-reset-pages'),
    btnDownloadPdf: document.getElementById('btn-download-pdf'),
    
    fileNameDisplay: document.getElementById('file-name-display'),
    fileSizeDisplay: document.getElementById('file-size-display'),
    fileTotalPagesDisplay: document.getElementById('file-total-pages'),
    countDownloadPages: document.getElementById('count-download-pages'),
    activePagesCount: document.getElementById('active-pages-count'),
    originalPagesCount: document.getElementById('original-pages-count'),
    deletedPagesCount: document.getElementById('deleted-pages-count'),
    deletedBadge: document.getElementById('deleted-badge'),
    
    // Batch Selection Buttons
    btnSelectAll: document.getElementById('btn-select-all'),
    btnDeselectAll: document.getElementById('btn-deselect-all'),
    btnSelectEven: document.getElementById('btn-select-even'),
    btnSelectOdd: document.getElementById('btn-select-odd'),
    btnDeleteSelected: document.getElementById('btn-delete-selected'),
    selectedCountDisplay: document.getElementById('selected-count'),
    
    // Range Input
    rangeInput: document.getElementById('range-input'),
    btnApplyRange: document.getElementById('btn-apply-range'),

    // Grid controls
    btnGridSmall: document.getElementById('btn-grid-small'),
    btnGridMedium: document.getElementById('btn-grid-medium'),
    btnGridLarge: document.getElementById('btn-grid-large'),
    pagesGrid: document.getElementById('pages-grid'),

    // Zoom Modal
    previewModal: document.getElementById('preview-modal'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalPageLabel: document.getElementById('modal-page-label'),
    modalRotateBtn: document.getElementById('modal-rotate-btn'),
    modalDeleteBtn: document.getElementById('modal-delete-btn'),
    modalPrevBtn: document.getElementById('modal-prev-btn'),
    modalNextBtn: document.getElementById('modal-next-btn'),
    previewCanvas: document.getElementById('preview-canvas'),

    // Loading & Toast
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text'),
    loadingSubtext: document.getElementById('loading-subtext'),
    toastContainer: document.getElementById('toast-container')
  };

  /* ==========================================================================
     Event Listeners Setup
     ========================================================================== */

  // File Upload Handlers
  elements.btnSelectFile.addEventListener('click', () => elements.fileInput.click());
  elements.dropZone.addEventListener('click', (e) => {
    if (e.target.closest('#btn-select-file')) return;
    elements.fileInput.click();
  });
  elements.fileInput.addEventListener('change', handleFileSelect);

  // Drag and Drop
  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.remove('drag-over');
    }, false);
  });

  elements.dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      processFile(files[0]);
    } else {
      showToast('Por favor, selecione um arquivo válido no formato PDF.', 'danger');
    }
  });

  // Header Actions
  elements.btnChangeFile.addEventListener('click', () => {
    elements.fileInput.click();
  });

  elements.btnResetPages.addEventListener('click', resetAllPages);

  elements.btnDownloadPdf.addEventListener('click', generateAndDownloadPDF);

  // Batch Selection Events
  elements.btnSelectAll.addEventListener('click', () => setAllSelection(true));
  elements.btnDeselectAll.addEventListener('click', () => setAllSelection(false));
  elements.btnSelectEven.addEventListener('click', () => setEvenOddSelection('even'));
  elements.btnSelectOdd.addEventListener('click', () => setEvenOddSelection('odd'));
  elements.btnDeleteSelected.addEventListener('click', deleteSelectedPages);

  // Range Removal Event
  elements.btnApplyRange.addEventListener('click', handleRangeDelete);
  elements.rangeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleRangeDelete();
  });

  // Grid Zoom Controls
  elements.btnGridSmall.addEventListener('click', () => setGridSize('small'));
  elements.btnGridMedium.addEventListener('click', () => setGridSize('medium'));
  elements.btnGridLarge.addEventListener('click', () => setGridSize('large'));

  // Modal Navigation & Actions
  elements.modalCloseBtn.addEventListener('click', closePreviewModal);
  elements.modalBackdrop.addEventListener('click', closePreviewModal);
  elements.modalPrevBtn.addEventListener('click', () => navigateModal(-1));
  elements.modalNextBtn.addEventListener('click', () => navigateModal(1));
  elements.modalRotateBtn.addEventListener('click', () => rotateCurrentModalPage());
  elements.modalDeleteBtn.addEventListener('click', deleteCurrentModalPage);

  // Keyboard navigation for modal
  document.addEventListener('keydown', (e) => {
    if (!elements.previewModal.classList.contains('hidden')) {
      if (e.key === 'Escape') closePreviewModal();
      if (e.key === 'ArrowLeft') navigateModal(-1);
      if (e.key === 'ArrowRight') navigateModal(1);
    }
  });

  /* ==========================================================================
     File Processing Logic
     ========================================================================== */

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  async function processFile(file) {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      showToast('O arquivo selecionado não é um PDF.', 'danger');
      return;
    }

    state.file = file;
    state.fileName = file.name;
    state.fileSizeStr = formatBytes(file.size);

    showLoading('Carregando PDF...', 'Lendo estrutura de páginas...');

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      state.rawPdfArrayBuffer = arrayBuffer.slice(0); // Deep clone

      // Load with PDF.js
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      state.pdfjsDoc = await loadingTask.promise;
      state.totalOriginalPages = state.pdfjsDoc.numPages;

      // Populate pages state
      state.pages = [];
      state.deletedPagesStack = [];

      for (let i = 0; i < state.totalOriginalPages; i++) {
        state.pages.push({
          id: 'page_' + Math.random().toString(36).substr(2, 9),
          originalIndex: i,
          rotation: 0,
          selected: false
        });
      }

      // Update UI Header
      elements.fileNameDisplay.textContent = state.fileName;
      elements.fileSizeDisplay.textContent = state.fileSizeStr;
      elements.fileTotalPagesDisplay.textContent = `${state.totalOriginalPages} página(s)`;
      elements.originalPagesCount.textContent = state.totalOriginalPages;

      // Switch views
      elements.uploadSection.classList.add('hidden');
      elements.editorSection.classList.remove('hidden');

      // Initialize Page Grid & Render Thumbnails
      renderPagesGrid();

      // Initialize SortableJS
      initSortable();

      updateCounters();
      showToast(`PDF "${state.fileName}" carregado com sucesso!`, 'success');

    } catch (err) {
      console.error('Error loading PDF:', err);
      showToast('Falha ao abrir o PDF. Verifique se o arquivo está corrompido ou protegido por senha.', 'danger');
    } finally {
      hideLoading();
    }
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }

  /* ==========================================================================
     Page Grid & Thumbnail Rendering
     ========================================================================== */

  function renderPagesGrid() {
    elements.pagesGrid.innerHTML = '';

    state.pages.forEach((pageObj, index) => {
      const card = createPageCardElement(pageObj, index);
      elements.pagesGrid.appendChild(card);

      // Asynchronously render thumbnail canvas
      renderPageThumbnail(pageObj, card.querySelector('.thumbnail-canvas'));
    });

    if (window.lucide) lucide.createIcons();
  }

  function createPageCardElement(pageObj, index) {
    const card = document.createElement('div');
    card.className = `page-card ${pageObj.selected ? 'selected' : ''}`;
    card.dataset.id = pageObj.id;

    card.innerHTML = `
      <div class="card-header-bar">
        <span class="page-number-tag">
          <i data-lucide="file-text"></i> Pág. ${pageObj.originalIndex + 1}
        </span>
        <input type="checkbox" class="card-select-checkbox" ${pageObj.selected ? 'checked' : ''} title="Selecionar para ações em lote">
      </div>
      
      <div class="thumbnail-wrapper">
        <canvas class="thumbnail-canvas" style="transform: rotate(${pageObj.rotation}deg);"></canvas>
        
        <div class="card-hover-overlay">
          <button class="action-btn-circle action-btn-delete" title="Remover esta página com 1 clique">
            <i data-lucide="trash-2"></i>
          </button>
          <button class="action-btn-circle action-btn-zoom" title="Visualizar em tela cheia">
            <i data-lucide="eye"></i>
          </button>
          <button class="action-btn-circle action-btn-rotate" title="Girar 90°">
            <i data-lucide="rotate-cw"></i>
          </button>
        </div>
      </div>

      <div class="card-footer-bar">
        <button class="btn-quick-delete" title="Remover página">
          <i data-lucide="trash-2"></i> Remover Página
        </button>
      </div>
    `;

    // Checkbox Toggle
    const checkbox = card.querySelector('.card-select-checkbox');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      pageObj.selected = checkbox.checked;
      card.classList.toggle('selected', pageObj.selected);
      updateCounters();
    });

    // One-Click Delete Buttons
    const deleteBtnCircle = card.querySelector('.action-btn-delete');
    const deleteBtnFooter = card.querySelector('.btn-quick-delete');
    const deleteHandler = (e) => {
      e.stopPropagation();
      deleteSinglePage(pageObj.id);
    };
    deleteBtnCircle.addEventListener('click', deleteHandler);
    deleteBtnFooter.addEventListener('click', deleteHandler);

    // Zoom Button
    const zoomBtn = card.querySelector('.action-btn-zoom');
    zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currIdx = state.pages.findIndex(p => p.id === pageObj.id);
      openPreviewModal(currIdx);
    });

    // Rotate Button
    const rotateBtn = card.querySelector('.action-btn-rotate');
    rotateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rotatePage(pageObj.id, 90);
    });

    return card;
  }

  async function renderPageThumbnail(pageObj, canvas) {
    if (!state.pdfjsDoc) return;
    try {
      const page = await state.pdfjsDoc.getPage(pageObj.originalIndex + 1);
      const viewport = page.getViewport({ scale: 0.4 });

      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error(`Error rendering page ${pageObj.originalIndex + 1}:`, err);
    }
  }

  function initSortable() {
    if (state.sortableInstance) {
      state.sortableInstance.destroy();
    }
    state.sortableInstance = Sortable.create(elements.pagesGrid, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      onEnd: () => {
        const newOrder = [];
        const cardElements = elements.pagesGrid.querySelectorAll('.page-card');
        cardElements.forEach(card => {
          const id = card.dataset.id;
          const found = state.pages.find(p => p.id === id);
          if (found) newOrder.push(found);
        });
        state.pages = newOrder;
        updateCounters();
      }
    });
  }

  /* ==========================================================================
     Page Removal & Manipulation Actions
     ========================================================================== */

  function deleteSinglePage(pageId) {
    const pageIndex = state.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    const pageObj = state.pages[pageIndex];
    const cardEl = elements.pagesGrid.querySelector(`[data-id="${pageId}"]`);

    if (cardEl) {
      cardEl.classList.add('is-deleting');
      setTimeout(() => {
        state.deletedPagesStack.push([{ page: pageObj, originalGridIndex: pageIndex }]);
        state.pages.splice(pageIndex, 1);
        cardEl.remove();
        updateCounters();

        showToastWithUndo(
          `Página ${pageObj.originalIndex + 1} removida.`,
          () => undoLastDelete()
        );
      }, 300);
    }
  }

  function deleteSelectedPages() {
    const selectedPages = state.pages.filter(p => p.selected);
    if (selectedPages.length === 0) return;

    const count = selectedPages.length;
    const deletedGroup = [];

    selectedPages.forEach(pageObj => {
      const pageIndex = state.pages.findIndex(p => p.id === pageObj.id);
      if (pageIndex !== -1) {
        deletedGroup.push({ page: pageObj, originalGridIndex: pageIndex });
        const cardEl = elements.pagesGrid.querySelector(`[data-id="${pageObj.id}"]`);
        if (cardEl) cardEl.remove();
      }
    });

    state.deletedPagesStack.push(deletedGroup);
    state.pages = state.pages.filter(p => !p.selected);
    updateCounters();

    showToastWithUndo(
      `${count} página(s) selecionada(s) removida(s).`,
      () => undoLastDelete()
    );
  }

  function handleRangeDelete() {
    const inputVal = elements.rangeInput.value.trim();
    if (!inputVal) {
      showToast('Digite a faixa de páginas. Ex: 2, 4-7, 10', 'info');
      return;
    }

    const pagesToRemoveNumbers = parsePageRanges(inputVal, state.totalOriginalPages);
    if (pagesToRemoveNumbers.length === 0) {
      showToast('Nenhuma página válida encontrada para a faixa informada.', 'danger');
      return;
    }

    const deletedGroup = [];
    const remainingPages = [];

    state.pages.forEach((pageObj, idx) => {
      const displayPageNum = pageObj.originalIndex + 1;
      if (pagesToRemoveNumbers.includes(displayPageNum)) {
        deletedGroup.push({ page: pageObj, originalGridIndex: idx });
        const cardEl = elements.pagesGrid.querySelector(`[data-id="${pageObj.id}"]`);
        if (cardEl) cardEl.remove();
      } else {
        remainingPages.push(pageObj);
      }
    });

    if (deletedGroup.length === 0) {
      showToast('As páginas da faixa especificada já foram removidas.', 'info');
      return;
    }

    state.deletedPagesStack.push(deletedGroup);
    state.pages = remainingPages;
    elements.rangeInput.value = '';
    updateCounters();

    showToastWithUndo(
      `${deletedGroup.length} página(s) removida(s) pela faixa especificada.`,
      () => undoLastDelete()
    );
  }

  function parsePageRanges(inputStr, maxPages) {
    const pageNumbers = new Set();
    const parts = inputStr.split(',');

    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(maxPages, Math.max(start, end));
          for (let i = min; i <= max; i++) {
            pageNumbers.add(i);
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= maxPages) {
          pageNumbers.add(num);
        }
      }
    });

    return Array.from(pageNumbers);
  }

  function undoLastDelete() {
    if (state.deletedPagesStack.length === 0) return;

    const lastGroup = state.deletedPagesStack.pop();
    lastGroup.forEach(item => {
      item.page.selected = false;
      state.pages.splice(item.originalGridIndex, 0, item.page);
    });

    renderPagesGrid();
    initSortable();
    updateCounters();

    showToast(`Página(s) restaurada(s) com sucesso.`, 'success');
  }

  function resetAllPages() {
    if (state.pages.length === state.totalOriginalPages) {
      showToast('Todas as páginas já estão na tela.', 'info');
      return;
    }

    state.pages = [];
    state.deletedPagesStack = [];
    for (let i = 0; i < state.totalOriginalPages; i++) {
      state.pages.push({
        id: 'page_' + Math.random().toString(36).substr(2, 9),
        originalIndex: i,
        rotation: 0,
        selected: false
      });
    }

    renderPagesGrid();
    initSortable();
    updateCounters();

    showToast('Todas as páginas originais foram restauradas.', 'success');
  }

  function rotatePage(pageId, angle) {
    const pageObj = state.pages.find(p => p.id === pageId);
    if (!pageObj) return;

    pageObj.rotation = (pageObj.rotation + angle) % 360;

    const cardEl = elements.pagesGrid.querySelector(`[data-id="${pageId}"]`);
    if (cardEl) {
      const canvas = cardEl.querySelector('.thumbnail-canvas');
      canvas.style.transform = `rotate(${pageObj.rotation}deg)`;
    }
  }

  /* ==========================================================================
     Selection & Grid UI Controls
     ========================================================================== */

  function setAllSelection(selected) {
    state.pages.forEach(p => p.selected = selected);
    const checkboxes = elements.pagesGrid.querySelectorAll('.card-select-checkbox');
    const cards = elements.pagesGrid.querySelectorAll('.page-card');

    checkboxes.forEach(cb => cb.checked = selected);
    cards.forEach(card => card.classList.toggle('selected', selected));

    updateCounters();
  }

  function setEvenOddSelection(type) {
    state.pages.forEach((p, idx) => {
      const pageNumDisplay = p.originalIndex + 1;
      const isMatch = (type === 'even' && pageNumDisplay % 2 === 0) || (type === 'odd' && pageNumDisplay % 2 !== 0);
      p.selected = isMatch;

      const card = elements.pagesGrid.querySelector(`[data-id="${p.id}"]`);
      if (card) {
        card.classList.toggle('selected', isMatch);
        const cb = card.querySelector('.card-select-checkbox');
        if (cb) cb.checked = isMatch;
      }
    });

    updateCounters();
  }

  function setGridSize(size) {
    state.gridSize = size;
    elements.pagesGrid.className = `pages-grid grid-${size}`;

    [elements.btnGridSmall, elements.btnGridMedium, elements.btnGridLarge].forEach(btn => btn.classList.remove('active'));
    if (size === 'small') elements.btnGridSmall.classList.add('active');
    if (size === 'medium') elements.btnGridMedium.classList.add('active');
    if (size === 'large') elements.btnGridLarge.classList.add('active');
  }

  function updateCounters() {
    const activeCount = state.pages.length;
    const deletedCount = state.totalOriginalPages - activeCount;
    const selectedCount = state.pages.filter(p => p.selected).length;

    elements.activePagesCount.textContent = activeCount;
    elements.countDownloadPages.textContent = activeCount;

    if (deletedCount > 0) {
      elements.deletedBadge.classList.remove('hidden');
      elements.deletedPagesCount.textContent = deletedCount;
    } else {
      elements.deletedBadge.classList.add('hidden');
    }

    if (selectedCount > 0) {
      elements.btnDeleteSelected.classList.remove('hidden');
      elements.selectedCountDisplay.textContent = selectedCount;
    } else {
      elements.btnDeleteSelected.classList.add('hidden');
    }

    if (activeCount === 0) {
      elements.btnDownloadPdf.disabled = true;
      elements.btnDownloadPdf.style.opacity = '0.5';
      elements.btnDownloadPdf.style.cursor = 'not-allowed';
    } else {
      elements.btnDownloadPdf.disabled = false;
      elements.btnDownloadPdf.style.opacity = '1';
      elements.btnDownloadPdf.style.cursor = 'pointer';
    }
  }

  /* ==========================================================================
     Fullscreen Zoom Preview Modal
     ========================================================================== */

  async function openPreviewModal(pageIndex) {
    if (pageIndex < 0 || pageIndex >= state.pages.length) return;

    state.currentPreviewIndex = pageIndex;
    elements.previewModal.classList.remove('hidden');

    renderModalPreview();
  }

  async function renderModalPreview() {
    const pageObj = state.pages[state.currentPreviewIndex];
    if (!pageObj || !state.pdfjsDoc) return;

    elements.modalPageLabel.textContent = `Página ${pageObj.originalIndex + 1} (${state.currentPreviewIndex + 1} de ${state.pages.length})`;

    try {
      const page = await state.pdfjsDoc.getPage(pageObj.originalIndex + 1);
      const viewport = page.getViewport({ scale: 1.2 });

      const canvas = elements.previewCanvas;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.transform = `rotate(${pageObj.rotation}deg)`;

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    } catch (err) {
      console.error('Error in modal preview render:', err);
    }
  }

  function navigateModal(direction) {
    const newIdx = state.currentPreviewIndex + direction;
    if (newIdx >= 0 && newIdx < state.pages.length) {
      state.currentPreviewIndex = newIdx;
      renderModalPreview();
    }
  }

  function rotateCurrentModalPage() {
    if (state.currentPreviewIndex >= 0 && state.currentPreviewIndex < state.pages.length) {
      const pageObj = state.pages[state.currentPreviewIndex];
      rotatePage(pageObj.id, 90);
      renderModalPreview();
    }
  }

  function deleteCurrentModalPage() {
    if (state.currentPreviewIndex >= 0 && state.currentPreviewIndex < state.pages.length) {
      const pageObj = state.pages[state.currentPreviewIndex];
      const pageId = pageObj.id;
      
      closePreviewModal();
      deleteSinglePage(pageId);
    }
  }

  function closePreviewModal() {
    elements.previewModal.classList.add('hidden');
    state.currentPreviewIndex = -1;
  }

  /* ==========================================================================
     PDF Export & Generation (PDF-Lib)
     ========================================================================== */

  async function generateAndDownloadPDF() {
    if (state.pages.length === 0) {
      showToast('Não é possível exportar um PDF sem páginas.', 'danger');
      return;
    }

    showLoading('Gerando PDF Editado...', 'Processando páginas e montando novo arquivo...');

    try {
      const { PDFDocument, degrees } = PDFLib;
      const srcPdfDoc = await PDFDocument.load(state.rawPdfArrayBuffer);
      const newPdfDoc = await PDFDocument.create();

      const indicesToCopy = state.pages.map(p => p.originalIndex);
      const copiedPages = await newPdfDoc.copyPages(srcPdfDoc, indicesToCopy);

      copiedPages.forEach((copiedPage, i) => {
        const pageObj = state.pages[i];
        if (pageObj.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle || 0;
          copiedPage.setRotation(degrees((currentRotation + pageObj.rotation) % 360));
        }
        newPdfDoc.addPage(copiedPage);
      });

      const newPdfBytes = await newPdfDoc.save();

      const outputFileName = getOutputFileName(state.fileName);
      downloadBlob(newPdfBytes, outputFileName, 'application/pdf');

      showToast(`PDF editado ("${outputFileName}") baixado com sucesso!`, 'success');

    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Erro ao compilar o novo PDF. Tente novamente.', 'danger');
    } finally {
      hideLoading();
    }
  }

  function getOutputFileName(originalName) {
    if (!originalName) return 'documento_editado.pdf';
    const dotIdx = originalName.lastIndexOf('.');
    if (dotIdx === -1) return `${originalName}_editado.pdf`;
    const name = originalName.substring(0, dotIdx);
    const ext = originalName.substring(dotIdx);
    return `${name}_editado${ext}`;
  }

  function downloadBlob(data, fileName, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /* ==========================================================================
     UI Helpers & Toast System
     ========================================================================== */

  function showLoading(title, subtext) {
    elements.loadingText.textContent = title || 'Processando...';
    elements.loadingSubtext.textContent = subtext || 'Por favor, aguarde.';
    elements.loadingOverlay.classList.remove('hidden');
  }

  function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
  }

  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    if (type === 'danger') iconName = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <div class="toast-message">${message}</div>
    `;

    elements.toastContainer.appendChild(toast);
    if (window.lucide) lucide.createIcons({ el: toast });

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  function showToastWithUndo(message, onUndo) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-info';

    toast.innerHTML = `
      <i data-lucide="trash-2"></i>
      <div class="toast-message">${message}</div>
      <button class="btn btn-sm btn-warning" style="margin-left: 0.5rem;">Desfazer</button>
    `;

    const undoBtn = toast.querySelector('button');
    undoBtn.addEventListener('click', () => {
      onUndo();
      toast.remove();
    });

    elements.toastContainer.appendChild(toast);
    if (window.lucide) lucide.createIcons({ el: toast });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 250);
      }
    }, 5000);
  }

  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
});
