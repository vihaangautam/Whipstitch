import * as THREE from 'three';

export function initHeroAnimation(targetElementOrId = 'hero-anim') {
  const container = typeof targetElementOrId === 'string'
    ? document.getElementById(targetElementOrId)
    : targetElementOrId;

  if (!container) return;

  // Clear existing content
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.height = '480px';
  container.style.borderRadius = '8px';
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#0F0F0D';
  container.style.border = '1px solid rgba(255,255,255,0.08)';
  container.style.fontFamily = "'Hanken Grotesk', system-ui, -apple-system, sans-serif";
  container.style.boxSizing = 'border-box';

  // Inject CSS Keyframes & Styles matching Hanken Grotesk platform font stack
  const styleId = 'hero-anim-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      @keyframes pulseDot {
        0%, 100% { opacity: 0.4; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      .hero-card-left {
        opacity: 0;
        transform: translateX(-16px);
        transition: opacity 0.4s ease, transform 0.4s ease;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 10px 14px;
        font-family: 'Hanken Grotesk', system-ui, sans-serif;
      }
      .hero-card-left.visible {
        opacity: 1;
        transform: translateX(0);
      }
      .hero-card-right {
        opacity: 0;
        transform: translateX(16px);
        transition: opacity 0.4s ease, transform 0.4s ease;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 10px 14px;
        font-family: 'Hanken Grotesk', system-ui, sans-serif;
      }
      .hero-card-right.visible {
        opacity: 1;
        transform: translateX(0);
      }
      .font-mono-tag {
        font-family: 'JetBrains Mono', monospace;
      }
      @media (max-width: 768px) {
        #hero-anim { height: 360px !important; }
        .hero-left-panel, .hero-right-panel { width: 45% !important; }
      }
    `;
    document.head.appendChild(styleEl);
  }

  // 1. Top Chrome Bar (32px)
  const topBar = document.createElement('div');
  topBar.style.cssText = `
    height: 32px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 20;
    box-sizing: border-box;
  `;
  topBar.innerHTML = `
    <div style="display:flex; align-items:center; gap:6px;">
      <span style="width:10px; height:10px; border-radius:50%; background:#FF5F57; display:inline-block;"></span>
      <span style="width:10px; height:10px; border-radius:50%; background:#FEBC2E; display:inline-block;"></span>
      <span style="width:10px; height:10px; border-radius:50%; background:#28C840; display:inline-block;"></span>
    </div>
    <div class="font-mono-tag" style="font-size:11px; letter-spacing:0.1em; color:rgba(255,255,255,0.6); font-weight:600;">
      WHIPSTITCH LEAD ORCHESTRATION PIPELINE
    </div>
    <div class="font-mono-tag" style="display:flex; align-items:center; gap:6px; font-size:11px; letter-spacing:0.05em; color:#6EE547;">
      <span style="width:6px; height:6px; border-radius:50%; background:#6EE547; display:inline-block; box-shadow:0 0 8px #6EE547; animation: pulseDot 2s infinite;"></span>
      <span>AUTOMATED WORKFLOW ACTIVE</span>
    </div>
  `;
  container.appendChild(topBar);

  // 2. Left Panel HTML Overlay (RAW DATA INPUTS)
  const leftPanel = document.createElement('div');
  leftPanel.className = 'hero-left-panel';
  leftPanel.style.cssText = `
    position: absolute;
    left: 0;
    top: 32px;
    bottom: 36px;
    width: 32%;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 10;
    pointer-events: auto;
    box-sizing: border-box;
  `;
  leftPanel.innerHTML = `
    <div class="font-mono-tag" style="font-size:10px; letter-spacing:0.1em; color:rgba(255,255,255,0.4); text-transform:uppercase; display:flex; align-items:center; gap:6px; margin-bottom:2px;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/></svg>
      <span>RAW DATA INPUTS</span>
    </div>

    <!-- Card 1 -->
    <div id="left-card-1" class="hero-card-left" style="border-left: 2px solid rgba(161,59,43,0.6);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:11px; color:rgba(255,255,255,0.9); font-weight:700;">EMAIL</span>
        <span class="font-mono-tag" style="font-size:10px; color:rgba(255,255,255,0.3);">Just Now</span>
      </div>
      <div class="font-mono-tag" style="font-size:11px; color:rgba(255,255,255,0.55); margin-top:4px;">FROM: sarah@techcorp.com</div>
      <div class="font-mono-tag" style="font-size:11px; color:rgba(255,255,255,0.55);">SUBJ: Enterprise Inquiry</div>
    </div>

    <!-- Card 2 -->
    <div id="left-card-2" class="hero-card-left" style="border-left: 2px solid #A13B2B; box-shadow: 0 0 0 1px rgba(161,59,43,0.4);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:11px; color:rgba(255,255,255,0.9); font-weight:700;">DOMAIN</span>
        <span class="font-mono-tag" style="font-size:10px; color:rgba(255,255,255,0.3);">2s ago</span>
      </div>
      <div class="font-mono-tag" style="font-size:11px; color:rgba(255,255,255,0.55); margin-top:4px;">FROM: finscale.io</div>
      <div class="font-mono-tag" style="font-size:11px; color:rgba(255,255,255,0.55);">SUBJ: Traffic Rank: High</div>
    </div>

    <!-- Card 3 -->
    <div id="left-card-3" class="hero-card-left" style="border-left: 2px solid rgba(255,255,255,0.1);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:11px; color:rgba(255,255,255,0.9); font-weight:700;">CRM DATA</span>
        <span class="font-mono-tag" style="font-size:10px; color:rgba(255,255,255,0.3);">5s ago</span>
      </div>
      <div class="font-mono-tag" style="font-size:11px; color:rgba(255,255,255,0.55); margin-top:4px;">FROM: Form: Web-Inbound</div>
      <div class="font-mono-tag" style="font-size:11px; color:rgba(255,255,255,0.55);">SUBJ: Demo Request</div>
    </div>
  `;
  container.appendChild(leftPanel);

  // 3. Right Panel HTML Overlay (AUTOMATED OUTPUTS)
  const rightPanel = document.createElement('div');
  rightPanel.className = 'hero-right-panel';
  rightPanel.style.cssText = `
    position: absolute;
    right: 0;
    top: 32px;
    bottom: 36px;
    width: 34%;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 10;
    pointer-events: auto;
    box-sizing: border-box;
  `;
  rightPanel.innerHTML = `
    <div class="font-mono-tag" style="font-size:10px; letter-spacing:0.1em; color:rgba(255,255,255,0.4); text-transform:uppercase; display:flex; align-items:center; gap:6px; margin-bottom:2px;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      <span>AUTOMATED OUTPUTS</span>
    </div>

    <!-- Card 1 -->
    <div id="right-card-1" class="hero-card-right">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:20px; height:20px; border-radius:50%; background:#2B3A54; color:white; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center;">M</div>
          <span style="font-size:12px; font-weight:700; color:rgba(255,255,255,0.95);">Marcus Vance</span>
        </div>
        <span class="font-mono-tag" style="background:#A13B2B; color:white; font-size:9px; font-weight:700; padding:2px 6px; border-radius:3px;">QUALIFIED LEAD</span>
      </div>
      <div style="font-size:11px; color:rgba(255,255,255,0.65);">VP Engineering, FinScale</div>
      <div class="font-mono-tag" style="font-size:10px; color:rgba(255,255,255,0.5);">$22M ARR</div>
      <div style="font-size:11px; color:#6EE547; margin-top:3px; font-weight:600;">✓ Synced to HubSpot</div>
    </div>

    <!-- Card 2 (Monochrome SVG Icon — No Colored Emojis) -->
    <div id="right-card-2" class="hero-card-right" style="background: rgba(43,58,84,0.2);">
      <div style="display:flex; align-items:center; gap:6px; font-size:10px; font-weight:700; color:rgba(255,255,255,0.85); margin-bottom:3px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6EE547" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="font-mono-tag">SLACK NOTIFICATION (#sales-leads)</span>
      </div>
      <div style="font-size:11px; color:rgba(255,255,255,0.75); display:flex; align-items:center; gap:4px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6EE547" stroke-width="2" style="shrink:0;"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <span>Intent Trigger: FinScale hiring SDR team → Lead staged</span>
      </div>
    </div>

    <!-- Card 3 -->
    <div id="right-card-3" class="hero-card-right">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
        <span class="font-mono-tag" style="font-size:9px; font-weight:700; color:rgba(255,255,255,0.6);">AI-DRAFTED OUTREACH</span>
        <span class="font-mono-tag" style="font-size:9px; font-weight:700; color:#6EE547;">Ready to Send</span>
      </div>
      <div style="font-size:11px; font-weight:700; color:rgba(255,255,255,0.95);">RE: FinScale Scale Up — 2-Min Demo</div>
      <div style="font-size:10px; color:rgba(255,255,255,0.45); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
        Hi Marcus, thank you for your interest in Ente…
      </div>
    </div>
  `;
  container.appendChild(rightPanel);

  // 4. Three.js Canvas Mount Area
  const canvasContainer = document.createElement('div');
  canvasContainer.id = 'three-canvas-container';
  canvasContainer.style.cssText = `
    position: absolute;
    left: 0;
    top: 32px;
    width: 100%;
    bottom: 36px;
    z-index: 1;
  `;
  container.appendChild(canvasContainer);

  // 5. Bottom Status Bar (36px)
  const bottomBar = document.createElement('div');
  bottomBar.style.cssText = `
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 36px;
    background: rgba(255, 255, 255, 0.03);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    font-size: 11px;
    z-index: 20;
    box-sizing: border-box;
  `;
  bottomBar.innerHTML = `
    <div class="font-mono-tag" style="color:rgba(255,255,255,0.55); display:flex; align-items:center; gap:8px;">
      <span style="color:#6EE547; animation: pulseDot 2s infinite;">•</span>
      <span>Speed-to-Lead: &lt; 5s</span>
      <span style="color:rgba(255,255,255,0.2);">•</span>
      <span>Zero CRM Duplicates</span>
    </div>
    <div class="font-mono-tag" style="color:rgba(255,255,255,0.35); font-size:10px;">
      Click any left input card to inspect live routing payload
    </div>
  `;
  container.appendChild(bottomBar);

  // ═══════════════════════════════════════════════════════════════
  // THREE.JS SCENE SETUP
  // ═══════════════════════════════════════════════════════════════

  const width = canvasContainer.clientWidth || container.clientWidth || 800;
  const height = canvasContainer.clientHeight || 412;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  canvasContainer.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xA13B2B, 1.2, 20);
  pointLight.position.set(3, 3, 3);
  scene.add(pointLight);

  // Cube Group
  const cubeGroup = new THREE.Group();

  // 1. Primary Wireframe Cube (2 x 2 x 2)
  const boxGeo = new THREE.BoxGeometry(2, 2, 2);
  const edgesGeo = new THREE.EdgesGeometry(boxGeo);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xA13B2B, linewidth: 1 });
  const mainCube = new THREE.LineSegments(edgesGeo, lineMat);
  cubeGroup.add(mainCube);

  // 2. Inner Glow Cube (2.08 x 2.08 x 2.08)
  const glowGeo = new THREE.BoxGeometry(2.08, 2.08, 2.08);
  const glowEdges = new THREE.EdgesGeometry(glowGeo);
  const glowMat = new THREE.LineBasicMaterial({ color: 0xA13B2B, transparent: true, opacity: 0.15 });
  const glowCube = new THREE.LineSegments(glowEdges, glowMat);
  cubeGroup.add(glowCube);

  scene.add(cubeGroup);

  // Floating Labels Function (Three.js Sprite with Hanken Grotesk Texture)
  function createFloatingSprite({ text, bgColor, borderColor, textColor, font }) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    ctx.font = font || '600 22px "Hanken Grotesk", system-ui, sans-serif';
    const textWidth = ctx.measureText(text).width;

    const rectWidth = textWidth + 36;
    const rectHeight = 52;
    const x = (canvas.width - rectWidth) / 2;
    const y = (canvas.height - rectHeight) / 2;
    const radius = 6;

    // Background Pill
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, rectWidth, rectHeight, radius);
    ctx.fill();

    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Text
    ctx.fillStyle = textColor || '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.8, 0.7, 1);
    return { sprite, spriteMat };
  }

  // Label Data
  const labelConfigs = [
    {
      text: 'ENRICHING: 180 Employees',
      pos: [-0.6, 1.4, 0],
      bgColor: 'rgba(161,59,43,0.85)',
      textColor: '#FFFFFF',
      offset: 0,
      t: 800,
    },
    {
      text: 'ROUTING: @alex.wang',
      pos: [0.4, 0, 1.2],
      bgColor: 'rgba(15,15,13,0.9)',
      borderColor: 'rgba(161,59,43,0.6)',
      textColor: '#FFFFFF',
      offset: 2,
      t: 1600,
    },
    {
      text: 'SCORING: 88/100',
      pos: [-0.4, -1.4, 0],
      bgColor: 'rgba(110,229,71,0.15)',
      borderColor: 'rgba(110,229,71,0.5)',
      textColor: '#6EE547',
      offset: 4,
      t: 2400,
    },
  ];

  const floatingItems = labelConfigs.map((cfg) => {
    const { sprite, spriteMat } = createFloatingSprite({
      text: cfg.text,
      bgColor: cfg.bgColor,
      borderColor: cfg.borderColor,
      textColor: cfg.textColor,
    });
    sprite.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    scene.add(sprite);
    return {
      sprite,
      spriteMat,
      baseY: cfg.pos[1],
      offset: cfg.offset,
      targetOpacity: 1,
      t: cfg.t,
    };
  });

  // Staggered Timed Entry Trigger
  setTimeout(() => document.getElementById('left-card-1')?.classList.add('visible'), 400);
  setTimeout(() => document.getElementById('left-card-2')?.classList.add('visible'), 1200);
  setTimeout(() => document.getElementById('left-card-3')?.classList.add('visible'), 2000);

  floatingItems.forEach((item) => {
    setTimeout(() => {
      let opacity = 0;
      const fadeId = setInterval(() => {
        opacity += 0.05;
        item.spriteMat.opacity = opacity;
        if (opacity >= 1) {
          item.spriteMat.opacity = 1;
          clearInterval(fadeId);
        }
      }, 30);
    }, item.t);
  });

  setTimeout(() => document.getElementById('right-card-1')?.classList.add('visible'), 2800);
  setTimeout(() => document.getElementById('right-card-2')?.classList.add('visible'), 3400);
  setTimeout(() => document.getElementById('right-card-3')?.classList.add('visible'), 4000);

  // Animation Loop
  let animFrameId;
  function animateLoop() {
    animFrameId = requestAnimationFrame(animateLoop);

    cubeGroup.rotation.y += 0.004;
    cubeGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.18;

    floatingItems.forEach((item) => {
      if (item.spriteMat.opacity > 0) {
        item.sprite.position.y = item.baseY + Math.sin(Date.now() * 0.001 + item.offset) * 0.04;
      }
    });

    renderer.render(scene, camera);
  }
  animateLoop();

  function handleResize() {
    if (!canvasContainer || !renderer) return;
    const w = canvasContainer.clientWidth || container.clientWidth || 800;
    const h = canvasContainer.clientHeight || 412;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', handleResize);

  return () => {
    cancelAnimationFrame(animFrameId);
    window.removeEventListener('resize', handleResize);
    if (renderer && renderer.domElement) {
      renderer.domElement.remove();
    }
  };
}
