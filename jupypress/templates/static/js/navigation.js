(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    var frame = document.querySelector('.slide-frame');
    var slides = frame.querySelectorAll('.slide');
    var progress = frame.querySelector('.slide-ui__toolbar .progress');
    var announce = document.getElementById('slide-announce');
    var slideUI = frame.querySelector('.slide-ui');
    var total = slides.length;
    var current = 0;

    if (total === 0) return;

    /* Slide Visibility */
    function showSlide(index) {
      if (index < 0 || index >= total) return;
      slides[current].setAttribute('hidden', '');
      current = index;
      slides[current].removeAttribute('hidden');
      updateProgress();
      updateHash();
      announceSlide();
      updateNavButtons();
      closePicker();
      updatePickerActive();
    }

    /* Progress */
    function updateProgress() {
      if (progress) progress.textContent = (current + 1) + ' / ' + total;
    }

    /* Nav Button State */
    var btnPrev = frame.querySelector('[data-nav="prev"]');
    var btnNext = frame.querySelector('[data-nav="next"]');

    function updateNavButtons() {
      if (btnPrev) btnPrev.style.opacity = current === 0 ? '0.3' : '';
      if (btnNext) btnNext.style.opacity = current === total - 1 ? '0.3' : '';
    }

    /* URL Hash */
    function updateHash() {
      try {
        var slide = slides[current];
        var name = slide.getAttribute('data-name') || '';
        var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        var hash = '#slide-' + (current + 1);
        if (slug) hash += '-' + slug;
        history.replaceState(null, '', hash);
      } catch (e) { /* not available in srcdoc iframe */ }
    }

    function readHash() {
      try {
        var match = location.hash.match(/^#slide-(\d+)/);
        if (match) {
          var n = parseInt(match[1], 10) - 1;
          if (n >= 0 && n < total) return n;
        }
      } catch (e) { /* not available in srcdoc iframe */ }
      return 0;
    }

    /* Aria */
    function announceSlide() {
      if (announce) announce.textContent = 'Slide ' + (current + 1) + ' of ' + total;
    }

    /* Keyboard */
    document.addEventListener('keydown', function (e) {
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': e.preventDefault(); showSlide(current + 1); break;
        case 'ArrowLeft':  case 'ArrowUp':   e.preventDefault(); showSlide(current - 1); break;
        case 'Home': e.preventDefault(); showSlide(0); break;
        case 'End':  e.preventDefault(); showSlide(total - 1); break;
        case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
        case 't': case 'T': e.preventDefault(); toggleTheme(); break;
        case '+': case '=': e.preventDefault(); changeFontScale(10); break;
        case '-': case '_': e.preventDefault(); changeFontScale(-10); break;
        case 'p': case 'P': e.preventDefault(); toggleProgress(); break;
      }
    });

    /* Slide Picker */
    var picker = frame.querySelector('.slide-picker');
    var pickerMenu = frame.querySelector('.slide-picker__menu');
    var pickerItems = frame.querySelectorAll('.slide-picker__item');

    frame.addEventListener('click', function (e) {
      var pickerItem = e.target.closest('[data-slide-index]');
      if (pickerItem) {
        e.stopPropagation();
        showSlide(parseInt(pickerItem.getAttribute('data-slide-index'), 10));
        return;
      }
      var btn = e.target.closest('[data-nav]');
      if (btn) {
        e.stopPropagation();
        var action = btn.getAttribute('data-nav');
        if (action === 'prev') showSlide(current - 1);
        else if (action === 'next') showSlide(current + 1);
        else if (action === 'home') showSlide(0);
        else if (action === 'fullscreen') toggleFullscreen();
        else if (action === 'theme') toggleTheme();
        else if (action === 'font-up') changeFontScale(10);
        else if (action === 'font-down') changeFontScale(-10);
        else if (action === 'picker') togglePicker();
        return;
      }
      if (e.target.closest('.slide-ui, a, button, input, textarea, select, video, audio')) return;
      var rect = frame.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var third = rect.width / 3;
      if (x < third) showSlide(current - 1);
      else if (x > third * 2) showSlide(current + 1);
    });

    function togglePicker() {
      if (pickerMenu) {
        if (!pickerMenu.hidden) closePicker();
        else openPicker();
      }
    }

    function openPicker() {
      if (pickerMenu) {
        pickerMenu.hidden = false;
        if (picker) picker.classList.add('slide-picker--open');
        updatePickerActive();
        var active = pickerMenu.querySelector('.slide-picker__item--active');
        if (active) active.scrollIntoView({ block: 'nearest' });
      }
    }

    function closePicker() {
      if (pickerMenu) {
        pickerMenu.hidden = true;
        if (picker) picker.classList.remove('slide-picker--open');
      }
    }

    function updatePickerActive() {
      for (var i = 0; i < pickerItems.length; i++) {
        pickerItems[i].classList.toggle('slide-picker__item--active', i === current);
      }
    }

    document.addEventListener('mousedown', function (e) {
      if (picker && !picker.contains(e.target)) closePicker();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePicker();
    });

    /* UI Auto-Hide */
    var uiTimer = null;

    function showUI() {
      if (slideUI) {
        slideUI.classList.add('slide-ui--visible');
        clearTimeout(uiTimer);
        uiTimer = setTimeout(hideUI, 2000);
      }
    }

    function hideUI() {
      if (slideUI) slideUI.classList.remove('slide-ui--visible');
    }

    frame.addEventListener('mousemove', showUI);
    frame.addEventListener('mouseleave', function () {
      clearTimeout(uiTimer);
      uiTimer = setTimeout(hideUI, 500);
    });

    /* Touch Swipe */
    var touchStartX = 0;
    var SWIPE_THRESHOLD = 50;

    frame.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
      showUI();
    }, { passive: true });

    frame.addEventListener('touchend', function (e) {
      if (e.changedTouches.length === 1) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          if (dx < 0) showSlide(current + 1);
          else showSlide(current - 1);
        }
      }
    }, { passive: true });

    /* Fullscreen */
    function toggleFullscreen() {
      try {
        if (!document.fullscreenElement) {
          (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
        } else {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        }
      } catch (_) {}
    }

    document.addEventListener('fullscreenchange', rescale);
    document.addEventListener('webkitfullscreenchange', rescale);

    /* Theme Toggle */
    function toggleTheme() {
      var html = document.documentElement;
      var t = html.getAttribute('data-theme') || 'light';
      html.setAttribute('data-theme', t === 'light' ? 'dark' : 'light');
    }

    /* Font Scale */
    var fontScale = 100;
    var fontLabel = frame.querySelector('.slide-ui__font-label');

    function changeFontScale(delta) {
      fontScale = Math.max(50, Math.min(150, fontScale + delta));
      for (var i = 0; i < slides.length; i++) {
        slides[i].style.zoom = (fontScale / 100).toString();
      }
      if (fontLabel) fontLabel.textContent = fontScale + '%';
    }

    /* Letterbox Scaling */
    var FRAME_W = 1200;
    var FRAME_H = 675;
    var resizeTimer = null;

    function rescale() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var scale = Math.min(vw / FRAME_W, vh / FRAME_H);
      var offsetX = (vw - FRAME_W * scale) / 2;
      var offsetY = (vh - FRAME_H * scale) / 2;
      frame.style.transform = 'translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scale + ')';
    }

    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rescale, 100);
    });

    /* Progress Toggle */
    function toggleProgress() {
      var toolbar = frame.querySelector('.slide-ui__toolbar');
      if (toolbar) toolbar.hidden = !toolbar.hidden;
    }

    /* Hash Change */
    window.addEventListener('hashchange', function () {
      var target = readHash();
      if (target !== current) showSlide(target);
    });

    /* ── Kernel Indicator ─────────────────────────────────────────── */

    var kernelIndicator = frame.querySelector('.kernel-indicator');

    function setKernelConnected(connected) {
      if (!kernelIndicator) return;
      if (connected) {
        kernelIndicator.classList.add('kernel-indicator--visible');
      } else {
        kernelIndicator.classList.remove('kernel-indicator--visible');
      }
    }

    /* ── postMessage bridge ─────────────────────────────────────────── */

    window.addEventListener('message', function (e) {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'jupypress:goto') {
        var idx = parseInt(e.data.index, 10);
        if (!isNaN(idx) && idx >= 0 && idx < total) showSlide(idx);
      } else if (e.data.type === 'jupypress:kernelStatus') {
        setKernelConnected(!!e.data.connected);
      } else if (e.data.type === 'jupypress:cellOutput') {
        var cellIndex = e.data.cellIndex;
        var wrapper = document.querySelector('.cell-code-wrapper[data-cell-index="' + cellIndex + '"]');
        if (!wrapper) return;
        var outputDiv = wrapper.querySelector('.cell-code-output');
        var editor = wrapper.querySelector('.cell-code-editor');
        var editBtn = wrapper.querySelector('.cell-edit-btn');
        var runBtn = wrapper.querySelector('.cell-code-run-btn');
        var textarea = wrapper.querySelector('.cell-code-textarea');
        var codeEl = wrapper.querySelector('.cell-code-input code');

        /* Update the visible input to reflect edited source */
        if (codeEl && textarea) codeEl.textContent = textarea.value;

        /* Update output */
        if (outputDiv) {
          outputDiv.innerHTML = e.data.error
            ? '<pre class="cell-output-error">' + escHtml(e.data.error) + '</pre>'
            : renderOutputs(e.data.outputs || null, e.data.html || '');
          if (typeof hljs !== 'undefined') {
            outputDiv.querySelectorAll('pre code').forEach(function (el) {
              hljs.highlightElement(el);
            });
          }
          initPlotlyIn(outputDiv);
          /* Re-initialize any widgets in the new output */
          initWidgetsIn(outputDiv);
        }

        /* Hide editor, re-enable controls */
        if (editor) editor.setAttribute('hidden', '');
        if (editBtn) editBtn.removeAttribute('hidden');
        if (runBtn) { runBtn.disabled = false; runBtn.innerHTML = '&#9654; Run'; }
      }
    });

    /* ── Code Cell Edit/Run UI ────────────────────────────────────── */

    function escHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escapeAttr(str) {
      return escHtml(str).replace(/`/g, '&#96;');
    }

    function joinMimeLines(value) {
      if (Array.isArray(value)) return value.join('');
      if (value == null) return '';
      return String(value);
    }

    function stripAnsi(str) {
      return String(str).replace(/\x1b\[[0-9;]*m/g, '');
    }

    function renderOutputs(outputs, fallbackHtml) {
      if (!outputs || !outputs.length) return fallbackHtml || '';
      return outputs.map(renderOutput).join('\n');
    }

    function renderOutput(output) {
      var type = output.output_type || '';
      if (type === 'stream') {
        return '<pre class="cell-output-stream">' + escHtml(joinMimeLines(output.text)) + '</pre>';
      }
      if (type === 'error') {
        var traceback = Array.isArray(output.traceback) ? stripAnsi(output.traceback.join('\n')) : '';
        var fallback = (output.ename || 'Error') + ': ' + (output.evalue || '');
        var message = traceback ? traceback + '\n' + fallback : fallback;
        return '<pre class="cell-output-error">' + escHtml(message) + '</pre>';
      }
      return renderMimeBundle(output.data || {});
    }

    function renderMimeBundle(data) {
      if (data['application/vnd.jupyter.widget-view+json']) {
        var widget = data['application/vnd.jupyter.widget-view+json'];
        var modelId = escapeAttr(widget && widget.model_id ? widget.model_id : '');
        var widgetFallback = joinMimeLines(data['text/plain']);
        return '<div class="cell-output-html jupyter-widgets">' +
          '<div class="widget-subarea widget-subarea-output">' +
          '<div class="jupyter-widgets widget-output" data-model-id="' + modelId + '"></div>' +
          '</div>' +
          '<pre class="cell-output-text widget-fallback">' + escHtml(widgetFallback) + '</pre>' +
          '</div>';
      }
      if (data['application/vnd.plotly.v1+json']) {
        var plotlyPayload = escapeAttr(JSON.stringify(data['application/vnd.plotly.v1+json']));
        var plotlyFallback = joinMimeLines(data['text/plain']) || 'Plotly output';
        return '<div class="cell-output-plotly" data-plotly="' + plotlyPayload + '">' +
          '<pre class="cell-output-text">' + escHtml(plotlyFallback) + '</pre>' +
          '</div>';
      }
      if (data['image/svg+xml']) {
        return '<div class="cell-output-svg">' + joinMimeLines(data['image/svg+xml']) + '</div>';
      }
      if (data['image/png']) {
        return '<img class="cell-output-image" src="data:image/png;base64,' + joinMimeLines(data['image/png']) + '" alt="output">';
      }
      if (data['image/jpeg']) {
        return '<img class="cell-output-image" src="data:image/jpeg;base64,' + joinMimeLines(data['image/jpeg']) + '" alt="output">';
      }
      if (data['text/html']) {
        return '<div class="cell-output-html">' + joinMimeLines(data['text/html']) + '</div>';
      }
      if (data['text/markdown']) {
        return '<pre class="cell-output-markdown">' + escHtml(joinMimeLines(data['text/markdown'])) + '</pre>';
      }
      if (data['text/latex']) {
        return '<pre class="cell-output-latex">' + escHtml(joinMimeLines(data['text/latex'])) + '</pre>';
      }
      if (data['text/plain']) {
        return '<pre class="cell-output-text">' + escHtml(joinMimeLines(data['text/plain'])) + '</pre>';
      }
      return '';
    }

    var wrappers = document.querySelectorAll('.cell-code-wrapper');
    wrappers.forEach(function (wrapper) {
      var editBtn = wrapper.querySelector('.cell-edit-btn');
      var editorDiv = wrapper.querySelector('.cell-code-editor');
      var runBtn = wrapper.querySelector('.cell-code-run-btn');
      var cancelBtn = wrapper.querySelector('.cell-code-cancel-btn');
      var textarea = wrapper.querySelector('.cell-code-textarea');

      if (editBtn) {
        editBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          editorDiv.removeAttribute('hidden');
          editBtn.setAttribute('hidden', '');
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          editorDiv.setAttribute('hidden', '');
          if (editBtn) editBtn.removeAttribute('hidden');
        });
      }

      if (runBtn) {
        runBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var cellIndex = parseInt(wrapper.getAttribute('data-cell-index') || '-1', 10);
          var source = textarea.value;
          runBtn.disabled = true;
          runBtn.textContent = '⏳ Running…';
          window.parent.postMessage(
            { type: 'jupypress:execute', cellIndex: cellIndex, source: source },
            '*'
          );
        });
      }
    });

    /* ── Plotly Support ────────────────────────────────────────────── */

    var plotlyLoading = false;
    var plotlyCallbacks = [];

    function ensurePlotly(callback) {
      if (window.Plotly && typeof window.Plotly.newPlot === 'function') {
        callback();
        return;
      }
      plotlyCallbacks.push(callback);
      if (plotlyLoading) return;
      plotlyLoading = true;
      var script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
      script.async = true;
      script.onload = function () {
        var pending = plotlyCallbacks.slice();
        plotlyCallbacks = [];
        pending.forEach(function (fn) { fn(); });
      };
      script.onerror = function () {
        plotlyCallbacks = [];
      };
      document.head.appendChild(script);
    }

    function initPlotlyIn(root) {
      var scope = root || document;
      scope.querySelectorAll('.cell-output-plotly[data-plotly]').forEach(function (el) {
        if (el.getAttribute('data-plotly-rendered') === 'true') return;
        var payloadText = el.getAttribute('data-plotly') || '';
        if (!payloadText) return;
        ensurePlotly(function () {
          try {
            var payload = JSON.parse(payloadText);
            var config = payload.config || { responsive: true, displayModeBar: false };
            el.innerHTML = '';
            window.Plotly.newPlot(el, payload.data || [], payload.layout || {}, config);
            el.setAttribute('data-plotly-rendered', 'true');
          } catch (_) {}
        });
      });
    }

    /* ── Jupyter Widget Support ───────────────────────────────────── */

    function initWidgetsIn(root) {
      if (typeof window.jupypressInitWidgets !== 'function') return;
      try {
        window.jupypressInitWidgets(root);
      } catch (_) {}
    }

    /* Init widgets already present on load */
    document.querySelectorAll('.cell-output-html').forEach(function (el) {
      initWidgetsIn(el);
    });
    initPlotlyIn(document);

    /* Init */
    var startSlide = readHash();
    if (startSlide !== 0) {
      showSlide(startSlide);
    } else {
      updateProgress();
      updateHash();
      announceSlide();
      updateNavButtons();
    }
    rescale();

  });
})();
