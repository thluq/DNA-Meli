document.addEventListener('DOMContentLoaded', () => {
  // Icons Preload
  const loadedIcons = {};
  const iconsPaths = {
    'usuario': 'assets/criovalorparaousuario.png',
    'beta': 'assets/bcontinuo.png',
    'equipe': 'assets/compitoemequipe.png',
    'maximo': 'assets/douomaximo.png',
    'excelencia': 'assets/executocomexcelencia.png',
    'empreendo': 'assets/empreendoassumindoriscos.png',
    'logo': 'assets/meli.png',
    'melibar': 'assets/melibar.png'
  };

  Object.entries(iconsPaths).forEach(([key, path]) => {
    const img = new Image();
    img.src = path;
    loadedIcons[key] = img;
  });

  // State
  let userName = '';
  let currentQuestionIndex = 0;
  const answers = [];

  // Elements
  const screenStart = document.getElementById('screen-start');
  const screenQuestion = document.getElementById('screen-question');
  const screenResult = document.getElementById('screen-result');

  const btnStart = document.getElementById('btn-start');
  const btnBack = document.getElementById('btn-back');
  const progressText = document.getElementById('progress-text');
  const progressBar = document.getElementById('progress-bar');
  const questionText = document.getElementById('question-text');
  const optionsContainer = document.getElementById('options-container');

  // Utils
  function shuffleArray(array) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
  }

  // Logic
  function calcularResultado(respostas) {
    const scores = { usuario: 0, beta: 0, equipe: 0, maximo: 0, excelencia: 0, empreendo: 0 };
    respostas.forEach(op => {
      scores[op.principio]++;
    });

    const afinidade = Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, Math.round((v / 8) * 100)])
    );

    const ranking = Object.entries(afinidade).sort((a, b) => b[1] - a[1]);

    const dominanteKey = ranking[0][0];
    const secundarioKey = ranking[1][0];
    const isHibrido = ranking[0][1] === ranking[1][1];

    return {
      scores,
      afinidade,
      ranking,
      dominante: window.PROFILES[dominanteKey],
      secundario: window.PROFILES[secundarioKey],
      isHibrido
    };
  }

  // Render Question
  function renderQuestion() {
    const q = window.QUESTIONS[currentQuestionIndex];
    progressText.textContent = currentQuestionIndex + 1;
    progressBar.style.width = `${((currentQuestionIndex + 1) / window.QUESTIONS.length) * 100}%`;

    questionText.textContent = q.situacao;
    optionsContainer.innerHTML = '';

    const shuffledOptions = shuffleArray(q.opcoes);

    shuffledOptions.forEach(op => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = op.texto;
      btn.addEventListener('click', () => handleAnswer(btn, op));
      optionsContainer.appendChild(btn);
    });

    btnBack.style.visibility = currentQuestionIndex > 0 ? 'visible' : 'hidden';
  }

  function handleAnswer(btnElement, option) {
    Array.from(optionsContainer.children).forEach(b => b.disabled = true);
    btnElement.classList.add('selected');

    setTimeout(() => {
      answers.push(option);
      if (answers.length < window.QUESTIONS.length) {
        currentQuestionIndex++;
        renderQuestion();
      } else {
        finishQuiz();
      }
    }, 300);
  }

  btnBack.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
      answers.pop();
      currentQuestionIndex--;
      renderQuestion();
    }
  });

  // Render Result
  function finishQuiz() {
    const result = calcularResultado(answers);

    document.getElementById('result-title').textContent = userName ? `${userName}, o seu DNA é:` : 'O seu DNA é:';
    document.getElementById('res-name').textContent = result.dominante.principio;
    document.getElementById('res-principle').textContent = `"${result.dominante.nome}"`;
    document.getElementById('res-desc').textContent = result.dominante.descricao;
    document.getElementById('res-strength').textContent = result.dominante.forca;
    document.getElementById('res-attention').textContent = result.dominante.atencao;

    const hybridBadge = document.getElementById('hybrid-badge');
    const secContainer = document.getElementById('secondary-profile-container');

    if (result.isHibrido) {
      hybridBadge.classList.remove('hidden');
      hybridBadge.textContent = 'Perfil Híbrido';
      secContainer.classList.remove('hidden');
      document.getElementById('sec-name').textContent = result.secundario.principio;
      document.getElementById('sec-desc').textContent = `"${result.secundario.nome}" - ${result.secundario.descricao}`;
    } else if (result.ranking[1][1] > 0) {
      hybridBadge.classList.add('hidden');
      secContainer.classList.remove('hidden');
      document.getElementById('sec-name').textContent = result.secundario.principio;
      document.getElementById('sec-desc').textContent = `"${result.secundario.nome}" - ${result.secundario.descricao}`;
    } else {
      hybridBadge.classList.add('hidden');
      secContainer.classList.add('hidden');
    }

    renderRadar(result.afinidade);
    renderBars(result.afinidade);

    showScreen(screenResult);
  }

  // Draw SVG Radar
  function renderRadar(afinidade) {
    const container = document.getElementById('radar-container');
    const axes = ['usuario', 'beta', 'equipe', 'maximo', 'excelencia', 'empreendo'];
    const labels = ['Usuário', 'Beta', 'Equipe', 'Máximo', 'Excelência', 'Empreendo'];

    const size = 300;
    const center = size / 2;
    const radius = 100;

    let svg = `<svg width="100%" viewBox="0 0 ${size} ${size}">`;

    // Background grid
    for (let i = 1; i <= 4; i++) {
      const r = (radius / 4) * i;
      let points = '';
      axes.forEach((_, index) => {
        const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        points += `${x},${y} `;
      });
      svg += `<polygon points="${points.trim()}" fill="none" stroke="#eeeeee" stroke-width="1"/>`;
    }

    // Axes lines and labels
    axes.forEach((axis, index) => {
      const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      svg += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#eeeeee" stroke-width="1"/>`;

      const iconSize = 45;
      const lx = center + (radius + 28) * Math.cos(angle) - iconSize / 2;
      const ly = center + (radius + 28) * Math.sin(angle) - iconSize / 2;
      svg += `<image href="${iconsPaths[axis]}" x="${lx}" y="${ly}" width="${iconSize}" height="${iconSize}"/>`;
    });

    // Data Polygon
    let dataPoints = '';
    axes.forEach((axis, index) => {
      const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
      let val = afinidade[axis];
      if (val > 100) val = 100;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      dataPoints += `${x},${y} `;
    });

    svg += `<polygon points="${dataPoints.trim()}" fill="#FFE600" fill-opacity="0.6" stroke="#E5CE00" stroke-width="2"/>`;

    // Data Points
    axes.forEach((axis, index) => {
      const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
      let val = afinidade[axis];
      if (val > 100) val = 100;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="#E5CE00"/>`;
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  // Render Bars
  function renderBars(afinidade) {
    const container = document.getElementById('bars-container');
    container.innerHTML = '';

    const ranking = Object.entries(afinidade).sort((a, b) => b[1] - a[1]);

    ranking.forEach(([key, value]) => {
      if (value > 0) {
        const p = window.PROFILES[key];
        const div = document.createElement('div');
        div.className = 'bar-row';
        div.innerHTML = `
          <div class="bar-label">
            <span>${p.principio}</span>
            <span>${value}%</span>
          </div>
          <div class="bar-bg">
            <div class="bar-fill" style="width: ${value}%"></div>
          </div>
        `;
        container.appendChild(div);
      }
    });
  }

  // Events
  btnStart.addEventListener('click', () => {
    const input = document.getElementById('user-name');
    if (input && input.value.trim() !== '') {
      userName = input.value.trim();
    } else {
      alert('Por favor, insira seu nome para começar.');
      return;
    }
    currentQuestionIndex = 0;
    answers.length = 0;
    renderQuestion();
    showScreen(screenQuestion);
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    currentQuestionIndex = 0;
    answers.length = 0;
    showScreen(screenStart);
    document.getElementById('screen-result').scrollTo(0, 0);
  });

  // Share / Download Logic
  document.getElementById('btn-share').addEventListener('click', async () => {
    const result = calcularResultado(answers);
    const dataUrl = drawCanvasShare(result);

    const fallbackDownload = () => {
      try {
        const link = document.createElement('a');
        link.download = 'meu-dna-meli.png';
        link.href = dataUrl;
        link.click();
      } catch (e) {
        showFallbackModal(dataUrl);
      }
    };

    if (navigator.share) {
      try {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], 'meu-dna-meli.png', { type: mime });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Meu DNA MELI',
            text: `Fiz o teste e meu DNA MELI é "${result.dominante.principio}"!`,
            files: [file]
          });
        } else {
          fallbackDownload();
        }
      } catch (err) {
        console.error(err);
        fallbackDownload();
      }
    } else {
      fallbackDownload();
    }
  });

  function showFallbackModal(dataUrl) {
    const modal = document.getElementById('modal-fallback');
    const img = document.getElementById('modal-image');
    img.src = dataUrl;
    modal.classList.remove('hidden');
  }

  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('modal-fallback').classList.add('hidden');
  });

  function drawCanvasShare(result) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 1080, 1350);

    // Yellow Header
    ctx.fillStyle = '#FFE600';
    ctx.fillRect(0, 0, 1080, 60);

    // Draw Melibar Logo on the top left
    if (loadedIcons['melibar']) {
      // Let's constrain its height to fit the 60px bar, with some padding (e.g. 40px height)
      const maxH = 40;
      const w = (maxH / loadedIcons['melibar'].height) * loadedIcons['melibar'].width;
      ctx.drawImage(loadedIcons['melibar'], 20, 10, w, maxH);
    }

    // Note: Main Logo is drawn at the end now

    // User Name text
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(userName ? `${userName}, o seu DNA é:` : 'O seu DNA é:', 540, 150);

    // Profile Name (Principio)
    ctx.fillStyle = '#333333';
    ctx.font = '900 48px sans-serif';
    ctx.fillText(result.dominante.principio, 540, 220);

    // Archetype Name
    ctx.fillStyle = '#666';
    ctx.font = 'italic 40px sans-serif';
    ctx.fillText(`"${result.dominante.nome}"`, 540, 280);

    // Feedback Texts
    ctx.fillStyle = '#555';
    ctx.font = '28px sans-serif';
    let textY = 340;
    textY = fillWrappedText(ctx, result.dominante.descricao, 540, textY, 800, 36);
    
    textY += 20;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Sua maior força:', 540, textY);
    ctx.font = '28px sans-serif';
    textY = fillWrappedText(ctx, result.dominante.forca, 540, textY + 36, 800, 36);

    if (result.isHibrido) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('& ' + result.secundario.principio, 540, textY + 40);
    }

    // Draw Radar
    const size = 600;
    const center = 540;
    const cy = 840;
    const radius = 200;
    const axes = ['usuario', 'beta', 'equipe', 'maximo', 'excelencia', 'empreendo'];
    const labels = ['Usuário', 'Beta', 'Equipe', 'Máximo', 'Excelência', 'Empreendo'];

    // grid
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 4; i++) {
      const r = (radius / 4) * i;
      ctx.beginPath();
      axes.forEach((_, index) => {
        const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    // axes lines & labels
    ctx.fillStyle = '#666';
    ctx.font = 'bold 24px sans-serif';
    axes.forEach((axis, index) => {
      const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(center, cy);
      ctx.lineTo(x, y);
      ctx.stroke();

      const iconSize = 120;
      const lx = center + (radius + 80) * Math.cos(angle) - iconSize / 2;
      const ly = cy + (radius + 80) * Math.sin(angle) - iconSize / 2;
      if (loadedIcons[axis]) {
        ctx.drawImage(loadedIcons[axis], lx, ly, iconSize, iconSize);
      }
    });

    // data polygon
    ctx.fillStyle = 'rgba(255, 230, 0, 0.6)';
    ctx.strokeStyle = '#E5CE00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    axes.forEach((axis, index) => {
      const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
      let val = result.afinidade[axis];
      if (val > 100) val = 100;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top affinities text below radar
    ctx.fillStyle = '#333';
    ctx.font = 'bold 32px sans-serif';
    let yPos = 1220;
    result.ranking.slice(0, 3).forEach(([key, val]) => {
      if (val > 0) {
        ctx.fillText(`${window.PROFILES[key].principio}: ${val}%`, 540, yPos);
        yPos += 50;
      }
    });

    return canvas.toDataURL('image/png');
  }

  // Utils for Canvas text wrapping
  function fillWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  }

});
