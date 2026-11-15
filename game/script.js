const LEVELS = [
    { name: 'L1 First Samples', q: { ice: 1, soil: 1, rock: 1 }, time: 300, water: 60, food: 50, fuel: 60, pouches: 4, rocketFuel: 12, spread: 45 },
    { name: 'L2 Foothills', q: { ice: 1, soil: 2, rock: 1 }, time: 330, water: 70, food: 60, fuel: 70, pouches: 5, rocketFuel: 16, spread: 70 },
    { name: 'L3 Badlands', q: { ice: 2, soil: 2, rock: 2 }, time: 420, water: 80, food: 70, fuel: 80, pouches: 7, rocketFuel: 20, spread: 95 },
    { name: 'L4 Ridgeline', q: { ice: 2, soil: 3, rock: 3 }, time: 520, water: 90, food: 80, fuel: 90, pouches: 9, rocketFuel: 25, spread: 120 },
    { name: 'L5 Summit', q: { ice: 3, soil: 3, rock: 4 }, time: 640, water: 100, food: 90, fuel: 100, pouches: 11, rocketFuel: 30, spread: 140 }
];
(() => {
    const $ = id => document.getElementById(id), cl = (v, a, b) => Math.min(b, Math.max(a, v)), sm = t => t * t * (3 - 2 * t), smoother = t => { const x = cl(t, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); }, say = t => $('msg').textContent = t;
    const W = 420, SEG = 160, HALF = W / 2, CELL = W / SEG, R1 = SEG + 1, coarse = matchMedia('(pointer:coarse)').matches, V3 = THREE.Vector3;
    const rocketUp = new V3(0, 1, 0), uprightRocket = new THREE.Quaternion();
    // ---------- renderer, sky, light ----------
    const cv = $('c'), renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, 1, .5, 1400), FOG = 0xd9946a, surfaceFog = new THREE.FogExp2(FOG, .0038);
    scene.fog = surfaceFog;
    scene.background = new THREE.Color(FOG);
    const sg = new THREE.SphereGeometry(900, 24, 16), sp0 = sg.attributes.position, c1 = new THREE.Color(FOG), c2 = new THREE.Color(0x5f4560), scol = [];
    for (let i = 0; i < sp0.count; i++)
        scol.push(...c1.clone().lerp(c2, Math.pow(cl(sp0.getY(i) / 900, 0, 1), .55)).toArray());
    sg.setAttribute('color', new THREE.Float32BufferAttribute(scol, 3));
    const sky = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    scene.add(sky);
    const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(26, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1d0, fog: false }));
    scene.add(sunDisc);
    scene.add(new THREE.HemisphereLight(0xffd9b8, 0x6a3a28, .75));
    const sun = new THREE.DirectionalLight(0xfff0dd, 1.1), SUN = new V3(.5, .75, .35).normalize(), sc = sun.shadow.camera;
    sun.castShadow = true;
    sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
    sc.left = sc.bottom = -60;
    sc.right = sc.top = 60;
    sc.near = 1;
    sc.far = 500;
    sun.shadow.bias = -.0006;
    scene.add(sun, sun.target);
    function mkTex(f, s) { const c = document.createElement('canvas'); c.width = c.height = s; f(c.getContext('2d'), s); return new THREE.CanvasTexture(c); }
    const grain = mkTex((g, s) => {
        const d = g.createImageData(s, s); for (let i = 0; i < s * s; i++) {
            const v = 205 + Math.random() * 50;
            d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v;
            d.data[i * 4 + 3] = 255;
        } g.putImageData(d, 0, 0);
    }, 256);
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.repeat.set(70, 70);
    grain.anisotropy = 4;
    const puffT = mkTex((g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); }, 64);
    const label = t => {
        const c = document.createElement('canvas'), h = 128, measure = c.getContext('2d');
        measure.font = '700 44px system-ui, sans-serif';
        c.width = Math.ceil(measure.measureText(t).width) + 40;
        c.height = h;
        const g = c.getContext('2d'), w = c.width;
        g.fillStyle = 'rgba(20,12,10,.9)';
        g.fillRect(4, 14, w - 8, h - 28);
        g.strokeStyle = 'rgba(255,255,255,.8)';
        g.lineWidth = 2;
        g.strokeRect(4, 14, w - 8, h - 28);
        g.font = '700 44px system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.lineJoin = 'round';
        g.lineWidth = 7;
        g.strokeStyle = 'rgba(0,0,0,.9)';
        g.fillStyle = '#fff';
        g.strokeText(t, w / 2, h / 2);
        g.fillText(t, w / 2, h / 2);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(c),
            transparent: true,
            fog: false,
            depthWrite: false,
            depthTest: false
        }));
        sp.scale.set(5, 1.25, 1);
        return sp;
    };
    const pool = [];
    for (let i = 0; i < 100; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffT, transparent: true, depthWrite: false }));
        sp.visible = false;
        scene.add(sp);
        pool.push({ sp, l: 0, m: 1, v: new V3(), s: 1, o: .5 });
    }
    function puff(x, y, z, n, col, spd, life, size, up, op) {
        for (let k = 0; k < n; k++) {
            const q = pool.find(p => p.l <= 0);
            if (!q)
                return;
            q.l = q.m = life * (.7 + Math.random() * .6);
            q.s = size * (.7 + Math.random() * .6);
            q.o = op || .5;
            q.sp.material.color.set(col);
            q.sp.position.set(x + Math.random() - .5, y, z + Math.random() - .5);
            q.v.set((Math.random() - .5) * spd, (up || 0) + Math.random() * spd * .4, (Math.random() - .5) * spd);
            q.sp.visible = true;
        }
    }
    function tickPuffs(dt) {
        pool.forEach(q => {
            if (q.l <= 0)
                return; q.l -= dt; if (q.l <= 0) {
                    q.sp.visible = false;
                    return;
                } const k = q.l / q.m; q.sp.position.addScaledVector(q.v, dt); q.sp.scale.setScalar(q.s * (2.2 - k * 1.2)); q.sp.material.opacity = q.o * k;
        });
    }
    const ripple = mkTex((g, s) => {
        const d = g.createImageData(s, s); for (let y = 0; y < s; y++)
            for (let x = 0; x < s; x++) {
                const v = 128 + Math.sin((x + y * .35) * .12) * 40 + Math.sin((x * .3 - y) * .05) * 30 + (Math.random() - .5) * 36, o = (y * s + x) * 4;
                d.data[o] = d.data[o + 1] = d.data[o + 2] = v;
                d.data[o + 3] = 255;
            } g.putImageData(d, 0, 0);
    }, 256);
    ripple.wrapS = ripple.wrapT = THREE.RepeatWrapping;
    const glare = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffT, color: 0xffd9a0, blending: THREE.AdditiveBlending, transparent: true, opacity: .5, depthWrite: false, fog: false }));
    glare.scale.set(420, 420, 1);
    scene.add(glare);
    [[470, '#b9856c', .6], [570, '#a8715e', .9]].forEach(([r, c, hs]) => {
        for (let i = 0; i < 40; i++) {
            const a = i / 40 * 6.283 + r, h = (40 + Math.random() * 80) * hs * 1.4, m = new THREE.Mesh(new THREE.ConeGeometry(70 + Math.random() * 70, h, 5), new THREE.MeshBasicMaterial({ color: c, fog: false }));
            m.position.set(Math.cos(a) * (r + Math.random() * 40), h / 2 - 6, Math.sin(a) * (r + Math.random() * 40));
            scene.add(m);
        }
    });
    const dN = 260, dpos = new Float32Array(dN * 3).map(() => (Math.random() - .5) * 120), dgeo = new THREE.BufferGeometry();
    for (let i = 0; i < dN; i++)
        dpos[i * 3 + 1] *= .25;
    dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0xe8c4a0, size: .45, transparent: true, opacity: .45, depthWrite: false }));
    dust.frustumCulled = false;
    scene.add(dust);
    const starPositions = new Float32Array(900 * 3);
    for (let i = 0; i < starPositions.length; i += 3) {
        const a = Math.random() * Math.PI * 2, y = Math.random() * 2 - 1, r = Math.sqrt(1 - y * y) * 950;
        starPositions[i] = Math.cos(a) * r;
        starPositions[i + 1] = y * 950;
        starPositions[i + 2] = Math.sin(a) * r;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe6e9ff, size: 2, sizeAttenuation: false, transparent: true, opacity: .9, fog: false }));
    stars.visible = false;
    scene.add(stars);
    const TN = 600, trk = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x2a1208, transparent: true, opacity: .32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), TN), dmy = new THREE.Object3D();
    trk.frustumCulled = false;
    scene.add(trk);
    let trkI = 0;
    function clearTracks() {
        dmy.scale.set(0, 0, 0); dmy.updateMatrix(); for (let i = 0; i < TN; i++)
            trk.setMatrixAt(i, dmy.matrix); trk.instanceMatrix.needsUpdate = true;
    }
    clearTracks();
    function mark(x, z, psi, sx, sz) { dmy.position.set(x, hAt(x, z) + .08, z); dmy.rotation.set(-Math.PI / 2, psi, 0, 'YXZ'); dmy.scale.set(sx, sz, 1); dmy.updateMatrix(); trk.setMatrixAt(trkI, dmy.matrix); trkI = (trkI + 1) % TN; trk.instanceMatrix.needsUpdate = true; }
    // ---------- terrain ----------
    let seed = 1, CX, CZ, CR, BX, BZ, HB, RX, RZ, H = null, world = null, mini0 = null, obs = [];
    const hash = (x, y) => { let h = (x * 374761393 + y * 668265263 + seed) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const vn = (x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), tx = sm(x - x0), ty = sm(y - y0), a = hash(x0, y0), b = hash(x0 + 1, y0), c = hash(x0, y0 + 1), d = hash(x0 + 1, y0 + 1); return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty; };
    const fbm = (x, y) => vn(x, y) * .55 + vn(x * 2.1, y * 2.1) * .28 + vn(x * 4.3, y * 4.3) * .17;
    function raw(x, z) { const d = Math.hypot(x - CX, z - CZ), ins = 1 - sm(cl((d - CR * .6) / (CR * .5), 0, 1)), rough = .35 + .65 * (1 - ins); let h = (fbm(x / 70, z / 70) - .5) * 26 * rough + (fbm(x / 16, z / 16) - .5) * 3.2 * rough; h += 9 * Math.exp(-(((d - CR) / 20) ** 2)) * (.65 + .7 * vn(x / 30 + 7, z / 30)); h -= 10 * Math.pow(Math.max(0, 1 - (d / CR) ** 2), .8); return h; }
    function hf(x, z) { const h = raw(x, z), d = Math.hypot(x - BX, z - BZ); return HB + (h - HB) * sm(cl((d - 32) / 24, 0, 1)); }
    const iceF = (x, z) => cl(1 - Math.abs(Math.hypot(x - CX, z - CZ) - CR * .58) / (CR * .24), 0, 1) * cl((vn(x / 20 + 3, z / 20) - .42) * 8, 0, 1);
    function hAt(x, z) { x = cl(x, -HALF + .01, HALF - .01); z = cl(z, -HALF + .01, HALF - .01); const fx = (x + HALF) / CELL, fz = (z + HALF) / CELL, i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, a = H[j * R1 + i], b = H[j * R1 + i + 1], c = H[(j + 1) * R1 + i], d = H[(j + 1) * R1 + i + 1]; return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz; }
    const slopeMul = (x, z, psi) => { const e = 2, dx = (hAt(x + e, z) - hAt(x - e, z)) / (2 * e), dz = (hAt(x, z + e) - hAt(x, z - e)) / (2 * e), up = dx * Math.sin(psi) + dz * Math.cos(psi); return cl(1.1 - Math.hypot(dx, dz) - Math.max(0, up) * .6, .35, 1.05); };
    // ---------- models ----------
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .6 }, o || {}));
    const part = (p, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; };
    // ---------- upgraded models: reflections, rocks, rover, astronaut ----------
    let ENV = null;
    try {
        const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene(), gr = new THREE.Mesh(new THREE.CircleGeometry(900, 24), new THREE.MeshBasicMaterial({ color: 0x8a4a2e })), sd = new THREE.Mesh(new THREE.SphereGeometry(60, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff6e0 }));
        es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
        gr.rotation.x = -Math.PI / 2;
        gr.position.y = -2;
        sd.position.copy(SUN).multiplyScalar(800);
        es.add(gr, sd);
        ENV = pm.fromScene(es, .02, 1, 2000).texture;
        pm.dispose();
    }
    catch (e) {
        ENV = null;
    }
    const MX = (c, o) => {
        const m = M(c, o); if (ENV) {
            m.envMap = ENV;
            m.envMapIntensity = 1.15;
        } return m;
    };
    const mkTex2 = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return new THREE.CanvasTexture(c); };
    const cellTex = mkTex2(128, 128, (g, w, h) => {
        g.fillStyle = '#14306a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(180,210,255,.55)'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) {
            g.beginPath();
            g.moveTo(i * 16, 0);
            g.lineTo(i * 16, h);
            g.moveTo(0, i * 16);
            g.lineTo(w, i * 16);
            g.stroke();
        }
    });
    const decalTex = mkTex2(256, 64, (g, w, h) => { g.fillStyle = '#e0743c'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); g.fillStyle = '#2a2320'; g.font = 'bold 34px system-ui'; g.textAlign = 'center'; g.fillText('KOROLEV-1', w / 2, h / 2 + 12); });
    const rockTex = mkTex2(128, 128, (g, w, h) => {
        const d = g.createImageData(w, h); for (let i = 0; i < w * h; i++) {
            const v = 165 + Math.random() * 70;
            d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v;
            d.data[i * 4 + 3] = 255;
        } g.putImageData(d, 0, 0); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.2; for (let k = 0; k < 16; k++) {
            let x = Math.random() * w, y = Math.random() * h;
            g.beginPath();
            g.moveTo(x, y);
            for (let j = 0; j < 5; j++) {
                x += (Math.random() - .5) * 36;
                y += (Math.random() - .5) * 36;
                g.lineTo(x, y);
            }
            g.stroke();
        }
    });
    rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;
    rockTex.repeat.set(2, 1.5);
    const rockM = new THREE.MeshStandardMaterial({ vertexColors: true, map: rockTex, bumpMap: rockTex, bumpScale: 2.4, roughness: .95 });
    let ROCKG = [];
    function rockGeo(sv, rough) {
        const g = new THREE.SphereGeometry(1, 22, 16), p = g.attributes.position, cols = [], c1 = new THREE.Color('#9a6448'), c2 = new THREE.Color('#5a3a2e'), tc = new THREE.Color();
        for (let i = 0; i < p.count; i++) {
            const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = vn(x * 1.7 + z * 1.3 + sv, y * 1.7 - z * .9 + sv * 1.7), n2 = vn(x * 5 + sv, y * 5 + z * 3), d = 1 + (n - .5) * rough * 1.1 + (n2 - .5) * rough * .35 - .1 * Math.abs(Math.sin((x + z) * 4 + sv)), yy = y < 0 ? y * .5 : y;
            p.setXYZ(i, x * d, yy * d, z * d);
            tc.copy(c1).lerp(c2, cl(.5 + .5 * Math.sin(yy * d * 7 + sv + n * 3), 0, 1) * .7 + (n2 - .5) * .5);
            cols.push(tc.r, tc.g, tc.b);
        }
        g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        g.computeVertexNormals();
        return g;
    }
    function mkRover() {
        const g = new THREE.Group(), wh = [], B = THREE.BoxGeometry, Cy = THREE.CylinderGeometry, P = (geo, mat, x, y, z, p) => part(p || g, geo, mat, x, y, z);
        const body = MX('#e8e1d3', { roughness: .45, metalness: .25 }), belly = M('#2b2724', { roughness: .85 }), orange = MX('#e0743c', { roughness: .4, metalness: .2 }), alu = MX('#b8bcc4', { roughness: .35, metalness: .9 }), gold = MX('#d9a93a', { roughness: .3, metalness: .95 }), dark = M('#1b1715', { roughness: .9 }), suit = M('#f4f1ea', { roughness: .7 }), glass = new THREE.MeshStandardMaterial({ color: '#a8d4ff', transparent: true, opacity: .26, roughness: .05, metalness: .3, envMap: ENV || null }), panel = M('#ffffff', { map: cellTex, emissive: '#0a1a33', roughness: .3, metalness: .6 }), lens = M('#0a0a0c', { roughness: .1, metalness: .9, emissive: '#223a55', emissiveIntensity: .6 });
        P(new B(2.5, .45, 4.2), belly, 0, 1.12, 0);
        P(new B(2.7, .6, 4.4), body, 0, 1.62, 0);
        P(new B(2.55, .2, 4.25), body, 0, 2.02, 0);
        P(new B(2.4, .5, .9), orange, 0, 1.6, 2.45).rotation.x = .3;
        P(new B(2.9, .18, .3), dark, 0, .95, 2.5);
        [-1, 1].forEach(s => { const d = part(g, new THREE.PlaneGeometry(2.4, .6), new THREE.MeshStandardMaterial({ map: decalTex, transparent: true, roughness: .6 }), s * 1.37, 1.65, -.3); d.rotation.y = s * Math.PI / 2; d.castShadow = false; });
        [-.85, .85].forEach(x => [-.1, 1.5].forEach(z => P(new Cy(.05, .05, 1, 6), alu, x, 2.55, z)));
        P(new B(1.95, .07, 1.75), dark, 0, 3.05, .7);
        P(new B(1.8, .95, .05), glass, 0, 2.5, 1.62).rotation.x = -.45;
        [-1, 1].forEach(s => P(new B(.04, .8, 1.4), glass, s * .9, 2.55, .7));
        P(new B(.8, .45, .7), dark, 0, 2.2, .15);
        P(new B(.8, .7, .15), dark, 0, 2.5, -.2);
        P(new THREE.TorusGeometry(.2, .03, 6, 16), dark, 0, 2.35, 1).rotation.x = 1.1;
        const head = new THREE.Group();
        head.position.set(0, 2.55, .3);
        g.add(head);
        P(new B(.75, .45, .35), suit, 0, -.1, 0, head);
        P(new THREE.SphereGeometry(.3, 16, 12), suit, 0, .3, .05, head);
        P(new THREE.SphereGeometry(.24, 14, 10), gold, 0, .3, .2, head).scale.set(1, .8, .6);
        P(new B(.5, .5, .25), alu, 0, .05, -.28, head);
        P(new B(2.3, .3, 1.6), alu, 0, 2.2, -1.5);
        for (let i = 0; i < 4; i++)
            P(new Cy(.09, .09, .5, 8), i % 2 ? orange : alu, -.8 + i * .53, 2.55, -1.3);
        P(new B(3.5, .05, 2), alu, 0, 2.88, -1.55).rotation.x = -.18;
        P(new B(3.4, .06, 1.9), panel, 0, 2.92, -1.55).rotation.x = -.18;
        [-1.4, 1.4].forEach(x => P(new Cy(.05, .05, .7, 6), alu, x, 2.55, -1.4));
        P(new Cy(.3, .3, 1, 12), gold, 0, 1.7, -2.55).rotation.x = Math.PI / 2;
        for (let i = 0; i < 3; i++)
            P(new Cy(.34, .34, .05, 12), dark, 0, 1.7, -2.2 - i * .25).rotation.x = Math.PI / 2;
        const mast = new THREE.Group();
        mast.position.set(.9, 2.3, -.5);
        g.add(mast);
        P(new Cy(.1, .12, 1.3, 8), alu, 0, .65, 0, mast);
        P(new B(.55, .28, .3), body, 0, 1.4, 0, mast);
        [-.14, .14].forEach(x => P(new Cy(.09, .09, .12, 12), lens, x, 1.4, .2, mast).rotation.x = Math.PI / 2);
        P(new B(.12, .08, .1), orange, 0, 1.62, 0, mast);
        P(new Cy(.5, .12, .1, 6), alu, -.9, 3.55, -.9).rotation.x = .9;
        P(new Cy(.04, .04, .9, 6), alu, -.9, 3.1, -.9);
        P(new Cy(.02, .02, 1.6, 5), dark, 1.15, 3.4, -1.4);
        P(new THREE.SphereGeometry(.05, 6, 5), orange, 1.15, 4.2, -1.4);
        P(new Cy(.25, .25, .25, 12), alu, .7, 2.2, 2);
        P(new B(.14, .14, .9), alu, .7, 2.2, 2.55);
        P(new B(.12, .12, .7), body, .7, 2.05, 3.05).rotation.x = .25;
        P(new Cy(.2, .2, .3, 10), gold, .7, 1.9, 3.35).rotation.x = Math.PI / 2;
        [-1, 1].forEach(s => { P(new B(.35, .22, .2), dark, s * .9, 1.35, 2.75); P(new THREE.SphereGeometry(.12, 8, 6), M('#fff6b0', { emissive: '#fff0a0', emissiveIntensity: 1.4 }), s * .9, 1.35, 2.88); P(new Cy(.07, .07, .1, 10), lens, s * .45, 2, 2.1).rotation.x = Math.PI / 2; });
        const spot = new THREE.SpotLight(0xfff2d0, 0, 50, .5, .6);
        spot.position.set(0, 1.6, 2.6);
        spot.target.position.set(0, .2, 16);
        g.add(spot, spot.target);
        [-1, 1].forEach(s => {
            P(new B(.14, .14, 3.4), alu, s * 1.55, 1.15, 0);
            [-1.6, 0, 1.6].forEach(z => {
                P(new B(.1, .6, .1), alu, s * 1.55, .95, z);
                P(new B(.35, .12, .12), alu, s * 1.68, .8, z);
                const w = new THREE.Group();
                w.position.set(s * 1.85, .8, z);
                g.add(w);
                P(new Cy(.8, .8, .55, 24), dark, 0, 0, 0, w).rotation.z = Math.PI / 2;
                P(new Cy(.5, .5, .6, 5), alu, 0, 0, 0, w).rotation.z = Math.PI / 2;
                P(new Cy(.15, .15, .66, 8), gold, 0, 0, 0, w).rotation.z = Math.PI / 2;
                for (let k = 0; k < 9; k++) {
                    const a = k * Math.PI * 2 / 9, c = P(new B(.57, .12, .24), dark, 0, Math.cos(a) * .85, Math.sin(a) * .85, w);
                    c.rotation.x = a;
                    c.castShadow = false;
                }
                wh.push(w);
            });
        });
        g.userData = { wh, head, mast, spot };
        return g;
    }
    function mkAstro() {
        const g = new THREE.Group(), suit = MX('#f6f3ec', { roughness: .65, metalness: .05 }), grey = MX('#a3a8b0', { roughness: .45, metalness: .6 }), dark = M('#2a2a30', { roughness: .85 }), orange = M('#e0743c', { roughness: .6 }), gold = MX('#e0b040', { roughness: .1, metalness: 1, emissive: ENV ? '#000000' : '#3a2a08' }), B = THREE.BoxGeometry, Cy = THREE.CylinderGeometry, Sp = THREE.SphereGeometry, P = (geo, mat, x, y, z, p) => part(p || g, geo, mat, x, y, z), arms = [], elbows = [], legs = [], knees = [];
        const torso = new THREE.Group();
        torso.position.y = 1;
        g.add(torso);
        P(new Cy(.3, .28, .26, 14), suit, 0, .05, 0, torso);
        P(new Cy(.35, .31, .66, 16), suit, 0, .5, 0, torso);
        P(new Cy(.325, .325, .08, 16), orange, 0, .2, 0, torso);
        P(new B(.34, .3, .1), dark, 0, .55, .3, torso);
        P(new B(.22, .12, .03), M('#2aff7a', { emissive: '#2aff7a', emissiveIntensity: .9 }), 0, .6, .36, torso);
        P(new B(.08, .08, .04), orange, -.1, .45, .35, torso);
        [-1, 1].forEach(s => P(new B(.06, .7, .04), dark, s * .14, .55, .29, torso));
        P(new THREE.TorusGeometry(.2, .05, 8, 16), grey, 0, .88, 0, torso).rotation.x = Math.PI / 2;
        P(new B(.62, .74, .32), grey, 0, .52, -.42, torso);
        P(new B(.64, .08, .34), orange, 0, .3, -.42, torso);
        [-.2, 0, .2].forEach(x => P(new B(.1, .4, .02), dark, x, .55, -.59, torso));
        P(new Cy(.015, .015, .5, 5), dark, .22, 1.1, -.45, torso);
        P(new Sp(.03, 6, 5), orange, .22, 1.36, -.45, torso);
        [-.2, .2].forEach(x => P(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new V3(x, .75, -.3), new V3(x * 1.6, .7, -.05), new V3(x * 1.1, .55, .2)]), 10, .028, 6), dark, 0, 0, 0, torso));
        const hd = new THREE.Group();
        hd.position.set(0, 1.08, .03);
        torso.add(hd);
        P(new Sp(.3, 20, 14), suit, 0, 0, 0, hd);
        P(new Sp(.265, 18, 12), gold, 0, 0, .1, hd).scale.set(1, .82, .65);
        P(new THREE.TorusGeometry(.27, .03, 6, 18), grey, 0, -.22, 0, hd).rotation.x = Math.PI / 2;
        [-1, 1].forEach(s => { P(new Cy(.05, .05, .06, 8), dark, s * .3, 0, 0, hd).rotation.z = Math.PI / 2; P(new B(.07, .05, .07), M('#fff6b0', { emissive: '#fff0a0', emissiveIntensity: 1.2 }), s * .12, .3, .14, hd); });
        [-1, 1].forEach(s => {
            const sh = new THREE.Group();
            sh.position.set(s * .45, .76, 0);
            torso.add(sh);
            P(new Sp(.13, 12, 10), suit, 0, 0, 0, sh);
            P(new Cy(.1, .09, .42, 10), suit, 0, -.22, 0, sh);
            P(new Cy(.105, .105, .06, 10), orange, 0, -.33, 0, sh);
            const el = new THREE.Group();
            el.position.y = -.44;
            sh.add(el);
            P(new Sp(.095, 10, 8), grey, 0, 0, 0, el);
            P(new Cy(.09, .08, .38, 10), suit, 0, -.2, 0, el);
            P(new Sp(.095, 10, 8), dark, 0, -.42, 0, el);
            P(new B(.1, .1, .14), dark, 0, -.5, .02, el);
            arms.push(sh);
            elbows.push(el);
        });
        [-1, 1].forEach(s => {
            const hp = new THREE.Group();
            hp.position.set(s * .16, 1, 0);
            g.add(hp);
            P(new Sp(.14, 10, 8), grey, 0, 0, 0, hp);
            P(new Cy(.15, .12, .46, 10), suit, 0, -.25, 0, hp);
            const kn = new THREE.Group();
            kn.position.y = -.5;
            hp.add(kn);
            P(new Sp(.12, 10, 8), grey, 0, 0, 0, kn);
            P(new Cy(.12, .1, .4, 10), suit, 0, -.22, 0, kn);
            P(new Cy(.125, .125, .06, 10), orange, 0, -.3, 0, kn);
            P(new B(.2, .13, .34), dark, 0, -.44, .06, kn);
            P(new B(.22, .05, .36), orange, 0, -.5, .06, kn);
            legs.push(hp);
            knees.push(kn);
        });
        g.scale.setScalar(1.15);
        g.userData = { arms, elbows, legs, knees, torso };
        return g;
    }
    function animAstro(a, sp, smp, jumping) {
        const u = a.userData, w = Math.sin(t * 10) * sp, br = Math.sin(t * 2) * .008;
        if (jumping) {
            u.legs[0].rotation.x = .35;
            u.legs[1].rotation.x = -.35;
            u.knees[0].rotation.x = u.knees[1].rotation.x = .65;
            u.arms[0].rotation.x = u.arms[1].rotation.x = -.9;
            u.elbows[0].rotation.x = u.elbows[1].rotation.x = -.55;
            u.torso.rotation.x = -.08;
            u.torso.position.y = 1 + br;
            return;
        }
        u.legs[0].rotation.x = w * .9;
        u.legs[1].rotation.x = -w * .9;
        u.knees[0].rotation.x = Math.max(0, -w) * 1.1;
        u.knees[1].rotation.x = Math.max(0, w) * 1.1;
        if (smp) {
            u.arms.forEach((s, i) => { s.rotation.x = -1.05 + Math.sin(t * 12 + i * 3.1) * .28; u.elbows[i].rotation.x = -.55; });
            u.torso.rotation.x = .3;
            u.torso.position.y = 1 + br;
        }
        else {
            u.arms[0].rotation.x = -w * .8;
            u.arms[1].rotation.x = w * .8;
            u.elbows[0].rotation.x = u.elbows[1].rotation.x = -.25 - sp * .4;
            u.torso.rotation.x = sp * .05;
            u.torso.position.y = 1 + Math.abs(Math.sin(t * 10)) * .035 * sp + br;
        }
    }
    function mkItem(t) {
        const g = new THREE.Group();
        if (t === 'water') {
            part(g, new THREE.CylinderGeometry(.58, .58, 1.15, 14), M('#4aa3d9', { metalness: .3 }), 0, .62, 0);
            part(g, new THREE.CylinderGeometry(.25, .25, .25, 10), M('#d8f1ff'), 0, 1.32, 0);
        }
        else if (t === 'food') {
            part(g, new THREE.BoxGeometry(1.4, 1.1, 1.4), M('#8f9a4a'), 0, .6, 0);
            part(g, new THREE.BoxGeometry(.22, 1.12, 1.42), M('#f0d37a'), 0, .6, 0);
        }
        else if (t === 'fuel') {
            part(g, new THREE.BoxGeometry(.85, 1.1, .6), M('#c4452f'), 0, .6, 0);
            part(g, new THREE.CylinderGeometry(.15, .15, .2, 8), M('#ffd34d'), .21, 1.22, 0);
        }
        else {
            const b = part(g, new THREE.SphereGeometry(.66, 12, 10), M('#c9a06a', { roughness: .9 }), 0, .58, 0);
            b.scale.y = .8;
            part(g, new THREE.CylinderGeometry(.13, .25, .3, 8), M('#8a6a3f'), 0, 1.2, 0);
        }
        const lb = label(t === 'pouch' ? 'Pouches' : t[0].toUpperCase() + t.slice(1));
        lb.scale.set(3.5, 1, 1);
        lb.position.y = 3.4;
        g.add(lb);
        const bm = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 5, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        bm.position.y = 3.4;
        g.add(bm);
        return g;
    }
    function mkSite(t) {
        const g = new THREE.Group(), rnd = Math.random, c = { ice: '#8fe3ff', soil: '#ffd27a', rock: '#dfe6f0' }[t];
        if (t === 'ice') {
            const im = new THREE.MeshStandardMaterial({ color: '#bfe9f5', transparent: true, opacity: .85, roughness: .12, metalness: .1, emissive: '#3a7090', emissiveIntensity: .3 });
            for (let i = 0; i < 7; i++) {
                const s = .5 + rnd() * 1.1, m = part(g, new THREE.IcosahedronGeometry(1, 0), im, (rnd() - .5) * 5, .5, (rnd() - .5) * 5);
                m.scale.set(s, s * 1.5, s);
                m.rotation.set(rnd(), rnd() * 3, rnd());
            }
        }
        else if (t === 'rock') {
            const sl = part(g, ROCKG[1], rockM, 0, .4, 0);
            sl.scale.set(3.4, 1.4, 2.6);
            sl.rotation.y = rnd() * 6;
            for (let i = 0; i < 6; i++) {
                const q = .5 + rnd() * 1.3, m = part(g, ROCKG[i % 4], rockM, (rnd() - .5) * 6.5, q * .2, (rnd() - .5) * 6.5);
                m.scale.set(q, q * .8, q);
                m.rotation.y = rnd() * 6;
            }
        }
        else {
            const d = part(g, new THREE.CircleGeometry(3.4, 24), M('#5d321e', { roughness: 1 }), 0, .06, 0);
            d.rotation.x = -Math.PI / 2;
            d.castShadow = false;
            for (let i = 0; i < 5; i++) {
                const m = part(g, new THREE.SphereGeometry(1, 8, 6), M('#8b5a3a', { roughness: 1 }), (rnd() - .5) * 5, .1, (rnd() - .5) * 5);
                m.scale.set(.5 + rnd() * .8, .18, .4 + rnd() * .7);
            }
        }
        const mk = new THREE.Group(), ring = new THREE.Mesh(new THREE.TorusGeometry(2, .08, 6, 32), new THREE.MeshBasicMaterial({ color: c, fog: false }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = .4;
        mk.add(ring);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 16, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        beam.position.y = 8;
        mk.add(beam);
        const lb = label({ ice: 'ICE', soil: 'SOIL', rock: 'ROCK' }[t]);
        lb.position.y = 7;
        mk.add(lb);
        mk.visible = false;
        g.add(mk);
        const fl = new THREE.Group();
        part(fl, new THREE.CylinderGeometry(.04, .04, 2.4, 6), M('#ccd'), 0, 1.2, 0);
        part(fl, new THREE.BoxGeometry(.9, .55, .04), M('#e0743c'), .47, 2.1, 0);
        fl.visible = false;
        g.add(fl);
        g.userData = { mk, fl, ring };
        return g;
    }
    function mkSampleVial(type) {
        const colors = { ice: '#8fe3ff', soil: '#c89a70', rock: '#dfe6f0' }, vial = new THREE.Group();
        part(vial, new THREE.CylinderGeometry(.17, .17, .55, 12), M('#d8e2e8', { metalness: .65, roughness: .25 }), 0, .28, 0);
        part(vial, new THREE.CylinderGeometry(.19, .19, .1, 12), M(colors[type], { emissive: colors[type], emissiveIntensity: .3 }), 0, .31, 0);
        part(vial, new THREE.CylinderGeometry(.12, .12, .12, 10), M('#4a4a52', { metalness: .5 }), 0, .62, 0);
        return vial;
    }
    // ---------- world build ----------
    const LO = new THREE.Color('#5c2a1e'), MI = new THREE.Color('#b25a30'), HI = new THREE.Color('#dcae82'), ICE = new THREE.Color('#cfe9f5');
    let rk = null, rkBody = null, rocketRoot = null, flame = null, padLights = [], antLight = null, rm = null, am = null, roof = null, wallM = null, tool = null, relay = null, relayArm = null, relayElbow = null, relayGrip = null, relayClaws = [], flightCurve = null, flightReturnCurve = null, flightPath = null;
    let ventFans = [], growLights = [], sampleCargo = [], rocketCargo = [], transfer = null, flight = null;
    const slopeAt = (x, z) => Math.hypot(hAt(x + 2, z) - hAt(x - 2, z), hAt(x, z + 2) - hAt(x, z - 2)) / 4;
    function build() {
        if (world) {
            scene.remove(world);
            world.traverse(o => {
                if (o.geometry && !o.isSprite)
                    o.geometry.dispose();
            });
        }
        obs = [];
        ventFans = [];
        growLights = [];
        sampleCargo = [];
        rocketCargo = [];
        transfer = null;
        flight = null;
        scene.background = new THREE.Color(FOG);
        scene.fog = surfaceFog;
        sky.visible = true;
        stars.visible = false;
        world = new THREE.Group();
        scene.add(world);
        seed = Math.random() * 1e9 | 0;
        CX = (hash(1, 1) - .5) * 30;
        CZ = (hash(2, 2) - .5) * 30;
        CR = 78 + hash(3, 3) * 16;
        BX = CX + (hash(4, 4) - .5) * 16;
        BZ = CZ + (hash(5, 5) - .5) * 16;
        HB = raw(BX, BZ);
        RX = BX + 26;
        RZ = BZ + 8;
        const g = new THREE.PlaneGeometry(W, W, SEG, SEG);
        g.rotateX(-Math.PI / 2);
        const pa = g.attributes.position;
        H = new Float32Array(R1 * R1);
        for (let n = 0; n < pa.count; n++) {
            const x = pa.getX(n), z = pa.getZ(n), h = hf(x, z);
            pa.setY(n, h);
            H[Math.round((z + HALF) / CELL) * R1 + Math.round((x + HALF) / CELL)] = h;
        }
        g.computeVertexNormals();
        const nr = g.attributes.normal, col = new Float32Array(pa.count * 3), t = new THREE.Color();
        for (let n = 0; n < pa.count; n++) {
            const x = pa.getX(n), z = pa.getZ(n), k = cl((pa.getY(n) + 10) / 30, 0, 1);
            k < .5 ? t.copy(LO).lerp(MI, k * 2) : t.copy(MI).lerp(HI, (k - .5) * 2);
            t.multiplyScalar((.88 + .24 * vn(x / 7, z / 7)) * cl(1 - (1 - nr.getY(n)) * 1.8, .55, 1));
            t.lerp(ICE, iceF(x, z) * .85);
            col[n * 3] = t.r;
            col[n * 3 + 1] = t.g;
            col[n * 3 + 2] = t.b;
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const terr = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: grain, bumpMap: ripple, bumpScale: 1.2, roughness: 1 }));
        terr.receiveShadow = true;
        world.add(terr);
        mini0 = document.createElement('canvas');
        mini0.width = mini0.height = 120;
        const mc = mini0.getContext('2d'), id = mc.createImageData(120, 120);
        for (let j = 0; j < 120; j++)
            for (let i = 0; i < 120; i++) {
                const x = -HALF + (i + .5) / 120 * W, z = -HALF + (j + .5) / 120 * W, h = hAt(x, z), sh = cl(1 + (hAt(x - 4, z) - hAt(x + 4, z) + hAt(x, z - 4) - hAt(x, z + 4)) * .06, .55, 1.4), k = cl((h + 10) / 30, 0, 1), ic = iceF(x, z) * .85, o = (j * 120 + i) * 4;
                let r = 60 + k * 160, gc = 30 + k * 110, b = 24 + k * 90;
                r += (205 - r) * ic;
                gc += (232 - gc) * ic;
                b += (245 - b) * ic;
                id.data[o] = r * sh;
                id.data[o + 1] = gc * sh;
                id.data[o + 2] = b * sh;
                id.data[o + 3] = 255;
            }
        mc.putImageData(id, 0, 0);
        ROCKG = [rockGeo(1, 1), rockGeo(7, 1.3), rockGeo(13, .8), rockGeo(21, 1.6)];
        const cc = new THREE.Color(), dd = new THREE.Object3D(), far = () => {
            let x, z; do {
                x = (Math.random() - .5) * (W - 20);
                z = (Math.random() - .5) * (W - 20);
            } while (Math.hypot(x - BX, z - BZ) < 40); return [x, z];
        };
        ROCKG.forEach(rg => {
            const im = new THREE.InstancedMesh(rg, rockM, 60); for (let n = 0; n < 60; n++) {
                const [x, z] = far(), q = .6 + Math.pow(Math.random(), 3) * 3.2;
                dd.position.set(x, hAt(x, z) + q * .15, z);
                dd.rotation.set((Math.random() - .5) * .3, Math.random() * 6.3, (Math.random() - .5) * .3);
                dd.scale.set(q * (.8 + Math.random() * .5), q * (.6 + Math.random() * .4), q * (.8 + Math.random() * .5));
                dd.updateMatrix();
                im.setMatrixAt(n, dd.matrix);
                im.setColorAt(n, cc.setScalar(.75 + Math.random() * .4));
                if (q > 1.35)
                    obs.push({ x, z, r: q * 1.25 });
            } im.castShadow = im.receiveShadow = true; world.add(im);
        });
        const pb = new THREE.InstancedMesh(ROCKG[2], rockM, 400);
        for (let n = 0; n < 400; n++) {
            const [x, z] = far(), q = .12 + Math.random() * .3;
            dd.position.set(x, hAt(x, z) + q * .1, z);
            dd.rotation.set(0, Math.random() * 6.3, 0);
            dd.scale.set(q * 1.2, q * .7, q);
            dd.updateMatrix();
            pb.setMatrixAt(n, dd.matrix);
            pb.setColorAt(n, cc.setScalar(.7 + Math.random() * .5));
        }
        pb.receiveShadow = true;
        world.add(pb);
        // ----- the base: one walkable hall that holds every essential supply -----
        const B = new THREE.Group();
        B.position.set(BX, HB, BZ);
        world.add(B);
        padLights = [];
        const steel = M('#4a4a52', { metalness: .5, roughness: .5 }), glow = c => M(c, { emissive: c, emissiveIntensity: .9 }), panel = M('#1f3a66', { emissive: '#0a1a33', metalness: .5, roughness: .3 }), gl = M('#8fd2ff', { emissive: '#3a8fc0', emissiveIntensity: .6, roughness: .1, metalness: .5 }), HH = 4.2, wy = HH / 2;
        wallM = M('#d6cfc4', { roughness: .65, metalness: .2, transparent: true, opacity: .3, depthWrite: false });
        part(B, new THREE.BoxGeometry(31, .3, 21), steel, 0, -.13, 0);
        for (let i = -3; i <= 3; i++)
            part(B, new THREE.BoxGeometry(.18, .04, 19), glow('#4aa3d9'), i * 4.4, .04, 0);
        part(B, new THREE.BoxGeometry(.6, .04, 9), glow('#ffd34d'), 0, .05, 5.5);
        part(B, new THREE.BoxGeometry(31.4, HH, .6), wallM, 0, wy, -10.3);
        part(B, new THREE.BoxGeometry(.6, HH, 21), wallM, -15.5, wy, 0);
        part(B, new THREE.BoxGeometry(.6, HH, 21), wallM, 15.5, wy, 0);
        part(B, new THREE.BoxGeometry(12.5, HH, .6), wallM, -9.25, wy, 10.3);
        part(B, new THREE.BoxGeometry(12.5, HH, .6), wallM, 9.25, wy, 10.3);
        part(B, new THREE.BoxGeometry(6, 1.2, .6), wallM, 0, HH - .6, 10.3);
        [-5, 5].forEach(z => [-15.5, 15.5].forEach(x => part(B, new THREE.BoxGeometry(.66, 1.3, 5), gl, x, 2.8, z)));
        [-9, 0, 9].forEach(x => part(B, new THREE.BoxGeometry(5, 1.3, .66), gl, x, 2.8, -10.3));
        [-9.25, 9.25].forEach(x => part(B, new THREE.BoxGeometry(4, 1.3, .66), gl, x, 2.8, 10.3));
        [-3.15, 3.15].forEach(x => part(B, new THREE.BoxGeometry(.3, HH, .8), glow('#ff9a3c'), x, wy, 10.3));
        part(B, new THREE.BoxGeometry(5, 1.1, 1.6), steel, -11, .55, 5.5);
        [-12.4, -11, -9.6].forEach(x => part(B, new THREE.BoxGeometry(1.2, .8, .08), M('#0f2a1a', { emissive: '#2aff7a', emissiveIntensity: .8 }), x, 1.7, 5).rotation.x = -.3);
        part(B, new THREE.BoxGeometry(3.4, .6, 1.6), M('#5a6a7a'), 12.4, .5, 7.6);
        part(B, new THREE.BoxGeometry(.8, .2, 1.2), M('#f4f1ec'), 13.5, .9, 7.6);
        [-7, 7].forEach(x => { const lp = new THREE.PointLight(0xfff0dd, .9, 26); lp.position.set(x, 3.4, 0); B.add(lp); });
        roof = new THREE.Group();
        roof.position.y = HH;
        B.add(roof);
        const roofGlass = M('#bfb8ae', { roughness: .6, metalness: .3, transparent: true, opacity: .2, depthWrite: false });
        part(roof, new THREE.BoxGeometry(32.4, .5, 22.4), roofGlass, 0, .25, 0);
        part(roof, new THREE.BoxGeometry(8, .35, 3), roofGlass, 0, .1, 11.8);
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 2; j++)
                part(roof, new THREE.BoxGeometry(5.4, .1, 3.6), panel, -10.8 + i * 7.2, 1.3, -5.2 + j * 8.2).rotation.x = -.35;
        [-12, 11].forEach(x => part(roof, new THREE.BoxGeometry(2.8, 1.4, 2.2), steel, x, 1, 7.8));
        part(roof, new THREE.CylinderGeometry(.1, .1, 6, 6), M('#ccd'), 0, 3.4, 0);
        part(roof, new THREE.CylinderGeometry(1.5, .3, .3, 20), M('#f4f1ec'), 12, 2.6, -8).rotation.x = .9;
        antLight = part(roof, new THREE.SphereGeometry(.3, 8, 6), M('#ff4a3a', { emissive: '#ff2a1a', emissiveIntensity: 1 }), 0, 6.5, 0);
        [-6, -1, 4].forEach(z => { part(B, new THREE.CylinderGeometry(1.9, 1.9, 5.4, 20), M('#d8d2c6', { metalness: .3 }), 19.2, 2.7, z); part(B, new THREE.CylinderGeometry(1.95, 1.95, .4, 20), M('#c4452f'), 19.2, 4.2, z); });
        part(B, new THREE.BoxGeometry(.3, .3, 11), steel, 17.2, .8, -1);
        [[-23, -8], [-23, -1], [-23, 6], [-29, -8], [-29, -1], [-29, 6]].forEach(([x, z]) => { part(B, new THREE.BoxGeometry(.2, 1.6, .2), steel, x, .8, z); part(B, new THREE.BoxGeometry(5.4, .12, 3.2), panel, x, 1.8, z).rotation.x = -.5; });
        const tag = (parent, text, x, y, z, width) => {
            const sp = label(text);
            sp.scale.set((width || 6) * .65, 1, 1);
            sp.position.set(x, y, z);
            parent.add(sp);
            return sp;
        };
        // A compact bunk and three working life-support modules fit the one-person habitat.
        part(B, new THREE.BoxGeometry(3.4, .35, 1.5), M('#d8d2c6'), -12.1, .55, 1.2);
        part(B, new THREE.BoxGeometry(1.2, .25, 1.35), M('#e8e1d3'), -13.1, .85, 1.2);
        part(B, new THREE.BoxGeometry(.22, 1.4, .22), steel, -13.7, 1.25, 1.2);
        part(B, new THREE.BoxGeometry(1.1, 1.5, .15), M('#253d49', { emissive: '#173344' }), -10, 1.3, 1.1);
        const oxygenUnit = new THREE.Group();
        B.add(oxygenUnit);
        part(oxygenUnit, new THREE.BoxGeometry(2.5, 2.4, 1.6), steel, 0, 1.2, 0);
        part(oxygenUnit, new THREE.BoxGeometry(1.7, 1.1, .12), M('#263a3f', { emissive: '#1a6a67', emissiveIntensity: .35 }), 0, 1.45, .86);
        part(oxygenUnit, new THREE.CylinderGeometry(.42, .42, .35, 16), M('#8fd2ff', { metalness: .4 }), 0, 2.55, -.25);
        const airFan = part(oxygenUnit, new THREE.CylinderGeometry(.34, .34, .1, 12), steel, .78, 1.8, .86);
        airFan.rotation.x = Math.PI / 2;
        ventFans.push(airFan);
        tag(oxygenUnit, 'CO2 → O2 PROCESSOR', 0, 3.5, 0, 8);
        oxygenUnit.position.set(-7.8, 0, -.2);
        obs.push({ x0: BX - 9.2, x1: BX - 6.4, z0: BZ - 1.2, z1: BZ + .8 });
        const waterUnit = new THREE.Group();
        B.add(waterUnit);
        part(waterUnit, new THREE.BoxGeometry(2.7, 1.8, 1.5), steel, 0, .9, 0);
        part(waterUnit, new THREE.BoxGeometry(1.2, 1.3, .16), M('#23445b', { emissive: '#1c78a8', emissiveIntensity: .45 }), -.55, .9, .82);
        part(waterUnit, new THREE.CylinderGeometry(.58, .58, .18, 18), M('#bfe9f5', { metalness: .4 }), .62, 1.95, -.2);
        [-.36, -.12, .12, .36].forEach(z => part(waterUnit, new THREE.BoxGeometry(.12, 1.2, .08), M('#8fd2ff'), 1.48, 1.25, z));
        tag(waterUnit, 'AIR / HUMIDITY RECOVERY', 0, 2.8, 0, 9);
        waterUnit.position.set(12.3, 0, -3.5);
        obs.push({ x0: BX + 10.7, x1: BX + 13.9, z0: BZ - 4.7, z1: BZ - 2.3 });
        const farm = new THREE.Group();
        B.add(farm);
        part(farm, new THREE.BoxGeometry(4.5, .18, 2.8), steel, 0, .35, 0);
        for (let level = 0; level < 2; level++) {
            const y = .8 + level * .95;
            part(farm, new THREE.BoxGeometry(4, .12, 2.15), M('#4a4a52'), 0, y, 0);
            for (let row = 0; row < 3; row++) {
                const z = -0.75 + row * .75;
                for (let col = 0; col < 5; col++) {
                    const x = -1.5 + col * .75;
                    part(farm, new THREE.CylinderGeometry(.045, .07, .42, 6), M('#6e8d42'), x, y + .25, z);
                    const leaf = part(farm, new THREE.SphereGeometry(.15, 8, 6), M('#72a95b', { roughness: .8 }), x, y + .48, z);
                    leaf.scale.set(1.25, .6, .8);
                }
            }
            const light = part(farm, new THREE.BoxGeometry(3.8, .08, 2), M('#d9f4ff', { emissive: '#62caff', emissiveIntensity: 1.1 }), 0, y + .7, 0);
            growLights.push(light);
        }
        const dome = new THREE.Mesh(new THREE.SphereGeometry(2.9, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#bfe9f5', transparent: true, opacity: .16, roughness: .2, side: THREE.DoubleSide, metalness: .1 }));
        dome.position.y = .3;
        dome.castShadow = false;
        farm.add(dome);
        tag(farm, 'HYDROPONIC FOOD FARM', 0, 3.8, 0, 8);
        farm.position.set(8, 0, -.2);
        obs.push({ x0: BX + 5.4, x1: BX + 10.6, z0: BZ - 3.2, z1: BZ + 3 });
        // The solar field is outside the pressure hull and powers all three modules.
        [[-29, 14], [-23, 14], [-29, 21], [-23, 21]].forEach(([x, z]) => {
            part(B, new THREE.BoxGeometry(.18, 1.5, .18), steel, x, .75, z);
            const array = part(B, new THREE.BoxGeometry(5.4, .12, 3.2), panel, x, 1.55, z);
            array.rotation.x = -.48;
            array.rotation.z = .08;
            obs.push({ x0: BX + x - 2.8, x1: BX + x + 2.8, z0: BZ + z - 1.8, z1: BZ + z + 1.8 });
        });
        part(B, new THREE.BoxGeometry(2, 2, 1.5), steel, -17.5, 1, 17.5);
        tag(B, 'SOLAR POWER / STORAGE', -17.5, 3, 17.5, 7);
        obs.push({ x0: BX - 18.6, x1: BX - 16.4, z0: BZ + 16.6, z1: BZ + 18.4 });
        part(B, new THREE.CylinderGeometry(4.6, 4.6, .1, 32), M('#3a2a22', { roughness: 1 }), 0, .05, 17).castShadow = false;
        for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4;
            padLights.push(part(B, new THREE.SphereGeometry(.28, 8, 6), M('#ffd34d', { emissive: '#ffd34d', emissiveIntensity: 1 }), Math.cos(a) * 4.6, .3, 17 + Math.sin(a) * 4.6));
        }
        // ----- rocket on its own pad -----
        const RG = new THREE.Group();
        RG.position.set(RX, HB, RZ);
        rocketRoot = RG;
        part(world, new THREE.CylinderGeometry(4.5, 4.5, .12, 28), M('#3a2a22', { roughness: 1 }), RX, HB + .06, RZ);
        world.add(RG);
        rkBody = new THREE.Group();
        RG.add(rkBody);
        part(rkBody, new THREE.CylinderGeometry(1.2, 1.2, 7, 20), M('#f4f1ec', { roughness: .4 }), 0, 3.9, 0);
        part(rkBody, new THREE.ConeGeometry(1.2, 2.6, 20), M('#c4452f'), 0, 8.7, 0);
        part(rkBody, new THREE.CylinderGeometry(1.22, 1.22, .6, 20), M('#c4452f'), 0, 2.4, 0);
        part(rkBody, new THREE.SphereGeometry(.4, 10, 8), M('#8fd2ff', { emissive: '#4aa3d9', emissiveIntensity: .7 }), 0, 5.4, 1.1);
        part(rkBody, new THREE.CylinderGeometry(.5, .8, .7, 12), M('#555'), 0, .35, 0);
        const bayGlass = M('#8fd2ff', { transparent: true, opacity: .35, roughness: .12, metalness: .2, depthWrite: false });
        part(rkBody, new THREE.BoxGeometry(1.25, 1.8, 2.1), bayGlass, 1.45, 4.1, 0);
        const bayFrame = M('#d9a93a', { metalness: .75, roughness: .3 });
        [-1, 1].forEach(side => part(rkBody, new THREE.BoxGeometry(.12, 1.95, .12), bayFrame, 2.1, 4.1, side * 1.05));
        part(rkBody, new THREE.BoxGeometry(.12, .12, 2.2), bayFrame, 2.1, 5.05, 0);
        for (let i = 0; i < 3; i++) {
            const a = i * 2.094, f = part(rkBody, new THREE.BoxGeometry(.15, 2.4, 1.5), M('#c4452f'), Math.sin(a) * 1.5, 1.6, Math.cos(a) * 1.5);
            f.rotation.y = a;
        }
        flame = new THREE.Mesh(new THREE.ConeGeometry(.95, 5, 14), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, fog: false }));
        flame.rotation.x = Math.PI;
        flame.position.y = -2.2;
        flame.visible = false;
        rkBody.add(flame);
        rk = { progress: 0 };
        relay = new THREE.Group();
        part(relay, new THREE.CylinderGeometry(1.1, 1.1, 2.8, 16), M('#d8dbe0', { metalness: .55 }), 0, 0, 0);
        part(relay, new THREE.ConeGeometry(1.4, 1.3, 12), M('#aeb6c4'), 0, .1, 1.8);
        [-1, 1].forEach(side => {
            const wing = part(relay, new THREE.BoxGeometry(10, .12, 2.8), M('#23477c', { emissive: '#102248', metalness: .4 }), side * 6.1, 0, -.2);
            wing.rotation.y = side * -.08;
        });
        part(relay, new THREE.CylinderGeometry(.08, .08, 5, 8), M('#d8dbe0'), 0, 2.4, -.4);
        part(relay, new THREE.SphereGeometry(.4, 12, 8), M('#e8e1d3'), 0, 4.9, -.4);
        relayArm = new THREE.Group();
        relayArm.position.set(0, -1.3, 1.4);
        relay.add(relayArm);
        part(relayArm, new THREE.CylinderGeometry(.34, .42, 5, 10), M('#c8ccd4', { metalness: .65 }), 0, 0, 2.5).rotation.x = Math.PI / 2;
        relayElbow = new THREE.Group();
        relayElbow.position.set(0, 0, 5);
        relayArm.add(relayElbow);
        part(relayElbow, new THREE.CylinderGeometry(.25, .3, 4.2, 10), M('#aeb6c4', { metalness: .6 }), 0, 0, 2.1).rotation.x = Math.PI / 2;
        relayGrip = new THREE.Group();
        relayGrip.position.set(0, 0, 4.2);
        relayElbow.add(relayGrip);
        part(relayGrip, new THREE.BoxGeometry(.6, .35, .45), M('#d9a93a', { metalness: .65 }), 0, 0, 0);
        [-1, 1].forEach(side => {
            const claw = new THREE.Group();
            claw.position.x = side * .3;
            part(claw, new THREE.BoxGeometry(.12, .16, .9), M('#d8dbe0', { metalness: .65 }), 0, 0, .48);
            claw.rotation.y = side * -.24;
            relayGrip.add(claw);
            relayClaws.push(claw);
        });
        tag(relay, 'SUN-MARS L1 RELAY', 0, 7.3, 0, 7);
        relay.scale.setScalar(2.4);
        relay.position.set(RX + SUN.x * 240, HB + SUN.y * 240 + 32, RZ + SUN.z * 240);
        relay.visible = false;
        world.add(relay);
        const curveStart = new V3(RX, HB, RZ), curveEnd = relay.position.clone().add(new V3(0, 0, 31));
        const curveControl = curveStart.clone().lerp(curveEnd, .5).add(new V3(0, 100, 0));
        flightCurve = new THREE.QuadraticBezierCurve3(curveStart, curveControl, curveEnd);
        const returnControl1 = curveEnd.clone().lerp(curveStart, .08).add(new V3(0, 24, 0));
        const returnControl2 = curveStart.clone().lerp(curveEnd, .2).add(new V3(0, 72, 0));
        flightReturnCurve = new THREE.CubicBezierCurve3(curveEnd.clone(), returnControl1, returnControl2, curveStart.clone());
        flightPath = new THREE.Line(new THREE.BufferGeometry().setFromPoints(flightCurve.getPoints(48)), new THREE.LineDashedMaterial({ color: 0x8fd2ff, dashSize: 5, gapSize: 4, transparent: true, opacity: .7 }));
        flightPath.computeLineDistances();
        flightPath.visible = false;
        world.add(flightPath);
        rm = mkRover();
        am = mkAstro();
        world.add(rm, am);
        tool = new THREE.Group();
        part(tool, new THREE.CylinderGeometry(.06, .06, 1.6, 8), M('#9aa'), 0, .8, 0);
        part(tool, new THREE.ConeGeometry(.22, .6, 8), M('#c4452f'), 0, 0, 0).rotation.x = Math.PI;
        tool.visible = false;
        world.add(tool);
        const rc = (x0, x1, z0, z1) => ({ x0: BX + x0, x1: BX + x1, z0: BZ + z0, z1: BZ + z1 });
        obs.push({ x: RX, z: RZ, r: 2.4 }, rc(-15.8, 15.8, -10.6, -10), rc(-15.8, -15.2, -10.6, 10.6), rc(15.2, 15.8, -10.6, 10.6), rc(-15.8, -3, 10, 10.6), rc(3, 15.8, 10, 10.6));
    }
    // ---------- game state ----------
    let mission = null, pl = { inRover: 0 }, ro, as, items = [], sites = [], samp = null, keys = {}, t = 0, camOff = 0, camPitch = .42, zoom = 1, warned = 0, launching = 0, hudT = 0, drag = null, nextLevel = 0, scanCd = 0, trkAcc = 0, foot = 1, jumpHeight = 0, jumpVelocity = 0, unlocked = 1;
    try {
        unlocked = Math.min(5, Math.max(1, +localStorage.getItem('kc_unlocked') || 1));
    }
    catch (e) { }
    const look = new V3(), dest = new V3(), pulses = [], COL = { ice: '#8fe3ff', soil: '#ffd27a', rock: '#dfe6f0' }, inBase = E => Math.abs(E.x - BX) < 15 && Math.abs(E.z - BZ) < 10;
    function refreshLevels() { const s = $('levelSel'); s.innerHTML = ''; LEVELS.forEach((L, i) => { const o = document.createElement('option'); o.value = i; o.textContent = (i < unlocked ? '' : '🔒 ') + L.name; o.disabled = i >= unlocked; s.appendChild(o); }); s.value = Math.min(nextLevel, unlocked - 1); }
    function findSite(ty, spread) {
        for (let tr = 0; tr < 6000; tr++) {
            const a = Math.random() * 6.283;
            let r;
            if (ty === 'ice')
                r = CR * .34 + Math.random() * CR * .5;
            else if (ty === 'rock')
                r = CR * .75 + Math.random() * (CR * .45 + spread * .6);
            else
                r = CR + 18 + Math.random() * (spread + 25);
            const x = CX + Math.cos(a) * r, z = CZ + Math.sin(a) * r;
            if (Math.abs(x) > HALF - 16 || Math.abs(z) > HALF - 16 || Math.hypot(x - BX, z - BZ) < 42 || sites.some(s => Math.hypot(s.x - x, s.z - z) < 24))
                continue;
            const sl = slopeAt(x, z);
            if (ty === 'ice' && iceF(x, z) < .6)
                continue;
            if (ty === 'rock' && sl < .14 && tr < 4000)
                continue;
            if (ty === 'soil' && (sl > .1 || iceF(x, z) > .1))
                continue;
            return { x, z };
        }
        return null;
    }
    function startLevel(i) {
        i = Math.min(i, unlocked - 1);
        const L = LEVELS[i];
        build();
        clearTracks();
        $('end').style.display = 'none';
        samp = null;
        scanCd = 0;
        ro = { x: BX, z: BZ + 17, psi: 0, v: 0, pitch: 0, roll: 0, m: rm };
        as = { x: BX, z: BZ + 1.5, psi: 0, v: 0, m: am };
        pl.inRover = 0;
        jumpHeight = jumpVelocity = 0;
        items = [];
        sites = [];
        warned = 0;
        launching = 0;
        const stn = M('#4a4a52', { metalness: .5, roughness: .5 });
        [['water', L.water, -10, -6.5], ['food', L.food, -3.5, -6.5], ['fuel', L.fuel / 2, 3, -6.5], ['fuel', L.fuel / 2, 9.5, -6.5], ['pouch', L.pouches, 12, 1.5]].forEach(o => {
            const x = BX + o[2], z = BZ + o[3], g = mkItem(o[0]);
            g.position.set(x, HB + .92, z);
            world.add(g);
            part(world, new THREE.BoxGeometry(2.6, .9, 1.8), stn, x, HB + .45, z);
            obs.push({ x0: x - 1.3, x1: x + 1.3, z0: z - .9, z1: z + .9 });
            items.push({ t: o[0], v: o[1], x, z, g });
        });
        const spec = [];
        Object.keys(L.q).forEach(k => {
            for (let n = 0; n < L.q[k]; n++)
                spec.push(k);
        });
        spec.forEach(ty => {
            const p = findSite(ty, L.spread); if (!p)
                return;                 const g = mkSite(ty), solidRadius = ty === 'rock' ? 4.8 : ty === 'ice' ? 3.2 : 3.4;
                g.position.set(p.x, hAt(p.x, p.z), p.z); g.rotation.y = Math.random() * 6; world.add(g);
                obs.push({ x: p.x, z: p.z, r: solidRadius });
                sites.push({ t: ty, x: p.x, z: p.z, solidRadius, g, mk: g.userData.mk, fl: g.userData.fl, ring: g.userData.ring, state: 'new', cx: p.x + (Math.random() - .5) * 30, cz: p.z + (Math.random() - .5) * 30 });
        });
        const need = {};
        sites.forEach(s => need[s.t] = (need[s.t] || 0) + 1);
        mission = {
            level: i, timeLeft: L.time, water: 0, food: 0, oxygen: Math.ceil(L.time / 20) + 2, fuel: 0, pouches: 0, samples: 0,
            got: { ice: 0, soil: 0, rock: 0 }, need, phase: 'prep', running: 1, won: 0, lost: 0,
            support: { elapsed: 0, oxygen: 0, water: 0, food: 0, power: 0, generated: { oxygen: 0, water: 0, food: 0, power: 0 } }
        };
        nextLevel = i;
        camOff = 0;
        cam.position.set(as.x, hAt(as.x, as.z) + 5, as.z - 9);
        look.set(as.x, hAt(as.x, as.z) + 2, as.z);
        say('You are inside the base. Collect water, food, two fuel cells and sample pouches from the storage stations, then leave through the door and board the rover (F).');
        hud();
    }
    const end = (w, r) => {
        const m = mission;
        if (!m.running)
            return;
        m.running = 0;
        w ? m.won = 1 : m.lost = 1;
        if (w && m.level + 2 > unlocked) {
            unlocked = Math.min(5, m.level + 2);
            try {
                localStorage.setItem('kc_unlocked', String(unlocked));
            }
            catch (e) { }
        }
        $('endT').textContent = w ? 'Mission complete' : 'Mission failed';
        $('endD').textContent = w ? (m.level < 4 ? `Samples were transferred at the Sun-Mars L1 relay and the rocket returned safely. Level ${m.level + 2} is unlocked.` : 'Samples were transferred at the Sun-Mars L1 relay and the rocket returned safely. You finished all five levels!') : 'Reason: ' + r + '.';
        nextLevel = w ? Math.min(4, m.level + 1) : m.level;
        refreshLevels();
        $('endBtn').textContent = w && m.level < 4 ? 'Next level' : 'Play again';
        $('end').style.display = 'block';
    };
    function tgt() {
        const m = mission;
        if (!m || !m.running)
            return null;
        const E = pl.inRover ? ro : as, open = sites.filter(s => s.state !== 'done'), st = s => ({ x: s.x, z: s.z, ax: s.state === 'new' ? s.cx : s.x, az: s.state === 'new' ? s.cz : s.z, k: 'site', s });
        let c;
        if (!pl.inRover) {
            if (items.length)
                c = items.map(o => ({ x: o.x, z: o.z, k: 'item' }));
            else if (m.phase === 'prep')
                c = [{ x: ro.x, z: ro.z, k: 'rover' }];
            else {
                const near = open.filter(s => Math.hypot(s.x - E.x, s.z - E.z) < 16);
                c = near.length ? near.map(st) : [{ x: ro.x, z: ro.z, k: 'rover' }];
            }
        }
        else
            c = open.length ? open.map(st) : [{ x: BX, z: BZ, k: 'base' }];
        let b = null, bd = 1e9;
        c.forEach(o => {
            const d = Math.hypot(o.x - E.x, o.z - E.z); if (d < bd) {
                bd = d;
                b = o;
            }
        });
        if (b)
            b.d = bd;
        return b;
    }
    function pickItem(k) {
        const o = items.splice(k, 1)[0], m = mission; world.remove(o.g); if (o.t === 'water')
            m.water += o.v;
        else if (o.t === 'food')
            m.food += o.v;
        else if (o.t === 'fuel')
            m.fuel += o.v;
        else
            m.pouches += o.v; puff(o.x, HB + 1.5, o.z, 10, '#ffffff', 5, 1, 1.2, 3, .7); say(items.length ? `Picked up ${o.t}. ${items.length} supplies left in the base.` : 'All supplies loaded. Leave through the door and board the rover (F).'); hud();
    }
    function board() {
        const m = mission;
        if (!m || !m.running || launching)
            return;
        if (pl.inRover) {
            pl.inRover = 0;
            samp = null;
            as.x = ro.x + Math.cos(ro.psi) * 4.2;
            as.z = ro.z - Math.sin(ro.psi) * 4.2;
            as.psi = ro.psi;
            as.v = ro.v = 0;
            say('You are on foot. Walk up to a sample site and press E. Stand still until the bar fills.');
        }
        else {
            if (Math.hypot(as.x - ro.x, as.z - ro.z) > 6)
                return say('Walk closer to the rover first.');
            if (items.length)
                return say(`Collect all supplies from the base first (${items.length} left).`);
            pl.inRover = 1;
            as.v = 0;
            if (m.phase === 'prep') {
                m.phase = 'drive';
                say(`Mission clock started. Press Q to scan for sites, drive out of the crater and reserve ${LEVELS[m.level].rocketFuel * 2} fuel units for the rocket's outbound and return legs.`);
            }
            else
                say('Driving.');
        }
        hud();
    }
    function sampleStart() {
        const m = mission;
        if (!m || !m.running || launching || samp)
            return;
        if (pl.inRover)
            return say('Exit the rover first (F). Sampling is done on foot.');
        if (jumpHeight > 0 || jumpVelocity > 0)
            return say('Land before collecting a sample.');
        let s = null, bd = Infinity;
        sites.forEach(o => {
            if (o.state !== 'done') {
                const d = Math.hypot(o.x - as.x, o.z - as.z);
                if (d < 3.8 + o.solidRadius && d < bd) {
                    bd = d;
                    s = o;
                }
            }
        });
        if (!s)
            return say('No sample site within reach. Walk up to an ice, soil or rock site.');
        if (m.pouches <= 0)
            return end(0, 'out of sample pouches');
        samp = { s, t: 0, dur: { ice: 5, rock: 6, soil: 3 }[s.t] };
        say({ ice: 'Drilling an ice core', rock: 'Drilling a rock sample', soil: 'Scooping regolith' }[s.t] + '. Stay still.');
    }
    function sampleDone() {
        const s = samp.s, m = mission;
        samp = null;
        tool.visible = false;
        s.state = 'done';
        s.mk.visible = false;
        s.fl.visible = true;
        m.pouches--;
        m.got[s.t]++;
        m.samples++;
        const index = sampleCargo.length, vial = mkSampleVial(s.t);
        vial.position.set(-.9 + (index % 4) * .6, 3.12 + Math.floor(index / 4) * .4, -1.55);
        rm.add(vial);
        sampleCargo.push(vial);
        const mass = Math.round({ ice: 90, rock: 150, soil: 110 }[s.t] + Math.random() * 80);
        puff(s.x, hAt(s.x, s.z) + 1, s.z, 16, COL[s.t], 6, 1.2, 1.4, 3, .8);
        say(`Sealed ${s.t.toUpperCase()}-${m.got[s.t]}: ${mass} g in a labelled pouch (${m.pouches} pouches left).` + (m.samples >= sites.length ? ' All samples collected. Board the rover and park beside the launch pad.' : ''));
        hud();
    }
    function scan() {
        const m = mission;
        if (!m || !m.running || launching)
            return;
        if (m.phase === 'prep')
            return say('Board the rover first, then scan.');
        if (scanCd > 0)
            return say(`Scanner recharging (${Math.ceil(scanCd)} s).`);
        const E = pl.inRover ? ro : as;
        scanCd = 6;
        const r = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 48), new THREE.MeshBasicMaterial({ color: 0x8fe3ff, transparent: true, opacity: .8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        r.rotation.x = -Math.PI / 2;
        r.position.set(E.x, hAt(E.x, E.z) + .5, E.z);
        scene.add(r);
        pulses.push({ r, s: 1 });
        let n = 0;
        sites.forEach(s => {
            if (s.state === 'new' && Math.hypot(s.x - E.x, s.z - E.z) < 90) {
                s.state = 'confirmed';
                s.mk.visible = true;
                n++;
            }
        });
        say(n ? `Scan complete: ${n} site${n > 1 ? 's' : ''} confirmed and marked.` : 'Scan complete: nothing new within 90 m. Drive toward a dashed candidate circle on the map.');
    }
    function beginFlight() {
        transfer = null;
        flight = { stage: 'outbound', elapsed: 0, duration: 14, startOrientation: rocketRoot.quaternion.clone() };
        relay.visible = true;
        flightPath.visible = true;
        say('Payload secured in the cabin. Ascent begins; cruise is compressed for the Sun–Mars L1 rendezvous.');
    }
    function beginSatelliteTransfer() {
        relay.updateWorldMatrix(true, true);
        relayArm.rotation.y = 0;
        relayElbow.rotation.x = 0;
        relayClaws.forEach((claw, i) => { claw.rotation.y = i ? -.42 : .42; });
        const gripPosition = relayGrip.getWorldPosition(new V3());
        rkBody.updateWorldMatrix(true, false);
        const vials = rocketCargo.map((vial, i) => {
            const from = vial.getWorldPosition(new V3());
            rkBody.remove(vial);
            world.add(vial);
            vial.position.copy(from);
            return { vial, from, to: gripPosition.clone(), delay: i * .5, loaded: 0 };
        });
        transfer = { destination: 'satellite', elapsed: 0, vials, duration: vials.length ? (vials.length - 1) * .5 + 1.6 : 0 };
        if (!vials.length)
            beginReturnFlight();
        else
            say('L1 rendezvous stable. The satellite robotic arm is reaching for the sample canisters.');
    }
    function beginReturnFlight() {
        rocketCargo = [];
        transfer = null;
        flight = { stage: 'return', elapsed: 0, duration: 14, startOrientation: rocketRoot.quaternion.clone() };
        say('Sample canisters secured by the L1 relay. The rocket is returning to the Mars base.');
    }
    function animateTransfer(dt) {
        transfer.elapsed += dt;
        const destination = transfer.destination;
        transfer.vials.forEach((entry, i) => {
            const progress = cl((transfer.elapsed - entry.delay) / 1.35, 0, 1), eased = smoother(progress);
            if (progress <= 0)
                return;
            entry.vial.position.lerpVectors(entry.from, entry.to, eased);
            entry.vial.position.y += Math.sin(progress * Math.PI) * 4;
            if (destination === 'satellite') {
                relayArm.rotation.y = Math.sin(progress * Math.PI) * .06;
                relayElbow.rotation.x = Math.sin(progress * Math.PI) * .08;
                relayClaws.forEach((claw, j) => { claw.rotation.y = (j ? -.42 : .42) * (1 - eased); });
            }
            if (progress >= 1 && !entry.loaded) {
                entry.loaded = 1;
                world.remove(entry.vial);
                if (destination === 'satellite') {
                    relayGrip.add(entry.vial);
                    entry.vial.position.set(0, -.12 + i * .24, .45);
                }
                else {
                    rkBody.add(entry.vial);
                    entry.vial.position.set(1.48, 4.1, -.65 + i * .45);
                }
            }
        });
        if (transfer.elapsed >= transfer.duration) {
            transfer = null;
            if (destination === 'satellite')
                beginReturnFlight();
            else
                beginFlight();
        }
    }
    function launch() {
        const m = mission;
        if (!m || !m.running || launching)
            return;
        const L = LEVELS[m.level], E = pl.inRover ? ro : as;
        if (m.phase === 'prep')
            return say('Finish base prep first.');
        if (m.samples < sites.length)
            return say(`Need all ${sites.length} samples (have ${m.samples}).`);
        if (Math.hypot(E.x - BX, E.z - BZ) > 34)
            return say('Return to the shelter and launch pad first.');
        if (Math.hypot(ro.x - RX, ro.z - RZ) > 12)
            return say('Park the rover beside the rocket so the samples can be transferred.');
        const roundTripFuel = L.rocketFuel * 2;
        if (m.fuel < roundTripFuel)
            return end(0, 'not enough launch fuel');
        m.fuel -= roundTripFuel;
        launching = 1;
        rk.progress = 0;
        const now = new V3();
        rm.updateWorldMatrix(true, false);
        const vials = sampleCargo.map((vial, i) => {
            vial.getWorldPosition(now);
            const from = now.clone();
            rm.remove(vial);
            world.add(vial);
            vial.position.copy(from);
            return {
                    vial, from,
                    to: new V3(RX + 1.48, HB + 4.1, RZ - .65 + i * .45),
                    delay: i * .35,
                    loaded: 0
            };
        });
        sampleCargo = [];
        rocketCargo = vials.map(entry => entry.vial);
        transfer = { destination: 'rocket', elapsed: 0, vials, duration: vials.length ? (vials.length - 1) * .35 + 1.35 : 0 };
        if (!vials.length)
            beginFlight();
        say(vials.length ? `Transferring ${vials.length} sealed sample canisters from rover to rocket…` : 'Preparing the rocket for the L1 relay.');
        hud();
    }
    function blocked(x, z, radius) {
        for (const o of obs) {
            if (o.r) {
                    if (Math.hypot(x - o.x, z - o.z) < o.r + radius)
                        return true;
            }
            else {
                    const cx = cl(x, o.x0, o.x1), cz = cl(z, o.z0, o.z1);
                    if (Math.hypot(x - cx, z - cz) < radius)
                        return true;
            }
        }
        if (!pl.inRover && Math.hypot(x - ro.x, z - ro.z) < radius + 2.8)
            return true;
        return false;
    }
    function moveWithCollision(entity, dx, dz, radius) {
        const nx = cl(entity.x + dx, -HALF + 8, HALF - 8);
        if (!blocked(nx, entity.z, radius))
            entity.x = nx;
        const nz = cl(entity.z + dz, -HALF + 8, HALF - 8);
        if (!blocked(entity.x, nz, radius))
            entity.z = nz;
    }
    function poseRover(dt) { const r = ro, L = 2.2, Wd = 1.7, s = Math.sin(r.psi), c = Math.cos(r.psi), hF = hAt(r.x + s * L, r.z + c * L), hB = hAt(r.x - s * L, r.z - c * L), hL = hAt(r.x + c * Wd, r.z - s * Wd), hR = hAt(r.x - c * Wd, r.z + s * Wd), k = Math.min(1, dt * 8); r.pitch += (Math.atan2(hB - hF, 2 * L) - r.pitch) * k; r.roll += (Math.atan2(hL - hR, 2 * Wd) - r.roll) * k; r.m.position.set(r.x, (hF + hB + hL + hR) / 4 + .05, r.z); r.m.rotation.set(r.pitch, r.psi, r.roll, 'YXZ'); }
    function update(dt) {
        t += dt;
        const m = mission, running = m.running;
        scanCd = Math.max(0, scanCd - dt);
        updateSupport(dt);
        if (pl.inRover || !running || launching || samp) {
            jumpHeight = jumpVelocity = 0;
        }
        else if (jumpVelocity !== 0) {
            jumpHeight += jumpVelocity * dt;
            jumpVelocity -= 3.71 * dt;
            if (jumpHeight <= 0) {
                jumpHeight = jumpVelocity = 0;
            }
        }
        let f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0), tn = (keys.a || keys.arrowleft ? 1 : 0) - (keys.d || keys.arrowright ? 1 : 0);
        if (!running || launching)
            f = tn = 0;
        if (samp && (f || tn)) {
            samp = null;
            tool.visible = false;
            say('Sampling interrupted. Stay still beside the site until the bar fills.');
        }
        if (samp)
            f = tn = 0;
        const E = pl.inRover ? ro : as, sp = (pl.inRover ? 16 : 6.5) * (keys.shift ? 1.7 : 1) * slopeMul(E.x, E.z, E.psi), tv = f > 0 ? sp : f < 0 ? -sp * .5 : 0;
        E.psi += tn * (pl.inRover ? 1.7 : 2.8) * dt;
        E.v += (tv - E.v) * Math.min(1, dt * 4);
        moveWithCollision(E, Math.sin(E.psi) * E.v * dt, Math.cos(E.psi) * E.v * dt, pl.inRover ? 2.8 : .7);
        if (running && m.phase === 'drive' && !launching) {
            m.timeLeft -= dt;
            m.water = Math.max(0, m.water - dt * .1);
            m.food = Math.max(0, m.food - dt * .08);
            m.oxygen = Math.max(0, m.oxygen - dt * .05);
            if (pl.inRover && Math.abs(E.v) > .3) {
                m.fuel -= Math.abs(E.v) * dt * .03;
                if (m.fuel <= 0) {
                    m.fuel = 0;
                    end(0, 'out of fuel');
                }
                else if (m.fuel < LEVELS[m.level].rocketFuel * 2 && !warned) {
                    warned = 1;
                    say('Warning: fuel is below the launch reserve.');
                }
            }
            if (m.timeLeft <= 0)
                end(0, 'time up');
            else if (m.oxygen <= 0)
                end(0, 'out of oxygen');
            else if (m.water <= 0)
                end(0, 'out of water');
            else if (m.food <= 0)
                end(0, 'out of food');
        }
        if (running && !pl.inRover)
            for (let k = items.length - 1; k >= 0; k--)
                if (Math.hypot(as.x - items[k].x, as.z - items[k].z) < 2.8)
                    pickItem(k);
        if (samp) {
            const s = samp.s;
            samp.t += dt;
            as.psi = Math.atan2(s.x - as.x, s.z - as.z);
            tool.visible = true;
            tool.position.set(s.x, hAt(s.x, s.z) + .3 + Math.abs(Math.sin(t * 9)) * .25, s.z);
            tool.rotation.y = t * 8;
            if (Math.random() < .5)
                puff(s.x, hAt(s.x, s.z) + .4, s.z, 1, { ice: '#e8f6ff', soil: '#c89a70', rock: '#b58a6a' }[s.t], 3, 1, 1.2, 1.2, .5);
            if (samp.t >= samp.dur)
                sampleDone();
        }
        $('prog').style.display = samp ? 'block' : 'none';
        if (samp) {
            $('progB').style.width = Math.min(100, samp.t / samp.dur * 100) + '%';
            $('progT').textContent = (samp.s.t === 'ice' ? 'Drilling ice core' : samp.s.t === 'rock' ? 'Drilling rock' : 'Scooping soil') + '…';
        }
        poseRover(dt);
        rm.userData.head.visible = !!pl.inRover;
        rm.userData.spot.intensity = pl.inRover ? 1.4 : 0;
        rm.userData.mast.rotation.y = Math.sin(t * .6) * .7;
        rm.userData.wh.forEach(w => w.rotation.x += ro.v * dt / .8);
        am.visible = !pl.inRover;
        if (!pl.inRover) {
            am.position.set(as.x, hAt(as.x, as.z) + jumpHeight, as.z);
            am.rotation.y = as.psi;
            animAstro(am, Math.min(1, Math.abs(as.v) / 3), !!samp, jumpHeight > 0);
            if (Math.abs(as.v) > 2 && Math.random() < .3)
                puff(as.x, hAt(as.x, as.z) + .2, as.z, 1, '#c89a70', 1.5, .8, 1.4, .4, .3);
        }
        else if (Math.abs(ro.v) > 3 && Math.random() < .6)
            puff(ro.x - Math.sin(ro.psi) * 2.4, hAt(ro.x, ro.z) + .4, ro.z - Math.cos(ro.psi) * 2.4, 1, '#c89a70', 2, 1.2, 3, .5, .35);
        trkAcc += Math.abs(E.v) * dt;
        if (trkAcc > (pl.inRover ? 1.4 : .8) && (pl.inRover || jumpHeight === 0)) {
            trkAcc = 0;
            const s = Math.sin(E.psi), c = Math.cos(E.psi);
            if (pl.inRover)
                [-1.7, 1.7].forEach(o => mark(ro.x + c * o - s * 1.6, ro.z - s * o - c * 1.6, ro.psi, .55, 1.5));
            else {
                foot = -foot;
                mark(as.x + c * .25 * foot, as.z - s * .25 * foot, as.psi, .22, .42);
            }
        }
        sites.forEach(s => { s.ring.rotation.z = t; });
        ventFans.forEach(fan => fan.rotation.z += dt * 5);
        growLights.forEach((light, i) => light.material.emissiveIntensity = 1 + Math.sin(t * 2 + i) * .18);
        padLights.forEach((l, i) => l.material.emissiveIntensity = Math.sin(t * 3 - i) > 0 ? 1.2 : .12);
        antLight.material.emissiveIntensity = Math.sin(t * 5) > 0 ? 1.2 : .1;
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.s += dt * 70;
            p.r.scale.set(p.s, p.s, 1);
            p.r.material.opacity = .8 * Math.max(0, 1 - p.s / 90);
            if (p.s > 90) {
                scene.remove(p.r);
                pulses.splice(i, 1);
            }
        }
        if (launching) {
            if (transfer)
                animateTransfer(dt);
            else if (flight && !flight.complete) {
                flight.elapsed += dt;
                const p = cl(flight.elapsed / flight.duration, 0, 1), eased = smoother(p);
                const returning = flight.stage === 'return';
                rocketRoot.position.copy((returning ? flightReturnCurve : flightCurve).getPoint(eased));
                if (returning) {
                    rocketRoot.position.y = Math.max(rocketRoot.position.y, HB);
                    rocketRoot.quaternion.copy(flight.startOrientation).slerp(uprightRocket, smoother(p / .58));
                }
                else {
                    const targetOrientation = new THREE.Quaternion().setFromUnitVectors(rocketUp, flightCurve.getTangent(eased));
                    rocketRoot.quaternion.copy(flight.startOrientation).slerp(targetOrientation, smoother(p / .16));
                }
                rk.progress = p;
                const fade = (value, start, end) => sm(cl((value - start) / (end - start), 0, 1));
                const departureBurn = fade(p, 0, .08) * (1 - fade(p, .08, .3));
                const landingBurn = fade(p, .7, .86) * (1 - fade(p, .94, 1));
                const thrust = returning ? Math.max(departureBurn, landingBurn) : fade(p, 0, .08) * (1 - fade(p, .9, 1));
                flame.visible = thrust > .01;
                flame.material.opacity = .9 * thrust;
                flame.scale.set(1 + Math.sin(t * 40) * .08 * thrust, (1.1 + (1 - p) * 1.2) * thrust, 1);
                if (!returning && p > .12) {
                    scene.background = new THREE.Color(0x030711);
                    scene.fog = null;
                    sky.visible = false;
                    stars.visible = true;
                    dust.visible = false;
                }
                if (returning && p > .84) {
                    scene.background = new THREE.Color(FOG);
                    scene.fog = surfaceFog;
                    sky.visible = true;
                    stars.visible = false;
                    dust.visible = true;
                }
                if (p < .2 || returning && p > .82)
                    puff(rocketRoot.position.x, rocketRoot.position.y, rocketRoot.position.z, 3, '#fff0e0', 6, 1.5, 4, -.5, .5);
                if (p >= 1) {
                    flight.complete = 1;
                    if (returning) {
                        rocketRoot.position.set(RX, HB, RZ);
                        rocketRoot.quaternion.copy(uprightRocket);
                        flame.visible = false;
                        relay.visible = false;
                        flightPath.visible = false;
                        launching = 0;
                        say('Recovery complete. Samples are aboard the Sun-Mars L1 relay and the rocket is back on the Mars base pad.');
                        end(1);
                    }
                    else
                        beginSatelliteTransfer();
                }
            }
        }
        const ib = inBase(E);
        roof.visible = !ib;
        wallM.opacity += ((ib ? .18 : .3) - wallM.opacity) * Math.min(1, dt * 6);
        const cin = launching, tx = cin ? rocketRoot.position.x : E.x, tz = cin ? rocketRoot.position.z : E.z, ty = cin ? rocketRoot.position.y + 5 : hAt(E.x, E.z) + (pl.inRover ? 2.6 : 2.2);
        if (!drag && Math.abs(E.v) > .5)
            camOff *= Math.pow(.15, dt);
        const a = cin ? .8 : E.psi + camOff, dist = (cin ? 30 : pl.inRover ? 15 : 8.5) * zoom, cp = Math.cos(camPitch);
        dest.set(tx - Math.sin(a) * cp * dist, ty + Math.sin(camPitch) * dist, tz - Math.cos(a) * cp * dist);
        cam.position.lerp(dest, Math.min(1, dt * 7));
        if (!cin)
            cam.position.y = Math.max(cam.position.y, hAt(cam.position.x, cam.position.z) + 1.6);
        look.lerp(dest.set(tx, ty, tz), Math.min(1, dt * 10));
        cam.lookAt(look);
        sky.position.copy(cam.position);
        sunDisc.position.copy(cam.position).addScaledVector(SUN, 850);
        glare.position.copy(sunDisc.position);
        sun.position.set(tx + SUN.x * 200, ty + SUN.y * 200, tz + SUN.z * 200);
        sun.target.position.set(tx, ty, tz);
        const dp = dgeo.attributes.position.array;
        for (let i = 0; i < dN; i++) {
            dp[i * 3] += dt * 5;
            dp[i * 3 + 1] += Math.sin(t + i) * dt * .4;
            if (dp[i * 3] > 60)
                dp[i * 3] -= 120;
        }
        dgeo.attributes.position.needsUpdate = true;
        dust.position.copy(cam.position);
        const g = tgt();
        if (g) {
            const ax = g.ax !== undefined ? g.ax : g.x, az = g.az !== undefined ? g.az : g.z, df = Math.atan2(ax - E.x, az - E.z) - a;
            $('arrow').style.transform = `rotate(${-df}rad)`;
            $('dist').textContent = `${g.k === 'site' ? g.s.t + ' site' : g.k === 'item' ? 'supply' : g.k} ${Math.round(Math.hypot(ax - E.x, az - E.z))} m${g.k === 'site' && g.s.state === 'new' ? ' (approx.)' : ''}`;
        }
        else
            $('dist').textContent = '-';
        drawMini(E);
        hudT += dt;
        if (hudT > .1) {
            hudT = 0;
            hud();
        }
    }
    const mctx = $('mini').getContext('2d');
    function drawMini(E) {
        const g = mctx, P = (x, z) => [(x + HALF) / W * 120, (z + HALF) / W * 120], dot = (x, z, c, r) => { const [p, q] = P(x, z); g.fillStyle = c; g.beginPath(); g.arc(p, q, r, 0, 7); g.fill(); };
        g.drawImage(mini0, 0, 0);
        const [bx, bz] = P(BX, BZ);
        g.fillStyle = '#4a8cff';
        g.fillRect(bx - 4.5, bz - 3, 9, 6);
        sites.forEach(s => {
            if (s.state === 'new') {
                const [p, q] = P(s.cx, s.cz);
                g.strokeStyle = COL[s.t];
                g.lineWidth = 1.2;
                g.setLineDash([2, 2]);
                g.beginPath();
                g.arc(p, q, 5, 0, 7);
                g.stroke();
                g.setLineDash([]);
            }
            else
                dot(s.x, s.z, s.state === 'done' ? '#777' : COL[s.t], s.state === 'done' ? 2 : 3);
        });
        dot(RX, RZ, '#e05a4a', 2.5);
        const [p, q] = P(E.x, E.z);
        g.save();
        g.translate(p, q);
        g.rotate(Math.PI - E.psi);
        g.fillStyle = '#ffd34d';
        g.strokeStyle = '#000';
        g.beginPath();
        g.moveTo(0, -6);
        g.lineTo(4, 4);
        g.lineTo(-4, 4);
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
    }
    function updateSupport(dt) {
        const m = mission;
        if (!m || !m.running || launching)
            return;
        const s = m.support;
        s.elapsed += dt;
        while (s.elapsed >= 20) {
            s.elapsed -= 20;
            s.power = Math.min(120, s.power + 8);
            s.generated.power += 8;
            if (s.power >= 6) {
                s.power -= 6;
                s.oxygen = Math.min(30, s.oxygen + 1);
                s.water = Math.min(30, s.water + 1);
                s.food = Math.min(30, s.food + 1);
                s.generated.oxygen++;
                s.generated.water++;
                s.generated.food++;
            }
        }
    }
    function hud() {
        const m = mission, L = LEVELS[m.level];
        $('hTime').textContent = Math.ceil(m.timeLeft) + 's';
        $('hSamples').textContent = `${m.samples}/${sites.length}`;
        $('hWater').textContent = Math.round(m.water);
        $('hFood').textContent = Math.round(m.food);
        $('hOxygen').textContent = Math.round(m.oxygen);
        $('hFuel').textContent = `${Math.round(m.fuel)}/${L.rocketFuel * 2}`;
        $('hPouch').textContent = m.pouches;
        $('quota').innerHTML = ['ice', 'soil', 'rock'].filter(k => m.need[k]).map(k => `<span style="--c:${COL[k]}">${k[0].toUpperCase() + k.slice(1)} ${m.got[k]}/${m.need[k]}</span>`).join('');
        const s = m.support;
        $('supportReadout').innerHTML = `<span>O₂ store <b>${s.oxygen} (+${s.generated.oxygen})</b></span><span>H₂O <b>${s.water} (+${s.generated.water})</b></span><span>Food <b>${s.food} (+${s.generated.food})</b></span><span>Power <b>${s.power} kWh</b></span>`;
        $('supportCycle').textContent = `20 s cycle: +1 O₂, +1 H₂O, +1 food; +8 kWh solar • next in ${Math.ceil(20 - s.elapsed)} s`;
    }
    // ---------- input ----------
    addEventListener('keydown', e => {
        const k = e.key.toLowerCase(); keys[k] = 1;
        if (e.code === 'Space' && !e.repeat && mission && mission.running && !pl.inRover && !samp && !launching && jumpHeight === 0)
            jumpVelocity = 3.6;
        if (k === 'e')
            sampleStart();
        else if (k === 'q')
            scan();
        else if (k === 'f')
            board();
        else if (k === 'c')
            launch(); if (k.startsWith('arrow') || e.code === 'Space')
            e.preventDefault();
    });
    addEventListener('keyup', e => keys[e.key.toLowerCase()] = 0);
    document.querySelectorAll('[data-k]').forEach(b => { const k = b.dataset.k; b.addEventListener('pointerdown', e => { e.preventDefault(); keys[k] = 1; b.classList.add('on'); });['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, () => { keys[k] = 0; b.classList.remove('on'); })); });
    cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointerup', () => drag = null);
    cv.addEventListener('pointercancel', () => drag = null);
    cv.addEventListener('pointermove', e => {
        if (!drag)
            return; camOff -= (e.clientX - drag[0]) * .006; camPitch = cl(camPitch + (e.clientY - drag[1]) * .004, .1, 1.2); drag = [e.clientX, e.clientY];
    });
    cv.addEventListener('wheel', e => { e.preventDefault(); zoom = cl(zoom * (1 + e.deltaY * .001), .5, 2.5); }, { passive: false });
    $('bE').onclick = sampleStart;
    $('bQ').onclick = scan;
    $('bV').onclick = board;
    $('bR').onclick = launch;
    $('resetBtn').onclick = () => {
        unlocked = 1; try {
            localStorage.removeItem('kc_unlocked');
        }
            catch (e) { } nextLevel = 0; refreshLevels(); startLevel(0); $('menu').classList.remove('open');
    };
    $('menuBtn').onclick = () => $('menu').classList.toggle('open');
    $('startBtn').onclick = () => { startLevel(+$('levelSel').value); $('menu').classList.remove('open'); };
    $('endBtn').onclick = () => { $('levelSel').value = nextLevel; startLevel(nextLevel); };
    function resize() { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
    addEventListener('resize', resize);
    resize();
    let last = performance.now();
    function loop(now) { requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); tickPuffs(dt); renderer.render(scene, cam); }
    refreshLevels();
    startLevel(0);
    requestAnimationFrame(loop);
})();
