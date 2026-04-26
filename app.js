/**
 * The Blue Platform - Core Logic
 * High-performance, reactive-style Vanilla JS application
 */

// --- Integração Real: Supabase ---
(() => {
    const supabaseUrl = 'https://kggukwkireimgexsezek.supabase.co';
    const supabaseKey = 'sb_publishable_d9lFOKzv88k2Hv9roRdvZQ_X7K9xKAq';
    let supabase = null;

    if (window.supabase && supabaseUrl.startsWith('http')) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }

    // --- Configuração Evolution API (WhatsApp) ---
    const WA_CONFIG = {
        enabled: true,
        baseUrl: 'https://dimmer-grass-alright.ngrok-free.dev', // <--- COLE A URL DO NGROK AQUI
        instance: 'MeuBot',
        apiKey: '47b2030633301eea8876d1d08cdb6ef23b49a171770f240b25ec0be1be53d77d',
        adminNumber: '551934585300'
    };

    const sendWhatsApp = async (number, message) => {
        if (!WA_CONFIG.enabled || WA_CONFIG.apiKey === 'SUA_API_KEY_AQUI') return;

        const cleanNumber = number.replace(/\D/g, '');
        const targetNumber = cleanNumber.length <= 11 ? '55' + cleanNumber : cleanNumber;

        // Limpa barra final da URL se existir para evitar erro de // na requisição
        const base = WA_CONFIG.baseUrl.replace(/\/$/, '');

        try {
            const response = await fetch(`${base}/message/sendText/${WA_CONFIG.instance}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': WA_CONFIG.apiKey,
                    'ngrok-skip-browser-warning': 'true' // Cabeçalho essencial para ngrok gratuito
                },
                body: JSON.stringify({
                    number: targetNumber,
                    textMessage: { text: message },
                    options: { delay: 1200, presence: "composing" }
                })
            });

            const data = await response.json();
            console.log(`📱 Resposta Evolution API para ${targetNumber}:`, data);
        } catch (e) {
            console.error("❌ Erro ao enviar WhatsApp:", e);
        }
    };

    window.showPromoSplash = () => {
        console.log("🚀 Executando showPromoSplash...");
        // Remove se já existir para evitar duplicatas nos testes
        const existing = document.getElementById('promo-splash');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'promo-splash-overlay';
        overlay.id = 'promo-splash';

        overlay.innerHTML = `
            <div class="promo-card">
                <div class="promo-badge">PROMOÇÃO DE LANÇAMENTO</div>
                <h2 style="color: white; margin-bottom: 5px;">SUPER BÔNUS</h2>
                <div class="promo-prize">R$ 500,00</div>
                <p class="promo-desc">
                    Quem permanecer com pelo menos <strong>R$ 2.000,00</strong> investidos por <strong>2 meses consecutivos</strong> vai ganhar um prêmio de <strong>R$ 500,00</strong> direto no saldo!
                </p>
                <button class="promo-btn" onclick="document.getElementById('promo-splash').remove()">
                    VAMOS GANHAR! 🚀
                </button>
                <p style="margin-top: 20px; font-size: 0.7rem; opacity: 0.5; color: white;">
                    Válido para todos os planos ativos.
                </p>
            </div>
        `;

        document.body.appendChild(overlay);
        
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    };

    // --- Global Application State ---
    const State = {
        user: null, // Initially null
        currentView: 'auth', // 'auth', 'dashboard', 'investments', 'wallet', 'referral', 'admin'
        plans: [],
        investments: [],
        transactions: [],
        referrals: { level1: [], level2: [], level3: [] },
        currentPix: null,
        fortune_session: { accumulated: 0, spinsLeft: 0, isSpinning: false }
    };

    // --- View Router & Rendering ---
    const Router = {
        navigate(view) {
            if (view === 'admin') {
                const cleanPhone = State.user && State.user.phone ? State.user.phone.replace(/\D/g, '') : '';
                if (cleanPhone !== '19999995149' && cleanPhone !== '1934585300') {
                    alert('🔒 Área Restrita. Apenas administradores autorizados têm acesso a esta tela.');
                    return;
                }
            }
            State.currentView = view;
            this.render();
            window.scrollTo(0, 0);
        },

        render() {
            const app = document.getElementById('app');
            const nav = document.getElementById('bottom-nav');

            // Logic to show/hide navigation
            if (State.user && State.currentView !== 'auth') {
                nav.style.display = 'flex';
            } else {
                nav.style.display = 'none';
            }

            // Render matching view
            switch (State.currentView) {
                case 'auth':
                    app.innerHTML = Router.views.auth();
                    Router.initAuthListeners();
                    break;
                case 'dashboard':
                    app.innerHTML = Router.views.dashboard();
                    
                    // Mostrar Splash Promocional apenas uma vez por sessão
                    if (!sessionStorage.getItem('promo_shown')) {
                        setTimeout(() => {
                            if (typeof window.showPromoSplash === 'function') {
                                window.showPromoSplash();
                                sessionStorage.setItem('promo_shown', 'true');
                            }
                        }, 800);
                    }
                    break;
                case 'investments':
                    app.innerHTML = Router.views.investments();
                    break;
                case 'wallet':
                    app.innerHTML = Router.views.wallet();
                    break;
                case 'referral':
                    app.innerHTML = Router.views.referral();
                    break;
                case 'admin':
                    app.innerHTML = Router.views.admin();
                    if (window.loadAdminStats) window.loadAdminStats();
                    if (window.loadAdminData) window.loadAdminData();
                    break;
                case 'pix_checkout':
                    app.innerHTML = Router.views.pixCheckout();
                    break;
                case 'fortune_wheel':
                    app.innerHTML = Router.views.fortune_wheel();
                    break;
                case 'profile':
                    app.innerHTML = Router.views.profile();
                    break;
                default:
                    app.innerHTML = '<h1>404 Not Found</h1>';
            }
        },

        views: {
            auth: () => `
            <div class="app-container animate-fade">
                <div class="auth-header" style="text-align: center; padding: 0 0 10px 0;">
                    <div class="mascot-container">
                        <div class="mascot-shape"></div>
                    </div>
                    <h1 style="color: var(--primary-blue); font-size: 2.5rem; margin-top: 5px;">The Blue</h1>
                    <p style="font-size: 0.85rem;">O Azul que transforma seu futuro.</p>
                </div>
                
                <div id="auth-form" class="glass-card">
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <button class="btn btn-outline" style="flex: 1; border-color: var(--primary-blue);" onclick="toggleAuth(true)">Cadastrar</button>
                        <button class="btn btn-outline" style="flex: 1;" onclick="toggleAuth(false)">Entrar</button>
                    </div>

                    <div id="register-fields">
                        <label style="display: block; margin-bottom: 2px; font-size: 0.8rem; color: var(--text-dim);">Código de Convite (Opcional)</label>
                        <input type="text" placeholder="Código de Convite" class="input-field" id="sponsor" value="${localStorage.getItem('theblue_ref') || ''}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 10px;">

                        <label style="display: block; margin-bottom: 2px; font-size: 0.8rem; color: var(--text-dim);">Telefone</label>
                        <input type="text" placeholder="(00) 00000-0000" class="input-field" id="phone" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 10px;">
                        
                        <label style="display: block; margin-bottom: 2px; font-size: 0.8rem; color: var(--text-dim);">Senha de Acesso</label>
                        <input type="password" placeholder="••••••••" class="input-field" id="password" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 10px;">
                        
                        <label style="display: block; margin-bottom: 2px; font-size: 0.8rem; color: var(--text-dim);">Senha de Saque</label>
                        <input type="password" placeholder="••••••••" class="input-field" id="withdraw_password" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                        
                        <button class="btn btn-primary" style="width: 100%; padding: 14px;" onclick="handleRegister()">Criar Conta Grátis</button>
                    </div>

                    <div id="login-fields" style="display: none;">
                        <label style="display: block; margin-bottom: 2px; font-size: 0.8rem; color: var(--text-dim);">Telefone</label>
                        <input type="text" placeholder="(00) 00000-0000" class="input-field" id="login-phone" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                        
                        <label style="display: block; margin-bottom: 2px; font-size: 0.8rem; color: var(--text-dim);">Senha</label>
                        <input type="password" placeholder="••••••••" class="input-field" id="login-password" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                        
                        <button class="btn btn-secondary" style="width: 100%; padding: 14px;" onclick="handleLogin()">Acessar Plataforma</button>
                    </div>
                </div>
            </div>
        `,

            dashboard: () => `
            <div class="app-container animate-fade">
                <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div>
                        <p style="margin-bottom: 2px;">Olá, <span style="color: white; font-weight: 600;">${State.user.phone}</span></p>
                        <h2 style="font-size: 1.2rem;">Bem-vindo ao Azul!</h2>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div id="checkin-btn-container">
                            ${(() => {
                    let isLocked = false;
                    if (State.user && State.user.last_checkin) {
                        const last = new Date(State.user.last_checkin);
                        const now = new Date();
                        isLocked = (now - last < 24 * 60 * 60 * 1000);
                    }

                    return `
                                <button class="btn ${isLocked ? 'btn-outline' : 'btn-secondary'}" 
                                        style="font-size: 0.73rem; padding: 10px 14px; border-radius: 20px; ${isLocked ? 'opacity: 0.5; cursor: not-allowed;' : 'box-shadow: 0 0 20px var(--secondary-orange)50;'}"
                                        onclick="${isLocked ? "alert('Você já fez o check-in! Volte amanhã.')" : 'handleDailyCheckin()'}">
                                    <i class="fa-solid fa-calendar-check"></i> ${isLocked ? 'Feito' : 'Check-in'}
                                </button>
                                `;
                })()}
                        </div>
                        <div style="background: var(--glass-bg); padding: 8px; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; position: relative; border: 1px solid var(--glass-border);">
                             <i class="fa-solid fa-user-ninja" style="color: var(--primary-blue); font-size: 1.2rem;"></i>
                             <div style="position: absolute; top: -5px; right: -5px; background: var(--secondary-orange); color: white; font-size: 0.65rem; padding: 2px 7px; border-radius: 12px; font-weight: 800; border: 2px solid var(--primary-deep); box-shadow: 0 0 10px var(--secondary-orange)40;">
                                ${State.user.points || 0}
                             </div>
                        </div>
                    </div>
                </header>

                <!-- Points Progress -->
                <div class="glass-card" style="margin-bottom: 20px; padding: 15px; border-left: 4px solid var(--secondary-orange);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 0.8rem; font-weight: 600;">Progresso de Recompensa</span>
                        <span style="font-size: 0.8rem; color: var(--secondary-orange); font-weight: 700;">${State.user.points || 0}/${State.user.checkin_target || 7}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
                        <div style="width: ${Math.min(((State.user.points || 0) / (State.user.checkin_target || 7)) * 100, 100)}%; height: 100%; background: linear-gradient(to right, var(--secondary-orange), #FFB74D); border-radius: 4px; transition: width 1s ease-in-out;"></div>
                    </div>
                    ${(State.user.points || 0) >= (State.user.checkin_target || 7) ? `
                        <button class="btn btn-primary" style="width: 100%; font-size: 0.8rem; background: linear-gradient(45deg, #4CAF50, #2E7D32); border: none; animation: animate-pulse-gold 2s infinite;" onclick="handleExchangePoints()">
                            🎁 RESGATAR R$ ${(State.user.checkin_target || 7).toFixed(2)} AGORA
                        </button>
                    ` : `
                        <p style="font-size: 0.65rem; opacity: 0.7; text-align: center;">Complete ${State.user.checkin_target || 7} dias para ganhar R$ ${(State.user.checkin_target || 7).toFixed(2)} no saldo!</p>
                    `}
                </div>

                <!-- Balance Cards Carousel-style -->
                <div class="glass-card" style="background: linear-gradient(135deg, var(--primary-blue), #003399); border: none; margin-bottom: 20px;">
                    <p style="color: rgba(255,255,255,0.7); font-size: 0.85rem;">Saldo Total Estimado</p>
                    <h1 style="font-size: 2.8rem; margin: 10px 0; -webkit-text-fill-color: white;">R$ ${State.user.balance.toFixed(2)}</h1>
                    <div style="display: flex; gap: 15px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                        <div>
                            <p style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">Disponível</p>
                            <p style="font-weight: 600;">R$ ${State.user.available.toFixed(2)}</p>
                        </div>
                        <div style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 15px;">
                            <p style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">Investido</p>
                            <p style="font-weight: 600;">R$ ${State.user.invested.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 30px;">
                    <button class="glass-card" onclick="Router.navigate('wallet'); setTimeout(() => switchWalletTab('dep'), 50);" style="padding: 12px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-plus-circle" style="color: var(--secondary-orange); font-size: 1.1rem;"></i>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #ffffff;">Depositar</span>
                    </button>
                    <button class="glass-card" onclick="Router.navigate('wallet'); setTimeout(() => switchWalletTab('trans'), 50);" style="padding: 12px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fa-solid fa-paper-plane" style="color: #00D1FF; font-size: 1.1rem;"></i>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #ffffff;">Transferir</span>
                    </button>
                    <button class="glass-card" onclick="Router.navigate('investments')" style="padding: 12px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fa-solid fa-bolt" style="color: #4CAF50; font-size: 1.1rem;"></i>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #ffffff;">Investir</span>
                    </button>
                    <button class="glass-card" onclick="Router.navigate('wallet'); setTimeout(() => switchWalletTab('with'), 50);" style="padding: 12px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fa-solid fa-wallet" style="color: #FF5252; font-size: 1.1rem;"></i>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #ffffff;">Saque</span>
                    </button>
                </div>

                <!-- Earning Stats -->
                <div class="glass-card" style="margin-bottom: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>Ganhos de Hoje</h3>
                        <span style="color: #4CAF50; font-weight: 600;">+ R$ ${(State.user.invested * 0.02).toFixed(2)}</span>
                    </div>
                    <div style="height: 60px; display: flex; align-items: flex-end; gap: 8px;">
                        ${[20, 60, 40, 80, 50, 100, 90].map(h => `<div style="flex: 1; background: var(--primary-blue); height: ${h}%; border-radius: 4px 4px 0 0; opacity: ${h / 100};"></div>`).join('')}
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px;">Histórico Recente</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${State.transactions.length === 0 ? '<p style="text-align: center; padding: 20px; opacity: 0.5;">Nenhuma transação ainda.</p>' : ''}
                        ${State.transactions.slice(0, 3).map(tr => `
                            <div class="glass-card" style="display: flex; align-items: center; gap: 15px; padding: 12px;">
                                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                                    <i class="fa-solid ${tr.type === 'dep' || tr.type === 'pix_pendente' ? 'fa-arrow-down' : 'fa-arrow-up'}" style="color: ${tr.type === 'dep' ? '#4CAF50' : tr.type === 'pix_pendente' ? '#FF9800' : '#FF5252'};"></i>
                                </div>
                                <div style="flex: 1;">
                                    <p style="font-size: 0.85rem; font-weight: 600;">${tr.description || tr.desc}</p>
                                    <p style="font-size: 0.7rem; opacity: 0.5;">${tr.date}</p>
                                </div>
                                <p style="font-weight: 700;">R$ ${tr.amount.toFixed(2)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `,

            fortune_wheel: () => {
                const totalInvested = State.user.invested || 0;
                const totalEarned = Math.floor(totalInvested / 1000) * 3;
                const totalRemaining = totalEarned - (State.user.spins_used || 0);

                if (!State.fortune_session.isActive) {
                    State.fortune_session.spinsLeft = Math.min(totalRemaining, 3);
                    State.fortune_session.accumulated = 0;
                    State.fortune_session.isActive = true;
                }

                return `
                <div class="app-container animate-fade" style="text-align: center;">
                    <h1>Roda da Fortuna</h1>
                    <p style="margin-bottom: 20px;">Gire e ganhe prêmios reais! <br>A cada R$ 1.000 investidos, você ganha 3 giros.</p>

                    <div class="glass-card" style="margin-bottom: 20px; border-left: 4px solid var(--accent-blue);">
                        <div style="display: flex; justify-content: space-around;">
                            <div>
                                <p style="font-size: 0.7rem;">Acumulado</p>
                                <h2 id="fortune-accumulated" style="color: #4CAF50;">R$ ${State.fortune_session.accumulated.toFixed(2)}</h2>
                            </div>
                            <div>
                                <p style="font-size: 0.7rem;">Giros Restantes</p>
                                <h2 id="fortune-spins" style="color: var(--secondary-orange);">${State.fortune_session.spinsLeft}</h2>
                            </div>
                        </div>
                    </div>

                    <div class="wheel-container">
                        <div class="wheel-pointer"></div>
                        <div id="main-wheel" class="wheel">
                            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; transform: rotate(-22.5deg);">
                                <circle cx="50" cy="50" r="50" fill="#111" />
                                <path d="M50 50 L100 50 A50 50 0 0 1 85.3 85.3 Z" fill="#4CAF50" />
                                <path d="M50 50 L85.3 85.3 A50 50 0 0 1 50 100 Z" fill="#FF5252" />
                                <path d="M50 50 L50 100 A50 50 0 0 1 14.7 85.3 Z" fill="#00D1FF" />
                                <path d="M50 50 L14.7 85.3 A50 50 0 0 1 0 50 Z" fill="#FFD700" />
                                <path d="M50 50 L0 50 A50 50 0 0 1 14.7 14.7 Z" fill="#FF5252" />
                                <path d="M50 50 L14.7 14.7 A50 50 0 0 1 50 0 Z" fill="#9C27B0" />
                                <path d="M50 50 L50 0 A50 50 0 0 1 85.3 14.7 Z" fill="#FFD700" />
                                <path d="M50 50 L85.3 14.7 A50 50 0 0 1 100 50 Z" fill="#4CAF50" />
                                
                                <g font-size="4" font-weight="900" fill="white" style="pointer-events: none; text-anchor: middle;">
                                    <text x="82" y="55" transform="rotate(22.5, 82, 55)">R$ 5</text>
                                    <text x="65" y="80" transform="rotate(67.5, 65, 80)" font-size="3">PERDEU TUDO</text>
                                    <text x="45" y="85" transform="rotate(112.5, 45, 85)">R$ 20</text>
                                    <text x="18" y="70" transform="rotate(157.5, 18, 70)">R$ 10</text>
                                    <text x="15" y="45" transform="rotate(202.5, 15, 45)" font-size="3">PERDEU TUDO</text>
                                    <text x="35" y="20" transform="rotate(247.5, 35, 20)">R$ 50</text>
                                    <text x="55" y="15" transform="rotate(292.5, 55, 15)">R$ 100</text>
                                    <text x="80" y="35" transform="rotate(337.5, 80, 35)">R$ 5</text>
                                </g>
                            </svg>
                        </div>
                        <div class="wheel-center">BLUE</div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button id="spin-btn" class="btn btn-primary" style="flex: 2; height: 55px; border-radius: 12px; font-size: 1.1rem;" onclick="handleFortuneSpin()" ${State.fortune_session.spinsLeft === 0 || State.fortune_session.isSpinning ? 'disabled' : ''}>
                           <i class="fa-solid fa-sync-alt"></i> GIRAR AGORA
                        </button>
                        <button id="claim-btn" class="btn btn-outline" style="flex: 1; border-color: #4CAF50; color: #4CAF50; display: ${State.fortune_session.accumulated > 0 && !State.fortune_session.isSpinning ? 'block' : 'none'};" onclick="handleFortuneClaim()">
                           RESGATAR
                        </button>
                    </div>

                    <div id="fortune-msg" style="margin-top: 20px; font-size: 0.9rem; font-weight: 600; min-height: 20px;"></div>

                    <div style="margin-top: 30px; font-size: 0.75rem; opacity: 0.6; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <p>Total Investido: <strong>R$ ${totalInvested.toFixed(2)}</strong></p>
                        <p>Giros Totais Ganhos: <strong>${totalEarned}</strong></p>
                        <p>Giros já utilizados: <strong>${State.user.spins_used || 0}</strong></p>
                    </div>
                </div>
                `;
            },

            investments: () => `
            <div class="app-container animate-fade">
                <h1 style="margin-bottom: 10px;">Planos de Investimento</h1>
                <p style="margin-bottom: 30px;">Escolha o plano ideal para seu crescimento "The Blue".</p>

                ${State.plans.length === 0 ? '<p style="text-align: center; opacity: 0.5; margin-top: 50px;">Ainda não há planos ativos na plataforma. Aguarde novidades!</p>' : ''}

                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${State.plans.map(p => {
                const now = new Date();
                const startsAt = p.startsAt ? new Date(p.startsAt) : null;
                const expiresAt = p.expiresAt ? new Date(p.expiresAt) : null;

                let state = 'NORMAL';
                if (p.isSurprise) {
                    if (startsAt && now < startsAt) state = 'LOCKED';
                    else if (expiresAt && now > expiresAt) state = 'EXPIRED';
                    else state = 'SURPRISE_ACTIVE';
                }

                const n = String(p.name).toLowerCase();
                let icon = '🚀'; let color = 'var(--primary-blue)';
                if (n.includes('diamante')) { icon = '💎'; color = '#00f2fe'; }
                else if (n.includes('esmeralda')) { icon = '❇️'; color = '#00ff88'; }
                else if (n.includes('ouro') || n.includes('gold')) { icon = '🥇'; color = '#FFD700'; }
                else if (n.includes('prata') || n.includes('silver')) { icon = '🥈'; color = '#C0C0C0'; }
                else if (n.includes('bronze')) { icon = '🥉'; color = '#cd7f32'; }

                if (state === 'LOCKED') {
                    return `
                            <div class="glass-card surprise-card" style="position: relative; overflow: hidden; border: 2px solid #555; background: linear-gradient(135deg, #1a1a1a 0%, #000 100%); min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                                <div style="position: absolute; top: 10px; left: 15px; font-size: 1.5rem; font-weight: 800; color: #444; opacity: 0.5;">J</div>
                                <div style="position: absolute; bottom: 10px; right: 15px; font-size: 1.5rem; font-weight: 800; color: #444; opacity: 0.5; transform: rotate(180deg);">J</div>
                                
                                <div style="font-size: 5rem; margin-bottom: 5px; filter: grayscale(1) brightness(0.5); opacity: 0.3;">🃏</div>
                                <h2 style="font-size: 1.2rem; color: #888; letter-spacing: 2px;">MISTÉRIO "VALETE"</h2>
                                <p style="font-size: 0.8rem; margin: 10px 0; opacity: 0.6; padding: 0 40px;">Uma oportunidade única está sendo preparada...</p>
                                
                                <div style="background: rgba(255,255,255,0.05); padding: 5px 15px; border-radius: 20px; border: 1px solid #333; margin-bottom: 15px;">
                                    <p style="font-size: 0.7rem;">Custo de Entrada: <span style="color: #4CAF50; font-weight: 700;">R$ ${p.min}</span></p>
                                </div>

                                <div class="timer-badge" data-endtime="${p.startsAt}" style="background: rgba(255, 82, 82, 0.1); color: #FF5252; padding: 8px 15px; border-radius: 8px; font-family: monospace; font-size: 1.1rem; border: 1px solid #FF525240;">
                                    Abre em: --:--:--
                                </div>
                            </div>
                            `;
                }

                if (state === 'EXPIRED') {
                    return `
                            <div class="glass-card" style="opacity: 0.5; position: relative;">
                                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 2;">
                                    <h2 style="transform: rotate(-15deg); border: 4px solid #FF5252; color: #FF5252; padding: 10px 20px; border-radius: 12px; font-weight: 900;">ESGOTADO</h2>
                                </div>
                                <div style="filter: blur(2px);">
                                    <h2 style="font-size: 1.2rem;">${p.name}</h2>
                                    <p>Este investimento de tempo limitado foi encerrado.</p>
                                </div>
                            </div>
                            `;
                }

                // SURPRISE_ACTIVE or NORMAL
                const isSurpriseActive = state === 'SURPRISE_ACTIVE';
                const cardBorder = isSurpriseActive ? '2px solid #FFD700' : `4px solid ${color}`;
                const cardBg = isSurpriseActive ? 'linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(0,0,0,1) 100%)' : '';

                return `
                        <div class="glass-card ${isSurpriseActive ? 'animate-pulse-gold' : ''}" style="position: relative; overflow: hidden; border-left: ${cardBorder}; background: ${cardBg};">
                            ${isSurpriseActive ? `
                                <div style="position: absolute; top: -10px; right: -30px; background: #FFD700; color: black; font-weight: 900; font-size: 0.6rem; padding: 20px 40px 5px 40px; transform: rotate(45deg); box-shadow: 0 0 15px #FFD70080;">OFERTA VIP</div>
                            ` : ''}
                            
                            <div style="display: inline-block; background: rgba(0,209,255,0.1); color: var(--accent-blue); font-size: 0.7rem; padding: 4px 8px; border-radius: 6px; margin-bottom: 15px;">
                                ${p.category || 'Geral'}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="font-size: 2rem; background: rgba(0,0,0,0.3); width: 55px; height: 55px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid ${color}; box-shadow: 0 0 15px ${color}40;">
                                        ${icon}
                                    </div>
                                    <div>
                                        <h2 style="font-size: 1.4rem; color: ${color}; text-shadow: 0 0 10px ${color}40;">${p.name}</h2>
                                        <p style="font-size: 0.9rem;">Duração: <span style="color: white; font-weight: 600;">${p.duration} dias</span></p>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <p style="color: #4CAF50; font-weight: 800; font-size: 1.2rem;">${(p.dailyReturn * 100).toFixed(2)}% ao dia</p>
                                    <p style="font-size: 0.7rem;">Rendimento Diário</p>
                                </div>
                            </div>
                            
                            <div style="margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 12px; display: flex; justify-content: space-between;">
                                <div>
                                    <p style="font-size: 0.7rem;">Mínimo</p>
                                    <p style="font-weight: 600;">R$ ${p.min}</p>
                                </div>
                                <div>
                                    <p style="font-size: 0.7rem;">Máximo</p>
                                    <p style="font-weight: 600;">R$ ${p.max}</p>
                                </div>
                                <div>
                                    <p style="font-size: 0.7rem;">Retorno Total</p>
                                    <p style="font-weight: 700; color: var(--secondary-orange);">+${(p.dailyReturn * p.duration * 100).toFixed(2)}%</p>
                                </div>
                            </div>

                            ${isSurpriseActive ? `
                                <div style="background: rgba(255,215,0,0.1); border: 1px dashed #FFD700; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                                    <p style="font-size: 0.7rem; color: #FFD700; font-weight: 700; text-transform: uppercase;">🔥 Promoção Ativa! Termina em:</p>
                                    <div class="timer-badge" data-endtime="${p.expiresAt}" style="color: white; font-family: monospace; font-size: 1.2rem; font-weight: 900;">--:--:--</div>
                                </div>
                            ` : ''}

                            <button class="btn btn-primary" style="width: 100%; border: none; background: ${isSurpriseActive ? 'linear-gradient(45deg, #FFD700, #FFA500)' : `linear-gradient(45deg, ${color}80, transparent)`}; color: ${isSurpriseActive ? 'black' : 'white'}; font-weight: ${isSurpriseActive ? '900' : 'normal'}; border-top: 1px solid ${color}40;" onclick="handleInvest('${p.id}')">
                                ${isSurpriseActive ? 'APROVEITAR AGORA' : 'Investir Agora'}
                            </button>
                        </div>
                    `;
            }).join('')}
                </div>
            </div>
        `,

            wallet: () => `
            <div class="app-container animate-fade">
                <h1>Minha Carteira</h1>
                <p style="margin-bottom: 25px;">Gerencie seus depósitos e saques com segurança.</p>

                <!-- Wallet Hero -->
                <div class="glass-card" style="margin-bottom: 25px; background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,130,0,0.05));">
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <div style="background: var(--secondary-orange); width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            <i class="fa-solid fa-wallet" style="color: white;"></i>
                        </div>
                        <div>
                            <p style="font-size: 0.85rem;">Saldo Disponível para Saque</p>
                            <h2 style="font-size: 2rem;">R$ ${State.user.available.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <div style="display: flex; gap: 8px; margin-bottom: 25px;">
                    <button class="btn btn-outline" style="flex: 1; background: var(--glass-bg); padding: 12px 5px; font-size: 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 5px;" id="btn-dep-tab" onclick="switchWalletTab('dep')">
                        <i class="fa-solid fa-plus-circle" style="color: var(--secondary-orange);"></i> Depósito
                    </button>
                    <button class="btn btn-outline" style="flex: 1; padding: 12px 5px; font-size: 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 5px;" id="btn-trans-tab" onclick="switchWalletTab('trans')">
                        <i class="fa-solid fa-paper-plane" style="color: #00D1FF;"></i> Transferir
                    </button>
                    <button class="btn btn-outline" style="flex: 1; padding: 12px 5px; font-size: 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 5px;" id="btn-with-tab" onclick="switchWalletTab('with')">
                        <i class="fa-solid fa-money-bill-transfer" style="color: #FF5252;"></i> Sacar
                    </button>
                </div>

                <!-- Deposit Section -->
                <div id="deposit-section" class="glass-card animate-fade">
                    <h3 style="margin-bottom: 20px;">Formas de Pagamento</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                        <button class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-color: var(--primary-blue);" onclick="selectPayMethod('pix')">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-brands fa-pix" style="color: #32BCAD; font-size: 1.4rem;"></i>
                                <span>PIX Instantâneo</span>
                            </div>
                            <i class="fa-solid fa-circle-check" style="color: var(--primary-blue);"></i>
                        </button>
                        <button class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px;" onclick="selectPayMethod('usdt')">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-coins" style="color: #26A17B; font-size: 1.4rem;"></i>
                                <span>USDT (TRC-20)</span>
                            </div>
                        </button>
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px;">Valor do Depósito</label>
                    <input type="number" id="dep-amount" placeholder="Mínimo R$ 5,00" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                    
                    <button class="btn btn-secondary" style="width: 100%;" onclick="handleDeposit()">Gerar Pagamento</button>
                </div>

                 <!-- Withdrawal Section (Hidden) -->
                <div id="withdraw-section" style="display: none;" class="glass-card animate-fade">
                    <h3 style="margin-bottom: 20px;">Solicitar Saque</h3>
                    <div class="alert" style="background: rgba(255,130,0,0.1); border: 1px solid var(--secondary-orange); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.8rem;">
                        <i class="fa-solid fa-circle-info"></i> Saques são processados em até 24h úteis.<br>
                        <strong style="color: #FFD700;">Taxa de Saque: 8%</strong> (Mínimo R$ 5,00)
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px;">Valor (R$)</label>
                    <input type="number" id="withdraw-amount" placeholder="Saldo: ${State.user.available.toFixed(2)}" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                    
                    <label style="display: block; margin-bottom: 8px;">Chave PIX de Recebimento</label>
                    <input type="text" id="withdraw-pix-key" placeholder="CPF, E-mail, Celular ou Chave Aleatória" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">

                    <label style="display: block; margin-bottom: 8px;">Senha de Saque</label>
                    <input type="password" id="withdraw-pass" placeholder="Sua senha financeira" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                    
                    <button class="btn btn-primary" style="width: 100%;" onclick="handleWithdraw()">Confirmar Saque</button>
                </div>

                 <!-- Transfer Section (Hidden) -->
                <div id="transfer-section" style="display: none;" class="glass-card animate-fade">
                    <h3 style="margin-bottom: 20px;">Transferência Interna</h3>
                    <div class="alert" style="background: rgba(0,209,255,0.1); border: 1px solid var(--accent-blue); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.8rem;">
                        Transfira saldo para outros usuários instantaneamente com taxa ZERO.
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px;">Telefone do Recebedor</label>
                    <input type="text" placeholder="(00) 00000-0000" id="trans-phone" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">

                    <label style="display: block; margin-bottom: 8px;">Valor (R$)</label>
                    <input type="number" placeholder="Saldo: ${State.user.available.toFixed(2)}" id="trans-amount" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                    
                    <label style="display: block; margin-bottom: 8px;">Senha Financeira</label>
                    <input type="password" placeholder="Sua senha de segurança" id="trans-pass" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                    
                    <button class="btn btn-primary" style="width: 100%;" onclick="handleTransfer()">Realizar Transferência</button>
                </div>
            </div>
        `,

            pixCheckout: () => `
            <div class="app-container animate-fade" style="text-align: center; padding-top: 20px;">
                <h2 style="color: #4CAF50; margin-bottom: 10px;"><i class="fa-brands fa-pix"></i> PIX Gerado!</h2>
                <p>Pagamento Digital The Blue</p>
                
                <div class="glass-card" style="background: rgba(255,255,255,0.05); padding: 25px 15px; margin: 25px 0; border: 1px solid var(--primary-blue);">
                    <p style="font-size: 0.9rem; margin-bottom: 20px;">O valor a ser pago é: <strong style="font-size: 1.4rem; color: white;">R$ ${(State.currentPix ? State.currentPix.amount : 0).toFixed(2)}</strong></p>
                    
                    <div style="background: white; padding: 15px; border-radius: 12px; display: inline-block; margin-bottom: 25px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(State.currentPix ? State.currentPix.payload : '')}" alt="QR Code PIX" style="width: 200px; height: 200px;" />
                    </div>
                    
                    <p style="font-size: 0.8rem; margin-bottom: 8px;">Ou use o PIX Copia e Cola:</p>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" readonly value="${State.currentPix ? State.currentPix.payload : ''}" id="pix-copia-cola" style="flex: 1; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 8px; color: #00d1ff; font-size: 0.6rem; text-align: center;">
                        <button class="btn btn-primary" onclick="window.copyPix()"><i class="fa-solid fa-copy"></i></button>
                    </div>
                </div>
                
                <button class="btn btn-secondary" style="width: 100%; margin-bottom: 25px; padding: 15px;" onclick="handlePaymentConfirmed()">🔄 Já fiz o pagamento</button>
                
                <div class="glass-card" style="margin-bottom: 20px; border-left: 4px solid var(--secondary-orange); text-align: left;">
                    <h3 style="font-size: 1rem; margin-bottom: 10px;"><i class="fa-solid fa-file-invoice"></i> Enviar Comprovante</h3>
                    <p style="font-size: 0.8rem; margin-bottom: 15px;">Para agilizar sua aprovação, anexe o comprovante abaixo:</p>
                    
                    <input type="file" id="receipt-file" accept="image/*" style="display: none;" onchange="handleReceiptSelected(this)">
                    <button class="btn btn-outline" style="width: 100%; border-style: dashed; border-color: var(--secondary-orange); color: var(--secondary-orange); margin-bottom: 15px;" onclick="document.getElementById('receipt-file').click()">
                        <i class="fa-solid fa-camera"></i> <span id="receipt-status">Selecionar Imagem</span>
                    </button>
                    
                    <button id="btn-send-receipt" class="btn btn-primary" style="width: 100%; display: none;" onclick="handleUploadReceipt()">
                        🚀 Enviar Comprovante para o Admin
                    </button>
                </div>

                <p style="font-size: 0.7rem; opacity: 0.6;">Aguarde alguns minutos após o pagamento para que a nossa equipe revise a transação.</p>
            </div>
        `,

            referral: () => `
            <div class="app-container animate-fade">
                <h1>Indique Amigos</h1>
                <p>Ganhe comissões multinível sobre os investimentos da sua rede.</p>

                <div class="glass-card" style="margin-top: 25px; margin-bottom: 25px; background: linear-gradient(to bottom right, var(--primary-dark), rgba(0,209,255,0.1));">
                    <p style="font-size: 0.8rem; margin-bottom: 10px;">Seu Link de Convite</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" readonly value="${window.location.origin}/?ref=${State.user.phone}" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px dashed var(--glass-border); padding: 10px; border-radius: 8px; color: var(--accent-blue); font-size: 0.8rem;">
                        <button class="btn btn-outline" style="padding: 10px;" onclick="copyRef()"><i class="fa-solid fa-copy"></i></button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 30px;">
                    <div class="glass-card" style="text-align: center; padding: 15px 10px;">
                        <h4 style="color: var(--primary-blue);">Nível 1</h4>
                        <p style="font-weight: 800; font-size: 1.2rem; margin: 5px 0;">5%</p>
                        <p style="font-size: 0.6rem; opacity: 0.6;">0 usuários</p>
                    </div>
                    <div class="glass-card" style="text-align: center; padding: 15px 10px;">
                        <h4 style="color: var(--secondary-orange);">Nível 2</h4>
                        <p style="font-weight: 800; font-size: 1.2rem; margin: 5px 0;">3%</p>
                        <p style="font-size: 0.6rem; opacity: 0.6;">0 usuários</p>
                    </div>
                    <div class="glass-card" style="text-align: center; padding: 15px 10px;">
                        <h4 style="color: #607D8B;">Nível 3</h4>
                        <p style="font-weight: 800; font-size: 1.2rem; margin: 5px 0;">2%</p>
                        <p style="font-size: 0.6rem; opacity: 0.6;">0 usuários</p>
                    </div>
                </div>

                <div class="glass-card">
                    <h3 style="margin-bottom: 15px;">Meus Ganhos de Equipe</h3>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="color: #4CAF50;">R$ 0,00</h2>
                        <button class="btn btn-outline" style="font-size: 0.8rem;">Ver Ranking</button>
                    </div>
                </div>
            </div>
        `,

            admin: () => `
            <div class="app-container animate-fade">
                <h1>Painel Administrativo</h1>
                <p>Gestão global da plataforma "The Blue".</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
                    <div class="glass-card" style="padding: 15px;">
                        <p style="font-size: 0.7rem;">Usuários Totais</p>
                        <h2 id="admin-total-users" style="color: var(--primary-blue);">...</h2>
                    </div>
                    <div class="glass-card" style="padding: 15px;">
                        <p style="font-size: 0.7rem;">Aprovações Pendentes</p>
                        <h2 id="admin-total-pending" style="color: var(--secondary-orange);">...</h2>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px; border-left: 4px solid #FFD700;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: #FFD700;"><i class="fa-solid fa-crown"></i> Elegíveis Promoção (2k+)</h3>
                        <button class="btn btn-outline" style="padding: 5px; border-color: #FFD700; color: #FFD700;" onclick="loadPromoUsers()"><i class="fa-solid fa-rotate-right"></i> Buscar Elegíveis</button>
                    </div>
                    <div id="admin-promo-list" style="display: flex; flex-direction: column; gap: 10px;">
                        <p style="text-align: center; font-size: 0.8rem; opacity: 0.5;">Clique em buscar para listar usuários elegíveis ao prêmio.</p>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>Pendências (Depósitos e Saques)</h3>
                        <button class="btn btn-outline" style="padding: 5px; border-color: var(--primary-blue);" onclick="loadAdminData()"><i class="fa-solid fa-rotate-right"></i> Recarregar</button>
                    </div>
                    <div id="admin-pending-list" style="display: flex; flex-direction: column; gap: 10px;">
                        <p style="text-align: center; font-size: 0.8rem; opacity: 0.5;">Clique no botão recarregar para buscar pendências.</p>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;">Adicionar Saldo (Manual)</h3>
                    <div style="background: rgba(0,209,255,0.1); border: 1px solid var(--accent-blue); padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 0.8rem;">
                        Credite saldo diretamente na conta de um usuário.
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem;">Telefone do Cliente</label>
                    <input type="text" id="admin-add-phone" placeholder="(00) 00000-0000" class="input-field" style="width: 100%; padding: 10px; margin-bottom: 15px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">
                    
                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem;">Valor a Creditar (R$)</label>
                    <input type="number" id="admin-add-amount" placeholder="50.00" class="input-field" style="width: 100%; padding: 10px; margin-bottom: 20px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">

                    <button class="btn btn-primary" style="width: 100%;" onclick="handleAddManualBalance()"><i class="fa-solid fa-plus-circle"></i> Confirmar Crédito</button>
                </div>

                <div class="glass-card" style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;">Gerenciar Planos (Investimentos)</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div style="grid-column: span 2;">
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Nome do Plano (ex: Ouro, Diamante)</label>
                            <input type="text" id="plan-name" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Categoria / Prazo</label>
                            <select id="plan-category" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: #111; color: white; border: 1px solid var(--glass-border);">
                                <option value="Curto Prazo">Curto Prazo</option>
                                <option value="Médio Prazo">Médio Prazo</option>
                                <option value="Longo Prazo">Longo Prazo</option>
                                <option value="Vip Premium">Vip Premium</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Duração (Dias)</label>
                            <input type="number" id="plan-duration" placeholder="ex: 15" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Retorno Diário (%)</label>
                            <input type="number" id="plan-return" placeholder="ex: 2.5" step="0.01" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Aporte Mínimo (R$)</label>
                            <input type="number" id="plan-min" placeholder="50.00" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Aporte Máx. (R$)</label>
                            <input type="number" id="plan-max" placeholder="1000.00" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                    </div>

                    <div style="background: rgba(255, 82, 82, 0.1); border: 1px solid #FF5252; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="plan-is-surprise" onchange="document.getElementById('surprise-config').style.display = this.checked ? 'block' : 'none'">
                            <span style="font-weight: 600; color: #FF5252;">🃏 Este é um Investimento Surpresa (Escassez)</span>
                        </label>
                        <p style="font-size: 0.7rem; opacity: 0.8; margin-top: 5px;">Oculta o investimento sob uma carta "Valete" até o horário de abertura.</p>
                        
                        <div id="surprise-config" style="display: none; margin-top: 15px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="display: block; font-size: 0.8rem; margin-bottom: 5px; color: #4CAF50;">Abertura</label>
                                    <input type="datetime-local" id="plan-starts-at" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(0,0,0,0.5); color: white; border: 1px solid #4CAF50;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.8rem; margin-bottom: 5px; color: #FF9800;">Encerramento</label>
                                    <input type="datetime-local" id="plan-expires-at" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(0,0,0,0.5); color: white; border: 1px solid #FF9800;">
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary" style="width: 100%; margin-bottom: 15px;" onclick="handleCreatePlan()">+ Criar Novo Plano</button>

                    <div id="admin-plans-list" style="display: flex; flex-direction: column; gap: 10px;">
                        ${State.plans.length === 0 ? '<p style="text-align: center; opacity: 0.5;">Nenhum plano cadastrado.</p>' : State.plans.map(p => `
                            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid var(--primary-blue);">
                                <div>
                                    <p style="font-weight: 600; color: var(--primary-blue); font-size: 0.9rem;">${p.name} <span style="font-size: 0.6rem; color: white; background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px;">${p.category || ''}</span></p>
                                    <p style="font-size: 0.7rem; opacity: 0.8;">${p.duration} dias | ${(p.dailyReturn * 100).toFixed(2)}% a.d. | Mín: R$ ${p.min}</p>
                                </div>
                                <button class="btn btn-outline" style="padding: 5px 10px; color: #FF5252; border-color: #FF5252;" onclick="handleDeletePlan('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;">Relatórios Gerenciais (Caixa Diário)</h3>
                    <p style="font-size: 0.8rem; margin-bottom: 15px; opacity: 0.8;">Filtre depósitos e saques para conciliar com seu banco.</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Data (Deixe em branco p/ Histórico Geral)</label>
                            <input type="date" id="report-date" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Tipo</label>
                            <select id="report-type" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: #111; color: white; border: 1px solid var(--glass-border);">
                                <option value="all">Todos</option>
                                <option value="dep">Depósitos</option>
                                <option value="with">Saques</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-outline" style="width: 100%; margin-bottom: 20px;" onclick="loadAdminReports()"><i class="fa-solid fa-search"></i> Gerar Relatório</button>

                    <div id="report-results" style="display: none; flex-direction: column; gap: 15px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid #4CAF50; padding: 10px; border-radius: 8px; text-align: center;">
                                <p style="font-size: 0.7rem; color: #4CAF50;">🟢 Depósitos</p>
                                <h3 id="report-dep-approved" style="color: white; margin-top: 5px;">R$ 0,00</h3>
                                <p id="report-dep-pending" style="font-size: 0.65rem; color: #FF9800; margin-top: 5px;">Pendente: R$ 0,00</p>
                            </div>
                            <div style="background: rgba(255, 82, 82, 0.1); border: 1px solid #FF5252; padding: 10px; border-radius: 8px; text-align: center;">
                                <p style="font-size: 0.7rem; color: #FF5252;">🔴 Saques</p>
                                <h3 id="report-with-approved" style="color: white; margin-top: 5px;">R$ 0,00</h3>
                                <p id="report-with-pending" style="font-size: 0.65rem; color: #FF9800; margin-top: 5px;">Pendente: R$ 0,00</p>
                            </div>
                        </div>

                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
                            <p style="font-size: 0.7rem;">Saldo Líquido no Banco (Aprovados)</p>
                            <h2 id="report-net-balance" style="color: var(--primary-blue); margin-top: 5px;">R$ 0,00</h2>
                        </div>

                        <button class="btn btn-secondary" style="width: 100%; margin-top: 10px; background: #207245; border-color: #207245;" onclick="exportAdminReportsToExcel()"><i class="fa-solid fa-file-excel"></i> Exportar para Excel (CSV)</button>

                        <div id="report-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                            <!-- List will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `,

            profile: () => `
            <div class="app-container animate-fade">
                <h1>Meu Perfil</h1>
                <p>Gerencie sua conta e configurações.</p>
                
                <div class="glass-card" style="margin-top: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                        <i class="fa-solid fa-user-ninja" style="color: var(--primary-blue); font-size: 2rem;"></i>
                    </div>
                    <h3>${State.user ? State.user.phone : ''}</h3>
                    <p style="font-size: 0.8rem; opacity: 0.6; margin-bottom: 20px;">Membro Especial "The Blue"</p>
                    
                    ${['19999995149', '1934585300'].includes(State.user && State.user.phone ? State.user.phone.replace(/\D/g, '') : '') ? `
                        <button class="btn btn-outline" style="width: 100%; border-color: #00d1ff; color: #00d1ff; margin-bottom: 10px;" onclick="Router.navigate('admin')"><i class="fa-solid fa-shield-halved"></i> Acessar Painel Admin</button>
                    ` : ''}

                    <button class="btn btn-outline" style="width: 100%; border-color: #FF5252; color: #FF5252;" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket"></i> Sair da Conta</button>
                </div>
            </div>
        `
        },

        initAuthListeners() {
            // Here we could add specific event listeners if needed
        }
    };

    window.Router = Router;

    // --- Global Handlers (Exposed to HTML) ---

    window.toggleAuth = (showRegister) => {
        document.getElementById('register-fields').style.display = showRegister ? 'block' : 'none';
        document.getElementById('login-fields').style.display = showRegister ? 'none' : 'block';
    };

    window.handleRegister = async () => {
        const phone = document.getElementById('phone').value;
        const pass = document.getElementById('password').value;
        const withdrawPass = document.getElementById('withdraw_password').value;
        const sponsor = document.getElementById('sponsor').value;

        if (!phone || !pass || !withdrawPass) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        if (!supabase) {
            alert("Banco de dados ainda não configurado no app.js! Insira as chaves do Supabase.");
            return;
        }

        // Checar se o celular já existe enviando query
        let { data: existingUser } = await supabase.from('users').select('*').eq('phone', phone).single();
        if (existingUser) {
            alert("Telefone já cadastrado!");
            return;
        }

        const newUser = {
            phone: phone,
            password: pass,
            withdraw_pass: withdrawPass,
            balance: 0,
            available: 0,
            invested: 0,
            sponsor: sponsor || null
        };

        const { error } = await supabase.from('users').insert([newUser]);
        if (error) { alert("Erro ao criar conta no banco!"); return; }

        State.user = newUser;
        State.transactions = [];
        Router.navigate('dashboard');
    };

    window.handleLogin = async () => {
        const phone = document.getElementById('login-phone').value;
        const pass = document.getElementById('login-password').value;

        if (!phone || !pass) {
            alert("Por favor, preencha os campos.");
            return;
        }

        if (!supabase) { alert("Banco de dados ausente."); return; }

        const { data: user, error } = await supabase.from('users').select('*').eq('phone', phone).single();

        if (error || !user || user.password !== pass) {
            alert("Credenciais inválidas ou conta não encontrada.");
            return;
        }

        // Carregar transações do histórico real
        const { data: txs } = await supabase.from('transactions')
            .select('*')
            .eq('user_phone', phone)
            .order('created_at', { ascending: false });

        State.user = user;

        // Mapear datas do banco para formato local visual temporário
        State.transactions = (txs || []).map(t => ({
            ...t,
            date: new Date(t.created_at).toLocaleDateString('pt-BR')
        }));

        Router.navigate('dashboard');
    };

    window.currentPayMethod = 'pix';
    window.selectPayMethod = (method) => {
        window.currentPayMethod = method;
        alert(`Método selecionado: ${method.toUpperCase()}`);
    };

    window.handleDeposit = async () => {
        if (window.isDepositing) return;

        const amount = parseFloat(document.getElementById('dep-amount').value);
        if (!amount || amount < 5) {
            alert("O valor mínimo de depósito é R$ 5,00.");
            return;
        }

        if (window.currentPayMethod !== 'pix') {
            alert("No momento, apenas PIX está liberado automaticamente.");
            return;
        }

        const pixKey = "theblueplataforma@gmail.com";
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');

        // Incluindo o telefone como Identificador no PIX (Tag 62)
        const payload = window.generatePixPayload(pixKey, "The Blue Plataforma", "Sao Paulo", amount, State.user.phone);

        State.currentPix = { amount: amount, payload: payload };

        const tx = {
            user_phone: State.user.phone,
            type: 'pix_pendente',
            amount: amount,
            description: `Depósito PIX - Cliente: ${State.user.phone} em ${dateStr} às ${timeStr}`
        };

        window.isDepositing = true;
        const btn = document.querySelector('.btn-secondary[onclick="handleDeposit()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Processando...";
        }

        const { data: insertedTxs, error } = await supabase.from('transactions').insert([tx]).select();

        if (error || !insertedTxs || insertedTxs.length === 0) {
            alert("Erro ao registrar intenção de depósito: " + (error ? error.message : "Erro desconhecido"));
            window.isDepositing = false;
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Gerar Pagamento";
            }
            return;
        }

        window.isDepositing = false;

        State.currentPix = {
            amount: amount,
            payload: payload,
            txId: insertedTxs[0].id // Store the transaction ID
        };

        tx.date = new Date().toLocaleDateString('pt-BR');
        State.transactions.unshift(tx);

        Router.navigate('pix_checkout');
    };

    window.handleReceiptSelected = (input) => {
        if (input.files && input.files[0]) {
            document.getElementById('receipt-status').innerText = "Imagem: " + input.files[0].name;
            document.getElementById('btn-send-receipt').style.display = 'block';
        }
    };

    window.handleUploadReceipt = async () => {
        const fileInput = document.getElementById('receipt-file');
        const btn = document.getElementById('btn-send-receipt');

        if (!fileInput.files || !fileInput.files[0]) return;

        btn.disabled = true;
        btn.innerText = "Enviando...";

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            const base64Data = e.target.result;

            // Verificando se temos o ID da transação
            if (!State.currentPix || !State.currentPix.txId) {
                alert("Erro: ID da transação não localizado. Tente gerar o PIX novamente.");
                btn.disabled = false;
                btn.innerText = "🚀 Enviar Comprovante para o Admin";
                return;
            }

            const { error } = await supabase.from('transactions')
                .update({ receipt: base64Data }) // Storing base64 in a 'receipt' column
                .eq('id', State.currentPix.txId);

            if (error) {
                alert("Erro ao enviar comprovante: " + error.message);
                btn.disabled = false;
                btn.innerText = "🚀 Enviar Comprovante para o Admin";
                return;
            }

            // Notificação WhatsApp (chamando a função centralizada)
            handlePaymentConfirmed(true);

            alert("✅ Comprovante enviado com sucesso! O administrador irá conferir seu depósito.");

            Router.navigate('dashboard');
        };

        reader.readAsDataURL(file);
    };

    window.handlePaymentConfirmed = (isSilent = false) => {
        // Envia o WhatsApp
        sendWhatsApp(State.user.phone, `Seu depósito foi enviado para a plataforma. Aguarde no maximo 24 horas (se a demanda não tiver alta é rápido) para que o seu saldo seja creditado.`);

        if (!isSilent) {
            alert("Aviso enviado ao sistema! Aguarde a conferência em até 24h.");
            Router.navigate('dashboard');
        }
    };

    window.copyPix = () => {
        const input = document.getElementById('pix-copia-cola');
        input.select();
        document.execCommand('copy');
        alert('Código PIX Copia e Cola copiado com sucesso! Abra o app do seu banco e cole na área PIX.');
    };

    window.generatePixPayload = (chave, nome, cidade, valor, id = "***") => {
        const pad = (n, len) => n.toString().padStart(len, '0');
        let payloadString = "000201010212";
        let gui = "0014br.gov.bcb.pix";
        let key = "01" + pad(chave.length, 2) + chave;
        let accInfo = gui + key;
        payloadString += "26" + pad(accInfo.length, 2) + accInfo;
        payloadString += "520400005303986";
        if (valor > 0) {
            let valStr = valor.toFixed(2);
            payloadString += "54" + pad(valStr.length, 2) + valStr;
        }
        payloadString += "5802BR59" + pad(nome.length, 2) + nome + "60" + pad(cidade.length, 2) + cidade;

        // Tag 62 - Campo 05: Identificador da transação
        const cleanId = id.replace(/\D/g, '').substring(0, 25); // Limpando para garantir compatibilidade
        let addData = "05" + pad(cleanId.length, 2) + cleanId;
        payloadString += "62" + pad(addData.length, 2) + addData + "6304";

        // CRC16 Checksum
        let poly = 0x1021, res = 0xFFFF;
        for (let i = 0; i < payloadString.length; i++) {
            res ^= (payloadString.charCodeAt(i) << 8);
            for (let j = 0; j < 8; j++) {
                if ((res & 0x8000) !== 0) res = (res << 1) ^ poly;
                else res = (res << 1);
            }
        }
        res &= 0xFFFF;
        return payloadString + res.toString(16).toUpperCase().padStart(4, '0');
    };

    window.switchWalletTab = (tab) => {
        const depSec = document.getElementById('deposit-section');
        const withSec = document.getElementById('withdraw-section');
        const transSec = document.getElementById('transfer-section');
        const btnDep = document.getElementById('btn-dep-tab');
        const btnWith = document.getElementById('btn-with-tab');
        const btnTrans = document.getElementById('btn-trans-tab');

        depSec.style.display = tab === 'dep' ? 'block' : 'none';
        withSec.style.display = tab === 'with' ? 'block' : 'none';
        transSec.style.display = tab === 'trans' ? 'block' : 'none';

        btnDep.style.background = tab === 'dep' ? 'var(--glass-bg)' : 'transparent';
        btnWith.style.background = tab === 'with' ? 'var(--glass-bg)' : 'transparent';
        btnTrans.style.background = tab === 'trans' ? 'var(--glass-bg)' : 'transparent';
    };

    window.handleWithdraw = async () => {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const pixKey = document.getElementById('withdraw-pix-key').value;
        const pass = document.getElementById('withdraw-pass').value;

        if (!amount || amount < 5) {
            alert("Valor inválido. Saque mínimo é R$ 5,00.");
            return;
        }
        if (!pixKey) {
            alert("Por favor, informe sua Chave PIX para receber o pagamento.");
            return;
        }
        if (!pass) {
            alert("Digite sua senha de saque.");
            return;
        }
        if (pass !== State.user.withdraw_pass) {
            alert("Senha de saque incorreta.");
            return;
        }
        if (amount > State.user.available) {
            alert("Saldo insuficiente para este saque.");
            return;
        }

        const fee = amount * 0.08;
        const netAmount = amount - fee;

        if (!confirm(`Solicitação de Saque:\n\nValor Bruto: R$ ${amount.toFixed(2)}\nTaxa (8%): R$ ${fee.toFixed(2)}\nValor LÍQUIDO a receber: R$ ${netAmount.toFixed(2)}\n\nConfirma o pedido de saque?`)) {
            return;
        }

        // 1. Descontar saldo no banco (com verificação de sucesso)
        const upd = {
            available: Number(State.user.available) - Number(amount),
            balance: Number(State.user.balance) - Number(amount)
        };
        const { data: updRes, error: balanceError } = await supabase.from('users').update(upd).eq('phone', State.user.phone).select();

        if (balanceError || !updRes || updRes.length === 0) {
            alert("Erro ao debitar saldo: " + (balanceError ? balanceError.message : "0 linhas afetadas pelo banco."));
            return;
        }

        // 2. Atualizar estado local com o retorno do banco para garantir sincronia
        if (updRes && updRes[0]) {
            State.user = { ...State.user, ...updRes[0] };
        } else {
            // Fallback manual se o select não retornar (raro)
            State.user.available = upd.available;
            State.user.balance = upd.balance;
        }

        Router.render(); // Forçar atualização visual imediata

        const tx = {
            user_phone: State.user.phone,
            type: 'saque_pendente',
            amount: -amount,
            description: `Saque - Chave PIX: ${pixKey} | Bruto: R$ ${amount.toFixed(2)} | Líquido (após 8%): R$ ${netAmount.toFixed(2)}`
        };

        const { error } = await supabase.from('transactions').insert([tx]);
        if (error) {
            alert("Erro ao registrar tentativa de saque.");
            return;
        }

        tx.date = new Date().toLocaleDateString('pt-BR');
        State.transactions.unshift(tx);

        // Notificações WhatsApp
        // 1. Para o Usuário
        sendWhatsApp(State.user.phone, `Olá! Seu pedido de saque de R$ ${amount.toFixed(2)} foi recebido e poderá levar até 24 horas para ser processado.`);

        // 2. Para o Admin (Você)
        sendWhatsApp(WA_CONFIG.adminNumber, `🚨 *NOVO SAQUE SOLICITADO*\n\nCliente: ${State.user.phone}\nValor Bruto: R$ ${amount.toFixed(2)}\nChave: ${pixKey}\n\nAcesse o painel admin para processar.`);

        alert("Solicitação de saque enviada com sucesso! Aguarde a aprovação do administrador.");
        document.getElementById('withdraw-amount').value = '';
        document.getElementById('withdraw-pass').value = '';
        Router.navigate('wallet');
    };

    window.handleTransfer = async () => {
        const rawPhone = document.getElementById('trans-phone').value;
        const amount = parseFloat(document.getElementById('trans-amount').value);
        const pass = document.getElementById('trans-pass').value;

        if (!rawPhone || !amount || !pass) {
            alert("Preencha todos os campos para transferir.");
            return;
        }

        const phone = rawPhone.replace(/\D/g, ''); // Limpando o telefone para o banco

        if (phone === State.user.phone.replace(/\D/g, '')) {
            alert("Você não pode transferir para si mesmo.");
            return;
        }

        if (pass !== State.user.withdraw_pass) {
            alert("Senha financeira incorreta.");
            return;
        }

        if (amount <= 0 || amount > State.user.available) {
            alert("Valor inválido ou saldo insuficiente.");
            return;
        }

        // Integracao Banco
        const { data: destUser } = await supabase.from('users').select('*').eq('phone', phone).single();
        if (!destUser) {
            alert("O telefone informado não foi localizado no sistema. Verifique se o destinatário já possui cadastro.");
            return;
        }

        if (!confirm(`Confirma a transferência de R$ ${amount.toFixed(2)} para ${destUser.phone}?`)) return;

        // Alterando balanços via DB Call
        const newSenderAvailable = State.user.available - amount;
        const newSenderBalance = State.user.balance - amount;
        const newDestAvailable = Number(destUser.available) + amount;
        const newDestBalance = Number(destUser.balance) + amount;

        // Atualização em cascata (idealmente seria uma transação RPC, mas faremos sequencial no teste)
        const { error: err1 } = await supabase.from('users').update({ available: newSenderAvailable, balance: newSenderBalance }).eq('phone', State.user.phone);
        const { error: err2 } = await supabase.from('users').update({ available: newDestAvailable, balance: newDestBalance }).eq('phone', phone);

        if (err1 || err2) {
            alert("Erro técnico ao processar transferência. Verifique sua conexão.");
            return;
        }

        // --- NOVO: Buscar dados atualizados do remetente para sincronizar a tela ---
        const { data: updatedSender } = await supabase.from('users').select('*').eq('phone', State.user.phone).single();
        if (updatedSender) {
            State.user = updatedSender;
        }

        // Registrando hist de transaçoes entre os dois
        const txOut = { user_phone: State.user.phone, type: 'with', amount: -amount, description: `P2P: Enviado para ${phone}` };
        const txIn = { user_phone: phone, type: 'dep', amount: amount, description: `P2P: Recebido de ${State.user.phone}` };

        await supabase.from('transactions').insert([txOut, txIn]);

        // Sync Local State - (Já feito acima com updatedSender)
        Router.render(); 

        txOut.date = new Date().toLocaleDateString('pt-BR');
        State.transactions.unshift(txOut);

        alert(`✅ Sucesso! R$ ${amount.toFixed(2)} transferidos para ${phone}.`);
        Router.navigate('wallet');
    };

    window.handleInvest = async (planId) => {
        console.log("💰 Tentando investir no plano:", planId);
        const plan = State.plans.find(p => p.id === planId);
        
        if (!State.user || Number(State.user.available) < plan.min) {
            alert("Saldo disponível insuficiente. Faça um depósito!");
            Router.navigate('wallet');
            return;
        }

        const amountInput = prompt(`Quanto deseja investir no ${plan.name}?\n(Mín: R$${plan.min} | Máx: R$${plan.max})`, plan.min);
        const amount = parseFloat(amountInput);

        if (amount && amount >= plan.min && amount <= plan.max) {
            console.log("✅ Valor válido:", amount);
            
            // 1. Atualizar no Banco
            const newAvailable = Number(State.user.available) - amount;
            const newInvested = Number(State.user.invested) + amount;

            const { error: updError } = await supabase.from('users')
                .update({ available: newAvailable, invested: newInvested })
                .eq('phone', State.user.phone);

            if (updError) {
                alert("Erro ao processar investimento no banco: " + updError.message);
                return;
            }

            // 2. Registrar Transação
            const txInv = { user_phone: State.user.phone, type: 'inv', amount: -amount, description: `Investimento: ${plan.name}` };
            await supabase.from('transactions').insert([txInv]);

            // 3. Sincronizar Estado Local (Busca o dado real do banco para a tela)
            const { data: updatedUser } = await supabase.from('users').select('*').eq('phone', State.user.phone).single();
            if (updatedUser) {
                State.user = updatedUser;
            }

            alert("🚀 Investimento realizado com sucesso!");
            Router.navigate('dashboard');
        } else if (amountInput !== null) {
            alert("Valor inválido. Respeite os limites mínimo e máximo do plano.");
        }
    };

    window.handleAddManualBalance = async () => {
        const phone = document.getElementById('admin-add-phone').value;
        const amount = parseFloat(document.getElementById('admin-add-amount').value);

        if (!phone || !amount || amount <= 0) {
            alert("Preencha o telefone e um valor válido.");
            return;
        }

        if (!supabase) {
            alert("Supabase não configurado. Adicione suas chaves no app.js.");
            return;
        }

        // Buscar o usuário
        const { data: destUser } = await supabase.from('users').select('*').eq('phone', phone).single();
        if (!destUser) {
            alert("O telefone informado não foi localizado na base de dados (Supabase).");
            return;
        }

        // Injetar os fundos (Atualiza Available e Balance)
        const newAvailable = Number(destUser.available) + amount;
        const newBalance = Number(destUser.balance) + amount;

        const { error: updateError } = await supabase.from('users').update({
            available: newAvailable,
            balance: newBalance
        }).eq('phone', phone);

        if (updateError) {
            alert("Erro de banco de dados ao atualizar saldo.");
            return;
        }

        // Registrar como Depósito Aprovado para o destinatário ver no Extrato
        const tx = {
            user_phone: phone,
            type: 'dep',
            amount: amount,
            description: 'Depósito Aprovado (Aporte)'
        };
        await supabase.from('transactions').insert([tx]);

        alert(`Sucesso! Saldo de R$ ${amount.toFixed(2)} foi creditado para o usuário ${phone}.`);

        // Limpar os campos pós-sucesso
        document.getElementById('admin-add-phone').value = '';
        document.getElementById('admin-add-amount').value = '';
    };

    window.loadAdminStats = async () => {
        if (!supabase) return;
        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

        const { count: pendingDepCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'pix_pendente');
        const { count: pendingWithCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'saque_pendente');

        const totalPending = (pendingDepCount || 0) + (pendingWithCount || 0);

        const uEl = document.getElementById('admin-total-users');
        const pEl = document.getElementById('admin-total-pending');
        if (uEl) uEl.innerText = usersCount !== null ? usersCount : '...';
        if (pEl) pEl.innerText = totalPending !== null ? totalPending : '...';
    };

    window.loadAdminData = async () => {
        const list = document.getElementById('admin-pending-list');
        list.innerHTML = '<p style="text-align: center;">Buscando pendências...</p>';

        const { data: pendings } = await supabase.from('transactions')
            .select('*')
            .in('type', ['pix_pendente', 'saque_pendente'])
            .order('created_at', { ascending: false });

        window.lastAdminPendings = pendings || []; // Cache to avoid complex onclick strings

        if (!pendings || pendings.length === 0) {
            list.innerHTML = '<p style="text-align: center; opacity: 0.5;">Nenhuma pendência no momento.</p>';
            return;
        }

        list.innerHTML = pendings.map(p => {
            if (p.type === 'pix_pendente') {
                return `
                <div style="border-bottom: 1px solid var(--glass-border); padding-bottom: 15px; margin-bottom: 15px;">
                     <p style="font-size: 0.85rem; font-weight: 600;">Depósito PIX: <span style="color: #4CAF50;">R$ ${p.amount.toFixed(2)}</span></p>
                     <p style="font-size: 0.7rem; opacity: 0.6; margin-bottom: 10px;">Cliente: ${p.user_phone} | ID: ${p.id.split('-')[0]}</p>
                     
                     ${p.receipt ? `
                        <div style="margin-bottom: 15px;">
                            <p style="font-size: 0.7rem; color: var(--secondary-orange); margin-bottom: 5px;"><i class="fa-solid fa-image"></i> Comprovante Anexado:</p>
                            <img src="${p.receipt}" style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; border: 1px solid var(--glass-border); cursor: pointer;" onclick="window.open(this.src)">
                        </div>
                     ` : `
                        <p style="font-size: 0.7rem; opacity: 0.4; margin-bottom: 10px;"><i class="fa-solid fa-circle-info"></i> Sem comprovante anexado</p>
                     `}

                     <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" style="padding: 10px; font-size: 0.75rem; flex: 1; cursor: pointer;" onclick="window.handleAdminApprove('${p.id}')">✔ Aprovar</button>
                        <button class="btn btn-outline" style="padding: 10px; font-size: 0.75rem; color: #FF5252; flex: 1; cursor: pointer;" onclick="window.handleAdminReject('${p.id}')">❌ Recusar</button>
                     </div>
                </div>
                `;
            } else {
                const gross = Math.abs(p.amount);
                const fee = gross * 0.08;
                const net = gross - fee;
                const timeStr = new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(p.created_at).toLocaleDateString('pt-BR');

                return `
                <div style="border-bottom: 1px solid var(--glass-border); padding-bottom: 15px; margin-bottom: 15px; background: rgba(255,130,0,0.03); padding: 12px; border-radius: 8px;">
                     <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <p style="font-size: 0.7rem; opacity: 0.6; text-transform: uppercase; font-weight: 700;">Solicitação de Saque</p>
                            <h3 style="color: #FF9800; margin: 5px 0;">R$ ${net.toFixed(2)} <span style="font-size: 0.7rem; color: white; opacity: 0.5;">(Líquido)</span></h3>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 0.65rem; opacity: 0.8;">${dateStr} às ${timeStr}</p>
                            <p style="font-size: 0.65rem; color: #4CAF50; font-weight: 600;">ID: ${p.id.split('-')[0]}</p>
                        </div>
                     </div>

                     <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; margin: 10px 0; font-size: 0.75rem;">
                        <p>👤 <strong>Cliente:</strong> ${p.user_phone}</p>
                        <p>💰 <strong>Bruto:</strong> R$ ${gross.toFixed(2)} | 🏷️ <strong>Taxa (8%):</strong> R$ ${fee.toFixed(2)}</p>
                        <p style="margin-top: 5px; color: var(--primary-blue); font-weight: 600; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 5px;">📍 ${p.description.split('|')[0]}</p>
                     </div>

                     <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" style="padding: 10px; font-size: 0.75rem; flex: 1.5; background: var(--secondary-orange); border-color: var(--secondary-orange); cursor: pointer;" onclick="window.handleAdminApprove('${p.id}')">✔ Efetivar Saque</button>
                        <button class="btn btn-outline" style="padding: 10px; font-size: 0.75rem; color: #FF5252; flex: 1; cursor: pointer;" onclick="window.handleAdminReject('${p.id}')">❌ Recusar</button>
                     </div>
                </div>
                `;
            }
        }).join('');
    };

    window.handleAdminApprove = async (txId) => {
        console.log("🚀 handleAdminApprove iniciado para:", txId);

        try {
            // Busca tanto na lista de pendências quanto na de relatórios
            const p = (window.lastAdminPendings || []).find(x => x.id === txId) ||
                (window.lastAdminReportData || []).find(x => x.id === txId);

            console.log("📦 Transação localizada no cache:", p);

            if (!p) {
                console.error("❌ ERRO: Transação não encontrada em lastAdminPendings ou lastAdminReportData");
                alert("Erro: Transação não localizada no cache local. Recarregue a página.");
                return;
            }

            if (p.type === 'pix_pendente') {
                const phone = p.user_phone;
                const amount = Math.abs(parseFloat(p.amount));

                const msg = `<strong>APROVAR PIX?</strong><br><br>Valor: R$ ${amount.toFixed(2)}<br>Cliente: ${phone}<br><br>Clique em confirmar se o valor já caiu na sua conta.`;

                window.showCustomModal(msg, async () => {
                    console.log("🔍 Buscando usuário no banco...");
                    const { data: user, error: userFetchError } = await supabase.from('users').select('*').eq('phone', phone).single();

                    if (userFetchError || !user) {
                        alert("Erro ao buscar usuário.");
                        return;
                    }

                    console.log("🆙 Atualizando saldo...");
                    const { error: balanceError } = await supabase.from('users').update({
                        available: Number(user.available) + amount,
                        balance: Number(user.balance) + amount
                    }).eq('phone', phone);

                    if (balanceError) {
                        alert("Erro ao atualizar saldo.");
                        return;
                    }

                    await supabase.from('transactions').update({ type: 'dep', description: 'Depósito PIX (Aprovado)' }).eq('id', txId);
                    alert(`✅ SUCESSO! R$ ${amount.toFixed(2)} creditados.`);

                    if (window.loadAdminData) window.loadAdminData();
                    if (window.loadAdminReports && document.getElementById('report-results') && document.getElementById('report-results').style.display !== 'none') {
                        window.loadAdminReports();
                    }
                });
            } else {
                const gross = Math.abs(parseFloat(p.amount));
                const fee = gross * 0.08;
                const net = gross - fee;

                const msg = `<strong>EFETIVAR SAQUE?</strong><br><br>Valor Líquido: R$ ${net.toFixed(2)}<br>Cliente: ${p.user_phone}<br><br>Confirma que já realizou o PIX para o cliente?`;

                window.showCustomModal(msg, async () => {
                    const { error: txUpdateError } = await supabase.from('transactions').update({
                        type: 'with',
                        description: 'Saque Aprovado'
                    }).eq('id', txId);

                    if (txUpdateError) {
                        alert("Erro ao efetivar saque.");
                    } else {
                        // Notificação WhatsApp para o Usuário
                        sendWhatsApp(p.user_phone, `✅ Seu saque já foi realizado com sucesso! O valor já deve estar em sua conta.`);

                        alert("✅ Saque marcado como efetuado.");
                    }

                    if (window.loadAdminData) window.loadAdminData();
                    if (window.loadAdminReports && document.getElementById('report-results') && document.getElementById('report-results').style.display !== 'none') {
                        window.loadAdminReports();
                    }
                });
            }
        } catch (err) {
            console.error("💥 ERRO:", err);
        }
    };

    window.handleAdminReject = async (txId) => {
        console.log("🚀 handleAdminReject iniciado:", txId);

        try {
            const p = (window.lastAdminPendings || []).find(x => x.id === txId) ||
                (window.lastAdminReportData || []).find(x => x.id === txId);

            if (!p) return;

            const msg = `<strong>RECUSAR TRANSAÇÃO?</strong><br><br>Isso marcará o pedido como inválido. No caso de saque, o valor voltará para o saldo do cliente.`;

            window.showCustomModal(msg, async () => {
                if (p.type === 'pix_pendente') {
                    await supabase.from('transactions').update({ type: 'pix_recusado', description: 'Depósito PIX (Recusado)' }).eq('id', txId);
                    alert("Depósito recusado.");
                } else {
                    const amount = Math.abs(parseFloat(p.amount));
                    const { data: user } = await supabase.from('users').select('*').eq('phone', p.user_phone).single();
                    if (user) {
                        await supabase.from('users').update({
                            available: Number(user.available) + amount,
                            balance: Number(user.balance) + amount
                        }).eq('phone', p.user_phone);

                        await supabase.from('transactions').update({ type: 'saque_recusado', description: 'Saque Recusado (Estornado)' }).eq('id', txId);
                        alert("Saque recusado e valor estornado.");
                    }
                }
                if (window.loadAdminData) window.loadAdminData();
                if (window.loadAdminReports && document.getElementById('report-results') && document.getElementById('report-results').style.display !== 'none') {
                    window.loadAdminReports();
                }
            });
        } catch (err) { console.error(err); }
    };

    window.handleCreatePlan = async () => {
        const name = document.getElementById('plan-name').value;
        const category = document.getElementById('plan-category').value;
        const duration = parseInt(document.getElementById('plan-duration').value);
        const dailyReturn = parseFloat(document.getElementById('plan-return').value);
        const minAmount = parseFloat(document.getElementById('plan-min').value);
        const maxAmount = parseFloat(document.getElementById('plan-max').value);

        const isSurprise = document.getElementById('plan-is-surprise').checked;
        const rawStart = document.getElementById('plan-starts-at').value;
        const rawEnd = document.getElementById('plan-expires-at').value;

        if (!name || isNaN(duration) || isNaN(dailyReturn) || isNaN(minAmount) || isNaN(maxAmount)) {
            alert("Preencha todos os campos do plano com valores válidos.");
            return;
        }

        if (isSurprise && (!rawStart || !rawEnd)) {
            alert("Para planos surpresa, você deve definir obrigatoriamente a data/hora de abertura e de encerramento.");
            return;
        }

        let startsAt = null, expiresAt = null;
        if (isSurprise) {
            // Convert to local ISO for Supabase (preserving exact local time context)
            startsAt = new Date(rawStart).toISOString();
            expiresAt = new Date(rawEnd).toISOString();
        }

        const planRef = {
            name: name,
            category: category,
            duration: duration,
            daily_return: dailyReturn,
            min_amount: minAmount,
            max_amount: maxAmount,
            is_surprise: isSurprise,
            starts_at: startsAt,
            expires_at: expiresAt
        };

        const { data, error } = await supabase.from('plans').insert([planRef]).select();
        if (error) {
            alert("Erro ao criar plano. Verificou se você rodou o código SQL no seu Supabase? Erro original: " + error.message);
            return;
        }

        if (data && data[0]) {
            State.plans.push({
                id: data[0].id,
                name: data[0].name,
                category: data[0].category,
                duration: data[0].duration,
                dailyReturn: parseFloat(data[0].daily_return) / 100,
                min: parseFloat(data[0].min_amount),
                max: parseFloat(data[0].max_amount),
                isSurprise: data[0].is_surprise || false,
                startsAt: data[0].starts_at || null,
                expiresAt: data[0].expires_at || null
            });
            alert("Plano criado com sucesso!");
            Router.render();
        }
    };

    window.handleDeletePlan = async (id) => {
        if (!confirm("Deletar esse plano de investimento permanentemente da plataforma? Isso impedirá novas assinaturas.")) return;

        const { error } = await supabase.from('plans').delete().eq('id', id);
        if (error) {
            alert("Erro ao deletar: " + error.message);
            return;
        }

        State.plans = State.plans.filter(p => p.id !== id);
        alert("Plano removido.");
        Router.render();
    };

    window.rejectPix = async (txId) => {
        console.log("Iniciando recusa de PIX:", txId);
        if (!confirm("Tem certeza que esse depósito é inválido/falso? Ele será marcado como Recusado.")) return;

        const { data, error } = await supabase.from('transactions').update({
            type: 'pix_recusado',
            description: 'Depósito PIX (Recusado)'
        }).eq('id', txId).select();

        if (error || !data || data.length === 0) {
            alert("Erro ao recusar PIX no banco: " + (error ? error.message : "0 linhas afetadas"));
            return;
        }

        alert("Depósito recusado com sucesso.");
        loadAdminData();
    };

    window.loadAdminReports = async () => {
        const dateStr = document.getElementById('report-date').value;
        const typeFilter = document.getElementById('report-type').value;

        const reportResultsDiv = document.getElementById('report-results');
        const reportListDiv = document.getElementById('report-list');
        reportListDiv.innerHTML = '<p style="text-align:center; opacity: 0.5;">Buscando dados no servidor...</p>';
        reportResultsDiv.style.display = 'flex';

        let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });

        if (dateStr) {
            // Definindo ranges GMT-3 para bater exatamente com a data Brasileira selecionada
            const start = new Date(`${dateStr}T00:00:00-03:00`).toISOString();
            const end = new Date(`${dateStr}T23:59:59-03:00`).toISOString();
            query = query.gte('created_at', start).lte('created_at', end);
        }

        if (typeFilter === 'dep') {
            query = query.in('type', ['dep', 'pix_pendente', 'pix_recusado']);
        } else if (typeFilter === 'with') {
            query = query.in('type', ['with', 'saque_pendente', 'saque_recusado']);
        } else {
            query = query.in('type', ['dep', 'pix_pendente', 'pix_recusado', 'with', 'saque_pendente', 'saque_recusado']);
        }

        const { data, error } = await query;
        if (error) {
            reportListDiv.innerHTML = `<p style="text-align:center; color: red;">Erro: ${error.message}</p>`;
            return;
        }

        window.lastAdminReportData = data;

        let depApproved = 0, depPending = 0;
        let withApproved = 0, withPending = 0;
        let htmlSnippet = '';

        if (!data || data.length === 0) {
            htmlSnippet = '<p style="text-align:center; opacity: 0.5; font-size: 0.8rem;">Nenhum registro (Pix/Saque) encontrado nesta data.</p>';
        } else {
            data.forEach(tx => {
                const amount = Math.abs(parseFloat(tx.amount));

                let readableType = ''; let color = ''; let statTxt = '';
                if (tx.type === 'dep') {
                    depApproved += amount;
                    readableType = 'Depósito'; color = '#4CAF50'; statTxt = 'APROVADO';
                } else if (tx.type === 'pix_pendente') {
                    depPending += amount;
                    readableType = 'Depósito'; color = '#FF9800'; statTxt = 'PENDENTE';
                } else if (tx.type === 'with') {
                    withApproved += amount;
                    readableType = 'Saque'; color = '#FF5252'; statTxt = 'APROVADO';
                } else if (tx.type === 'saque_pendente') {
                    withPending += amount;
                    readableType = 'Saque'; color = '#FF9800'; statTxt = 'PENDENTE';
                } else if (tx.type.includes('recusado')) {
                    readableType = tx.type.includes('pix') ? 'Depósito' : 'Saque';
                    color = '#607D8B'; statTxt = 'RECUSADO';
                }

                htmlSnippet += `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px; border-left: 4px solid ${color}; position: relative; z-index: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p style="font-size: 0.85rem; font-weight: 700; color: white;">${tx.user_phone}</p>
                                <p style="font-size: 0.7rem; opacity: 0.7;">${readableType} | ${new Date(tx.created_at).toLocaleTimeString('pt-BR')}</p>
                            </div>
                            <div style="text-align: right;">
                                <p style="font-size: 1rem; font-weight: 800; color: ${color};">R$ ${amount.toFixed(2)}</p>
                                <p style="font-size: 0.65rem; color: ${color}; font-weight: 700; letter-spacing: 0.5px;">${statTxt}</p>
                            </div>
                        </div>
                        
                        ${(tx.type === 'pix_pendente' || tx.type === 'saque_pendente') ? `
                            <div style="display: flex; gap: 8px; margin-top: 5px;">
                                <button class="btn btn-primary" style="padding: 10px; font-size: 0.75rem; flex: 1; border-radius: 8px; background: linear-gradient(45deg, #4CAF50, #2E7D32); cursor: pointer; pointer-events: auto;" onclick="window.handleAdminApprove('${tx.id}')">
                                    <i class="fa-solid fa-check"></i> Aprovar Pix
                                </button>
                                <button class="btn btn-outline" style="padding: 10px; font-size: 0.75rem; flex: 1; border-radius: 8px; color: #FF5252; border-color: #FF525240; cursor: pointer; pointer-events: auto;" onclick="window.handleAdminReject('${tx.id}')">
                                    <i class="fa-solid fa-xmark"></i> Rejeitar Pix
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }

        document.getElementById('report-dep-approved').innerText = `R$ ${depApproved.toFixed(2)}`;
        document.getElementById('report-dep-pending').innerText = `Pendente: R$ ${depPending.toFixed(2)}`;
        document.getElementById('report-with-approved').innerText = `R$ ${withApproved.toFixed(2)}`;
        document.getElementById('report-with-pending').innerText = `Pendente: R$ ${withPending.toFixed(2)}`;

        const net = depApproved - withApproved;
        document.getElementById('report-net-balance').innerText = `R$ ${net.toFixed(2)}`;
        document.getElementById('report-net-balance').style.color = net >= 0 ? '#4CAF50' : '#FF5252';

        reportListDiv.innerHTML = htmlSnippet;
    };

    window.exportAdminReportsToExcel = () => {
        if (!window.lastAdminReportData || window.lastAdminReportData.length === 0) {
            alert("Nenhum dado para exportar. Gere o relatório primeiro.");
            return;
        }

        let csvContent = "Data/Hora;Cliente;Tipo;Status;Valor (R$)\n";

        window.lastAdminReportData.forEach(tx => {
            const date = new Date(tx.created_at).toLocaleString('pt-BR');
            const amount = Math.abs(parseFloat(tx.amount)).toFixed(2).replace('.', ',');
            const client = tx.user_phone;

            let type = ''; let status = '';
            if (tx.type === 'dep') { type = 'Depósito'; status = 'Aprovado'; }
            else if (tx.type === 'pix_pendente') { type = 'Depósito'; status = 'Pendente'; }
            else if (tx.type === 'with') { type = 'Saque'; status = 'Aprovado'; }
            else if (tx.type === 'saque_pendente') { type = 'Saque'; status = 'Pendente'; }
            else if (tx.type.includes('recusado')) { type = tx.type.includes('pix') ? 'Depósito' : 'Saque'; status = 'Recusado'; }
            else { type = tx.type; status = '-'; }

            csvContent += `${date};${client};${type};${status};${amount}\n`;
        });

        const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `relatorio_caixa_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    window.copyRef = () => {
        const input = document.querySelector('input[readonly]');
        input.select();
        document.execCommand('copy');
        alert("Link copiado! Envie para seus amigos.");
    };

    window.handleDailyCheckin = async () => {
        if (!State.user) return;

        const last = State.user.last_checkin ? new Date(State.user.last_checkin) : null;
        const now = new Date();

        if (last && (now - last < 24 * 60 * 60 * 1000)) {
            alert("Você já fez o check-in hoje! Volte em 24h.");
            return;
        }

        const newPoints = (State.user.points || 0) + 1;
        const checkinDate = now.toISOString();

        const { error } = await supabase.from('users').update({
            points: newPoints,
            last_checkin: checkinDate
        }).eq('phone', State.user.phone);

        if (error) {
            alert("Erro ao salvar check-in: " + error.message);
            return;
        }

        State.user.points = newPoints;
        State.user.last_checkin = checkinDate;

        alert("💎 +1 Ponto de Fidelidade! Continue assim.");
        Router.render();
    };

    window.handleExchangePoints = async () => {
        const target = State.user.checkin_target || 7;
        const reward = target; // R$ 7 for 7 days, R$ 15 for 15 days

        if (!State.user || (State.user.points || 0) < target) {
            alert(`Você precisa de pelo menos ${target} pontos.`);
            return;
        }

        if (!confirm(`Deseja resgatar sua recompensa de R$ ${reward.toFixed(2)} e iniciar o próximo ciclo?`)) return;

        const newTarget = target === 7 ? 15 : 7;
        const newPoints = 0; // Reset as requested
        const newAvailable = State.user.available + reward;
        const newBalance = State.user.balance + reward;

        // Registrar transação
        const { error: txError } = await supabase.from('transactions').insert([{
            user_phone: State.user.phone,
            type: 'dep',
            amount: reward,
            description: `Recompensa Check-in (${target} dias)`
        }]);

        if (txError) {
            alert("Erro ao processar recompensa: " + txError.message);
            return;
        }

        const { error: userError } = await supabase.from('users').update({
            points: newPoints,
            checkin_target: newTarget,
            available: newAvailable,
            balance: newBalance
        }).eq('phone', State.user.phone);

        if (userError) {
            alert("Erro ao atualizar cadastro: " + userError.message);
            return;
        }

        State.user.points = newPoints;
        State.user.checkin_target = newTarget;
        State.user.available = newAvailable;
        State.user.balance = newBalance;

        // Efeito de Confete
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#0066FF', '#FFD700', '#FFFFFF']
            });
        }

        alert(`🎉 Parabéns! R$ ${reward.toFixed(2)} foram adicionados ao seu saldo disponível. Próximo objetivo: ${newTarget} dias!`);
        Router.render();
    };

    let currentRotation = 0;
    window.handleFortuneSpin = async () => {
        if (State.fortune_session.isSpinning || State.fortune_session.spinsLeft <= 0) return;

        State.fortune_session.isSpinning = true;
        State.fortune_session.spinsLeft--;

        const wheel = document.getElementById('main-wheel');
        const spinBtn = document.getElementById('spin-btn');
        const claimBtn = document.getElementById('claim-btn');
        const fortuneMsg = document.getElementById('fortune-msg');

        spinBtn.disabled = true;
        if (claimBtn) claimBtn.style.display = 'none';
        fortuneMsg.innerHTML = "Sorteando prêmio...";

        // Logic for landing
        // 8 segments, 45deg each. Starts at -22.5.
        // Segments relative to pointer (at top, 0deg target):
        // Index 0 (82, 55): R$ 5 (0-45deg)
        // Index 1 (65, 80): PERDEU TUDO (45-90)
        // Index 2 (45, 85): R$ 20 (90-135)
        // Index 3 (18, 70): R$ 10 (135-180)
        // Index 4 (15, 45): PERDEU TUDO (180-225)
        // Index 5 (35, 20): R$ 50 (225-270)
        // Index 6 (55, 15): R$ 100 (270-315)
        // Index 7 (80, 35): R$ 5 (315-360)

        const prizes = [
            { label: 'R$ 5', value: 5 },
            { label: 'PERDEU TUDO', value: -1 },
            { label: 'R$ 20', value: 20 },
            { label: 'R$ 10', value: 10 },
            { label: 'PERDEU TUDO', value: -1 },
            { label: 'R$ 50', value: 50 },
            { label: 'R$ 100', value: 100 },
            { label: 'R$ 5', value: 5 }
        ];

        // Random spin
        const extraDegrees = Math.floor(Math.random() * 360);
        const spins = 5 + Math.floor(Math.random() * 5); // 5 to 10 full spins
        currentRotation += (spins * 360) + extraDegrees;

        wheel.style.transform = `rotate(${currentRotation}deg)`;

        setTimeout(async () => {
            State.fortune_session.isSpinning = false;

            // Calculate which segment is at the pointer (top is index 0 in our logic)
            // The pointer is at 0 degrees. The wheel rotated by currentRotation.
            // Normalize currentRotation to 0-359.
            const normalized = (360 - (currentRotation % 360)) % 360;
            const segmentIdx = Math.floor(normalized / 45);
            const prize = prizes[segmentIdx];

            if (prize.value === -1) {
                State.fortune_session.accumulated = 0;
                fortuneMsg.innerHTML = '<span style="color: #FF5252;">😱 AH NÃO! Você caiu no PERDEU TUDO!</span>';
                // Only mark as used on DB if they lost or claimed
            } else {
                State.fortune_session.accumulated += prize.value;
                fortuneMsg.innerHTML = `<span style="color: #4CAF50;">💰 PARABÉNS! Ganhou ${prize.label}!</span>`;
            }

            // Sync with UI
            document.getElementById('fortune-accumulated').innerText = `R$ ${State.fortune_session.accumulated.toFixed(2)}`;
            document.getElementById('fortune-spins').innerText = State.fortune_session.spinsLeft;

            // Re-enable buttons
            spinBtn.disabled = State.fortune_session.spinsLeft <= 0;
            if (claimBtn) {
                claimBtn.style.display = (State.fortune_session.accumulated > 0) ? 'block' : 'none';
                claimBtn.disabled = false;
            }

            // If spins ended, they MUST claim (if > 0) or it ends
            if (State.fortune_session.spinsLeft === 0) {
                if (State.fortune_session.accumulated > 0) {
                    fortuneMsg.innerHTML += '<br>Giros acabaram! Resgate seu prêmio agora.';
                } else {
                    fortuneMsg.innerHTML += '<br>Que pena! Tente investir mais para ganhar novos giros.';
                    await finalizeSpinsUsed(1); // Increment used
                    State.fortune_session.isActive = false;
                    setTimeout(() => Router.render(), 2000);
                }
            }
        }, 5100);
    };

    window.handleFortuneClaim = async () => {
        if (State.fortune_session.isSpinning || State.fortune_session.accumulated <= 0) return;

        const prize = State.fortune_session.accumulated;

        const { error: txError } = await supabase.from('transactions').insert([{
            user_phone: State.user.phone,
            type: 'dep',
            amount: prize,
            description: 'Prêmio da Roda da Fortuna'
        }]);

        if (txError) {
            alert("Erro ao resgatar prêmio: " + txError.message);
            return;
        }

        const newAvailable = State.user.available + prize;
        const newBalance = State.user.balance + prize;

        const { error: userError } = await supabase.from('users').update({
            available: newAvailable,
            balance: newBalance
        }).eq('phone', State.user.phone);

        if (userError) {
            alert("Erro ao creditar saldo: " + userError.message);
            return;
        }

        await finalizeSpinsUsed(1); // Consumed the session

        State.user.available = newAvailable;
        State.user.balance = newBalance;
        State.fortune_session.accumulated = 0;
        State.fortune_session.isActive = false;

        if (typeof confetti === 'function') {
            confetti({
                particleCount: 200,
                spread: 90,
                origin: { y: 0.5 },
                colors: ['#FFD700', '#0066FF', '#FFFFFF']
            });
        }

        alert(`🤑 SUCESSO! R$ ${prize.toFixed(2)} foram creditados na sua conta!`);
        Router.render();
    };

    async function finalizeSpinsUsed(count) {
        const newSpinsUsed = (State.user.spins_used || 0) + (count * 3); // Each session is 3 spins used
        await supabase.from('users').update({ spins_used: newSpinsUsed }).eq('phone', State.user.phone);
        State.user.spins_used = newSpinsUsed;
    }

    window.handleLogout = () => {
        State.user = null;
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab-item[data-view="dashboard"]').classList.add('active'); // Reset tab state
        Router.navigate('auth');
    };

    // --- Custom Modal System ---
    window.showCustomModal = (htmlContent, onConfirm) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'custom-modal-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
            z-index: 10000; backdrop-filter: blur(5px); padding: 20px;
        `;

        const modal = document.createElement('div');
        modal.style = `
            background: #151515; border: 1px solid #333; border-radius: 16px;
            width: 100%; max-width: 400px; padding: 25px; text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: animate-pop 0.3s ease-out;
        `;

        modal.innerHTML = `
            <div style="font-size: 1.1rem; color: #fff; margin-bottom: 25px; line-height: 1.5;">${htmlContent}</div>
            <div style="display: flex; gap: 10px;">
                <button id="modal-cancel" class="btn btn-outline" style="flex: 1; padding: 12px; font-weight: 700;">CANCELAR</button>
                <button id="modal-confirm" class="btn btn-primary" style="flex: 1; padding: 12px; font-weight: 700;">CONFIRMAR</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Listeners
        document.getElementById('modal-cancel').onclick = () => {
            document.body.removeChild(overlay);
        };

        document.getElementById('modal-confirm').onclick = async () => {
            const btn = document.getElementById('modal-confirm');
            btn.disabled = true;
            btn.innerText = "Processando...";
            await onConfirm();
            document.body.removeChild(overlay);
        };
    };

    window.loadPromoUsers = async () => {
        const list = document.getElementById('admin-promo-list');
        if (!list) return;
        list.innerHTML = '<p style="text-align: center; font-size: 0.8rem; opacity: 0.5;">Buscando elegíveis...</p>';

        const { data: users, error } = await supabase
            .from('users')
            .select('phone, invested')
            .gte('invested', 2000)
            .order('invested', { ascending: false });

        if (error) {
            list.innerHTML = `<p style="color: #FF5252; font-size: 0.8rem;">Erro ao buscar: ${error.message}</p>`;
            return;
        }

        if (!users || users.length === 0) {
            list.innerHTML = '<p style="text-align: center; font-size: 0.8rem; opacity: 0.5;">Nenhum usuário atingiu R$ 2.000,00 ainda.</p>';
            return;
        }

        list.innerHTML = users.map(u => `
            <div style="background: rgba(255,215,0,0.05); padding: 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,215,0,0.2);">
                <div>
                    <p style="font-weight: 700; color: white;">${u.phone}</p>
                    <p style="font-size: 0.75rem; color: #FFD700;">Total Investido: R$ ${parseFloat(u.invested).toFixed(2)}</p>
                </div>
                <button class="btn btn-primary" style="padding: 8px 12px; font-size: 0.7rem; background: #FFD700; border-color: #FFD700; color: black;" onclick="handlePayPromoPrize('${u.phone}')">
                    PAGAR PRÊMIO
                </button>
            </div>
        `).join('');
    };

    window.handlePayPromoPrize = async (phone) => {
        if (!confirm(`Confirma o pagamento do prêmio de R$ 500,00 para o usuário ${phone}?`)) return;

        try {
            // 1. Buscar usuário para garantir saldo atualizado
            const { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();
            if (!user) throw new Error("Usuário não encontrado.");

            // 2. Adicionar R$ 500
            const { error: updError } = await supabase.from('users').update({
                available: Number(user.available) + 500,
                balance: Number(user.balance) + 500
            }).eq('phone', phone);

            if (updError) throw updError;

            // 3. Registrar Transação
            await supabase.from('transactions').insert([{
                user_phone: phone,
                type: 'dep',
                amount: 500,
                description: '🎁 PRÊMIO PROMOÇÃO: Investimento 2k+ (2 Meses)'
            }]);

            // 4. Enviar WhatsApp
            sendWhatsApp(phone, `🌟 *PARABÉNS!* 🌟\n\nVocê recebeu o prêmio de *R$ 500,00* da nossa promoção por manter investimentos acima de R$ 2.000,00!\n\nO valor já foi creditado no seu saldo disponível. Continue investindo e lucrando com o The Blue! 🚀`);

            alert(`✅ Sucesso! R$ 500,00 pagos ao usuário ${phone}.`);
            loadPromoUsers(); // Atualiza a lista
        } catch (e) {
            console.error(e);
            alert("Erro ao pagar prêmio: " + e.message);
        }
    };

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', async () => {
        // Fetch Plans from Supabase
        if (supabase) {
            const { data } = await supabase.from('plans').select('*').order('min_amount', { ascending: true });
            if (data && data.length > 0) {
                State.plans = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    duration: p.duration,
                    dailyReturn: parseFloat(p.daily_return) / 100,
                    min: parseFloat(p.min_amount),
                    max: parseFloat(p.max_amount),
                    isSurprise: p.is_surprise || false,
                    startsAt: p.starts_at || null,
                    expiresAt: p.expires_at || null
                }));
            }
        }

        // Check if there's a referral code in the URL
        // Referral Link Handler (?ref=PHONE)
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref');
        if (refParam) {
            localStorage.setItem('theblue_ref', refParam);
            // Clean URL and show register form
            window.history.replaceState({}, document.title, window.location.pathname);
            State.currentView = 'auth';
            setTimeout(() => {
                if (window.toggleAuth) window.toggleAuth(true);
            }, 150);
        }

        // Keep legacy /ref/ support just in case, but knowing it might 404
        const path = window.location.pathname;
        if (path.startsWith('/ref/')) {
            const refCode = path.replace('/ref/', '');
            if (refCode) {
                localStorage.setItem('theblue_ref', refCode);
                window.history.replaceState({}, document.title, "/");
                State.currentView = 'auth';
                setTimeout(() => {
                    if (window.toggleAuth) window.toggleAuth(true);
                }, 150);
            }
        }

        // --- Global Timer Updater ---
        setInterval(() => {
            document.querySelectorAll('.timer-badge').forEach(el => {
                const end = new Date(el.getAttribute('data-endtime')).getTime();
                const now = new Date().getTime();
                const diff = end - now;

                if (diff <= 0) {
                    el.innerText = "LIBERADO!";
                    // If the view is investments, trigger a re-render to reveal
                    if (State.currentView === 'investments') {
                        // Logic to avoid infinite re-renders
                        if (!el.dataset.expired) {
                            el.dataset.expired = "true";
                            Router.render();
                        }
                    }
                    return;
                }

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff / 1000 / 60) % 60);
                const secs = Math.floor((diff / 1000) % 60);

                let str = "";
                if (days > 0) str += `${days}d `;
                str += `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

                const prefix = el.innerText.includes('Abre em') ? 'Abre em: ' : '';
                el.innerText = prefix + str;
            });
        }, 1000);

        // Setup Navigation Listeners
        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.getAttribute('data-view');

                // Mark active tab
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');

                Router.navigate(view);
            });
        });

        // Start App
        Router.render();
    });
})();
